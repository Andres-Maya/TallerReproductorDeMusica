import { SessionManager } from './app/SessionManager';
import { StateManager } from './app/StateManager';
import { AuthApi } from './api/AuthApi';
import { ApiClient } from './api/ApiClient';
import { LoginForm } from './ui/components/LoginForm';
import { RegisterForm } from './ui/components/RegisterForm';
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
 */

// Initialize global services
const apiClient = new ApiClient();
const authApi = new AuthApi(apiClient);
const sessionManager = new SessionManager();
const stateManager = new StateManager();
const errorBoundary = new ErrorBoundary();

// Initialize Toast (static class)
Toast.init();

// Get app container
const appContainer = document.getElementById('app');
if (!appContainer) {
  throw new Error('App container not found');
}

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
        <div class="welcome-message">
          <h2>Welcome to Waveline!</h2>
          <p>Your music player is ready. Playlist management coming soon...</p>
          <p class="info">✅ Authentication working</p>
          <p class="info">✅ Backend connected</p>
          <p class="info">⏳ Playlist UI in progress</p>
        </div>
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
}

/**
 * Handle successful authentication
 */
function handleAuthSuccess(): void {
  Toast.success('Login successful!');
  renderMainView();
}

/**
 * Handle logout
 */
async function handleLogout(): Promise<void> {
  try {
    await authApi.logout();
    sessionManager.clearSession();
    stateManager.clearUser();
    Toast.success('Logged out successfully');
    renderAuthView();
  } catch (error) {
    Toast.error('Logout failed');
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
  Toast.error('Session expired. Please login again.');
  renderAuthView();
});

// Initialize the application
initializeApp();
