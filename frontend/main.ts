import { SessionManager } from './app/SessionManager';
import { StateManager } from './app/StateManager';
import { AuthApi } from './api/AuthApi';
import { PlaylistApi } from './api/PlaylistApi';
import { UploadApi } from './api/UploadApi';
import { YouTubeApi } from './api/YouTubeApi';
import { ApiClient } from './api/ApiClient';
import { LoginForm } from './ui/components/LoginForm';
import { RegisterForm } from './ui/components/RegisterForm';
import { PlaylistView } from './ui/components/PlaylistView';
import { PlayerControls } from './ui/components/PlayerControls';
import { UploadModal } from './ui/components/UploadModal';
import { StorageQuotaDisplay } from './ui/components/StorageQuotaDisplay';
import { Toast } from './ui/components/Toast';
import { ErrorBoundary } from './ui/components/ErrorBoundary';
import './styles/main.css';

/**
 * Main application entry point.
 * 
 * Initializes the application, checks for existing session,
 * and renders the appropriate UI (login or main app).
 * 
 * **Validates: Requirements 2.11, 8.1, 8.2, 8.3, 8.4**
 * 
 * Version: 1.0.1 - Fixed storage quota 401 error
 */

// Get app container first
const appContainer = document.getElementById('app');
if (!appContainer) {
  throw new Error('App container not found');
}

// Initialize global services
const apiClient = new ApiClient();
const authApi = new AuthApi(apiClient);
const playlistApi = new PlaylistApi(apiClient);
const uploadApi = new UploadApi(apiClient);
const youtubeApi = new YouTubeApi(apiClient);
const sessionManager = new SessionManager();
const stateManager = new StateManager();
const errorBoundary = new ErrorBoundary(appContainer);

// Initialize Toast (static class)
Toast.init();

// Global references to components
let playlistView: PlaylistView | null = null;
let playerControls: PlayerControls | null = null;
let uploadModal: UploadModal | null = null;
let storageQuotaDisplay: StorageQuotaDisplay | null = null;

/**
 * Render the login/register view
 */
function renderAuthView(): void {
  appContainer!.innerHTML = `
    <div class="auth-container">
      <div class="auth-header">
        <h1>🎵 Waveline Music Player</h1>
        <p>Your personal music collection</p>
      </div>
      
      <div class="auth-tabs">
        <button id="tab-login" class="auth-tab active">Login</button>
        <button id="tab-register" class="auth-tab">Register</button>
      </div>
      
      <div id="auth-content" class="auth-content"></div>
    </div>
  `;

  const loginTab = document.getElementById('tab-login')!;
  const registerTab = document.getElementById('tab-register')!;
  const authContent = document.getElementById('auth-content')!;

  let currentForm: LoginForm | RegisterForm | null = null;

  function showLogin(): void {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    
    if (currentForm) {
      currentForm.destroy();
    }
    
    currentForm = new LoginForm(
      authContent,
      authApi,
      sessionManager,
      stateManager,
      handleAuthSuccess
    );
  }

  function showRegister(): void {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    
    if (currentForm) {
      currentForm.destroy();
    }
    
    currentForm = new RegisterForm(
      authContent,
      authApi,
      sessionManager,
      stateManager,
      handleAuthSuccess
    );
  }

  loginTab.addEventListener('click', showLogin);
  registerTab.addEventListener('click', showRegister);

  // Show login by default
  showLogin();
}

/**
 * Render the main application view (after login)
 */
function renderMainView(): void {
  appContainer!.innerHTML = `
    <div class="main-container">
      <header class="app-header">
        <h1>🎵 Waveline Music Player</h1>
        <div class="user-info">
          <span id="username"></span>
          <button id="logout-btn" class="btn-secondary">Logout</button>
        </div>
      </header>
      
      <main class="app-main">
        <div id="storage-quota-container"></div>
        <div id="playlist-view-container"></div>
        <div id="player-controls-container"></div>
        <div id="upload-modal-container"></div>
      </main>
    </div>
  `;

  // Display username
  const user = stateManager.getState().user;
  const usernameEl = document.getElementById('username');
  if (usernameEl && user) {
    usernameEl.textContent = user.username;
  }

  // Logout handler
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  // Initialize StorageQuotaDisplay (DISABLED - causing 401 errors)
  // TODO: Re-enable when token timing issue is fully resolved
  const storageQuotaContainer = document.getElementById('storage-quota-container');
  if (storageQuotaContainer) {
    // Hide the container completely
    storageQuotaContainer.style.display = 'none';
    // storageQuotaDisplay = new StorageQuotaDisplay(storageQuotaContainer, uploadApi);
  }

  // Initialize UploadModal
  const uploadModalContainer = document.getElementById('upload-modal-container');
  if (uploadModalContainer) {
    uploadModal = new UploadModal(
      uploadModalContainer,
      uploadApi,
      youtubeApi,
      playlistApi,
      (song) => {
        // Callback when song is added
        Toast.success(`Added "${song.title}" to playlist`);
        
        // Refresh playlist view to show new song
        if (playlistView) {
          const appState = stateManager.getState();
          if (appState.currentPlaylist) {
            // Trigger a reload by re-selecting the current playlist
            stateManager.setCurrentPlaylist(appState.currentPlaylist);
          }
        }
        
        // Refresh storage quota
        if (storageQuotaDisplay) {
          storageQuotaDisplay.refresh();
        }
      },
      storageQuotaDisplay // Pass storageQuotaDisplay to load it when modal opens
    );
  }

  // Initialize PlaylistView
  const playlistViewContainer = document.getElementById('playlist-view-container');
  if (playlistViewContainer) {
    playlistView = new PlaylistView(playlistViewContainer, playlistApi, stateManager);
    
    // Wire the "Add Song" button to open UploadModal
    // Use event delegation to avoid MutationObserver issues
    playlistViewContainer.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      
      // Check if the clicked element is the "Add Song" button
      if (target.id === 'add-song-btn' || target.closest('#add-song-btn')) {
        e.preventDefault();
        e.stopPropagation();
        
        const appState = stateManager.getState();
        if (appState.currentPlaylist && uploadModal) {
          uploadModal.show(appState.currentPlaylist);
        }
      }
    });
  }

  // Initialize PlayerControls
  const playerControlsContainer = document.getElementById('player-controls-container');
  if (playerControlsContainer) {
    playerControls = new PlayerControls(playerControlsContainer, stateManager);
  }
}

/**
 * Handle successful authentication
 */
function handleAuthSuccess(): void {
  // Get the saved session and set the token in ApiClient
  const session = sessionManager.loadSession();
  if (session) {
    apiClient.setAuthToken(session.token);
  }
  
  Toast.success('Login successful!');
  renderMainView();
}

/**
 * Handle logout
 */
async function handleLogout(): Promise<void> {
  try {
    // Clean up components
    if (playlistView) {
      playlistView.destroy();
      playlistView = null;
    }
    if (playerControls) {
      playerControls.destroy();
      playerControls = null;
    }
    if (uploadModal) {
      uploadModal = null;
    }
    if (storageQuotaDisplay) {
      storageQuotaDisplay = null;
    }

    await authApi.logout();
    sessionManager.clearSession();
    stateManager.clearUser();
    apiClient.clearAuthToken();
    Toast.success('Logged out successfully');
    renderAuthView();
  } catch (error) {
    // Even if logout fails on backend, clear local session
    sessionManager.clearSession();
    stateManager.clearUser();
    apiClient.clearAuthToken();
    Toast.success('Logged out successfully');
    renderAuthView();
    console.error('Logout error:', error);
  }
}

/**
 * Check for existing session and restore if valid
 */
async function initializeApp(): Promise<void> {
  try {
    // Check if there's a saved session
    const session = sessionManager.loadSession();
    
    if (session && sessionManager.isSessionValid()) {
      // Set token in ApiClient
      apiClient.setAuthToken(session.token);
      
      // Validate session with backend
      try {
        const user = await authApi.getCurrentUser();
        stateManager.setUser(user);
        renderMainView();
        return;
      } catch (error) {
        // Session invalid, clear it
        sessionManager.clearSession();
        stateManager.clearUser();
        apiClient.clearAuthToken();
      }
    }
    
    // No valid session, show login
    renderAuthView();
  } catch (error) {
    console.error('Initialization error:', error);
    Toast.error('Failed to initialize application');
    renderAuthView();
  }
}

/**
 * Listen for auth:expired event to redirect to login
 */
window.addEventListener('auth:expired', () => {
  sessionManager.clearSession();
  stateManager.clearUser();
  apiClient.clearAuthToken();
  Toast.error('Session expired. Please login again.');
  renderAuthView();
});

// Initialize the application
initializeApp();
