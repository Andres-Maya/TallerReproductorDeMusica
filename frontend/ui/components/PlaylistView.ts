/**
 * PlaylistView - Playlist management component
 * 
 * Features:
 * - Display list of user's playlists from state
 * - "New Playlist" button with name input
 * - Playlist selection (set currentPlaylist in state)
 * - Display songs in selected playlist
 * - "Add Song" functionality with title, artist, audioUrl inputs
 * - "Delete Playlist" button with confirmation
 * 
 * Requirements: 2.11, 3.5, 1.2
 */

import { PlaylistApi, SongDTO } from '../../api/PlaylistApi';
import { StateManager, Playlist } from '../../app/StateManager';

/**
 * PlaylistView component state
 */
interface PlaylistViewState {
  isLoading: boolean;
  isCreatingPlaylist: boolean;
  isAddingSong: boolean;
  showNewPlaylistModal: boolean;
  showAddSongModal: boolean;
  showDeleteConfirmModal: boolean;
  newPlaylistName: string;
  newSong: {
    title: string;
    artist: string;
    audioUrl: string;
  };
  playlistToDelete: string | null;
  errors: {
    newPlaylist?: string;
    addSong?: string;
    general?: string;
  };
  songs: SongDTO[];
}

/**
 * PlaylistView - Manages playlist display and operations
 * 
 * This component renders the playlist management interface including
 * playlist list, song list, and modals for creating playlists and adding songs.
 * 
 * Requirements: 2.11, 3.5, 1.2
 */
export class PlaylistView {
  private container: HTMLElement;
  private playlistApi: PlaylistApi;
  private stateManager: StateManager;
  private state: PlaylistViewState;
  private unsubscribe?: () => void;

  constructor(
    container: HTMLElement,
    playlistApi: PlaylistApi,
    stateManager: StateManager
  ) {
    this.container = container;
    this.playlistApi = playlistApi;
    this.stateManager = stateManager;

    // Initialize state
    this.state = {
      isLoading: false,
      isCreatingPlaylist: false,
      isAddingSong: false,
      showNewPlaylistModal: false,
      showAddSongModal: false,
      showDeleteConfirmModal: false,
      newPlaylistName: '',
      newSong: {
        title: '',
        artist: '',
        audioUrl: '',
      },
      playlistToDelete: null,
      errors: {},
      songs: [],
    };

    // Subscribe to state changes
    this.unsubscribe = this.stateManager.subscribe((appState) => {
      this.handleStateChange(appState);
    });

    // Initial render
    this.render();
    this.attachEventListeners();
    
    // Load playlists on mount
    this.loadPlaylists();
  }

  /**
   * Handle state changes from StateManager
   * 
   * @param appState - Current application state
   * 
   * Requirements: 1.2
   */
  private handleStateChange(appState: Readonly<typeof appState>): void {
    // Re-render when playlists or currentPlaylist changes
    this.render();
    this.attachEventListeners();
    
    // Load songs when currentPlaylist changes
    if (appState.currentPlaylist) {
      this.loadSongs(appState.currentPlaylist);
    }
  }

  /**
   * Load playlists from API
   * 
   * Requirements: 2.11
   */
  private async loadPlaylists(): Promise<void> {
    this.updateState({ isLoading: true, errors: {} });

    try {
      const playlists = await this.playlistApi.getPlaylists();
      this.stateManager.setPlaylists(playlists);
    } catch (error) {
      this.handleError(error, 'Failed to load playlists');
    } finally {
      this.updateState({ isLoading: false });
    }
  }

  /**
   * Load songs for a specific playlist
   * 
   * @param playlistId - ID of the playlist to load songs for
   * 
   * Requirements: 3.5
   */
  private async loadSongs(playlistId: string): Promise<void> {
    try {
      const songs = await this.playlistApi.getSongs(playlistId);
      this.updateState({ songs });
    } catch (error) {
      this.handleError(error, 'Failed to load songs');
    }
  }

  /**
   * Create a new playlist
   * 
   * Requirements: 2.11
   */
  private async createPlaylist(): Promise<void> {
    // Validate playlist name
    if (!this.state.newPlaylistName.trim()) {
      this.updateState({
        errors: { ...this.state.errors, newPlaylist: 'Playlist name is required' }
      });
      return;
    }

    this.updateState({ isCreatingPlaylist: true, errors: {} });

    try {
      const newPlaylist = await this.playlistApi.createPlaylist(this.state.newPlaylistName.trim());

      // Update playlists in state
      const appState = this.stateManager.getState();
      this.stateManager.setPlaylists([...appState.playlists, newPlaylist]);

      // Close modal and reset form
      this.updateState({
        showNewPlaylistModal: false,
        newPlaylistName: '',
        isCreatingPlaylist: false,
      });
    } catch (error) {
      this.handleError(error, 'Failed to create playlist', 'newPlaylist');
      this.updateState({ isCreatingPlaylist: false });
    }
  }

  /**
   * Select a playlist
   * 
   * @param playlistId - ID of the playlist to select
   * 
   * Requirements: 2.11
   */
  private selectPlaylist(playlistId: string): void {
    this.stateManager.setCurrentPlaylist(playlistId);
  }

  /**
   * Add a song to the current playlist
   * 
   * Requirements: 3.5, 5.8
   */
  private async addSong(): Promise<void> {
    const appState = this.stateManager.getState();
    
    if (!appState.currentPlaylist) {
      this.updateState({
        errors: { ...this.state.errors, addSong: 'Please select a playlist first' }
      });
      return;
    }

    // Validate song inputs
    if (!this.state.newSong.title.trim()) {
      this.updateState({
        errors: { ...this.state.errors, addSong: 'Song title is required' }
      });
      return;
    }

    if (!this.state.newSong.artist.trim()) {
      this.updateState({
        errors: { ...this.state.errors, addSong: 'Artist name is required' }
      });
      return;
    }

    if (!this.state.newSong.audioUrl.trim()) {
      this.updateState({
        errors: { ...this.state.errors, addSong: 'Audio URL is required' }
      });
      return;
    }

    // Validate URL format
    try {
      new URL(this.state.newSong.audioUrl);
    } catch {
      this.updateState({
        errors: { ...this.state.errors, addSong: 'Audio URL must be a valid URL' }
      });
      return;
    }

    // Check for duplicate song title (case-insensitive)
    const newTitle = this.state.newSong.title.trim();
    const isDuplicate = this.state.songs.some(
      s => s.title.toLowerCase() === newTitle.toLowerCase()
    );

    if (isDuplicate) {
      this.updateState({
        errors: { ...this.state.errors, addSong: 'A song with this title already exists in the playlist' }
      });
      return;
    }

    this.updateState({ isAddingSong: true, errors: {} });

    try {
      const newSong = await this.playlistApi.addSong(appState.currentPlaylist, {
        title: this.state.newSong.title.trim(),
        artist: this.state.newSong.artist.trim(),
        audioUrl: this.state.newSong.audioUrl.trim(),
      });

      // Update songs list
      this.updateState({
        songs: [...this.state.songs, newSong],
        showAddSongModal: false,
        newSong: { title: '', artist: '', audioUrl: '' },
        isAddingSong: false,
      });
    } catch (error) {
      this.handleError(error, 'Failed to add song', 'addSong');
      this.updateState({ isAddingSong: false });
    }
  }

  /**
   * Delete a playlist
   * 
   * @param playlistId - ID of the playlist to delete
   * 
   * Requirements: 2.11
   */
  private async deletePlaylist(playlistId: string): Promise<void> {
    this.updateState({ isLoading: true, errors: {} });

    try {
      await this.playlistApi.deletePlaylist(playlistId);

      // Update playlists in state
      const appState = this.stateManager.getState();
      const updatedPlaylists = appState.playlists.filter(p => p.id !== playlistId);
      this.stateManager.setPlaylists(updatedPlaylists);

      // Clear current playlist if it was deleted
      if (appState.currentPlaylist === playlistId) {
        this.stateManager.setCurrentPlaylist('');
        this.updateState({ songs: [] });
      }

      // Close modal
      this.updateState({
        showDeleteConfirmModal: false,
        playlistToDelete: null,
        isLoading: false,
      });
    } catch (error) {
      this.handleError(error, 'Failed to delete playlist');
      this.updateState({ isLoading: false });
    }
  }

  /**
   * Render the playlist view
   * 
   * Requirements: 2.11, 3.5
   */
  private render(): void {
    const appState = this.stateManager.getState();
    const currentPlaylist = appState.playlists.find(p => p.id === appState.currentPlaylist);

    this.container.innerHTML = `
      <div class="playlist-view-container">
        <div class="playlist-view-header">
          <h1 class="playlist-view-title">My Playlists</h1>
          <button id="new-playlist-btn" class="btn-primary">
            + New Playlist
          </button>
        </div>

        ${this.state.errors.general ? `
          <div class="error-message">
            ${this.escapeHtml(this.state.errors.general)}
          </div>
        ` : ''}

        <div class="playlist-view-content">
          <!-- Playlists List -->
          <div class="playlists-section">
            <h2 class="section-title">Playlists</h2>
            ${this.state.isLoading ? `
              <div class="loading-message">Loading playlists...</div>
            ` : appState.playlists.length === 0 ? `
              <div class="empty-message">
                No playlists yet. Create your first playlist!
              </div>
            ` : `
              <ul class="playlists-list">
                ${appState.playlists.map(playlist => `
                  <li class="playlist-item ${playlist.id === appState.currentPlaylist ? 'playlist-item-active' : ''}"
                      data-playlist-id="${playlist.id}">
                    <div class="playlist-info">
                      <div class="playlist-name">${this.escapeHtml(playlist.name)}</div>
                      <div class="playlist-meta">${playlist.songCount || 0} songs</div>
                    </div>
                    <button class="btn-delete-playlist" data-playlist-id="${playlist.id}" title="Delete playlist">
                      🗑️
                    </button>
                  </li>
                `).join('')}
              </ul>
            `}
          </div>

          <!-- Songs List -->
          <div class="songs-section">
            ${currentPlaylist ? `
              <div class="songs-header">
                <h2 class="section-title">${this.escapeHtml(currentPlaylist.name)}</h2>
                <button id="add-song-btn" class="btn-secondary">
                  + Add Song
                </button>
              </div>
              ${this.state.songs.length === 0 ? `
                <div class="empty-message">
                  No songs in this playlist. Add your first song!
                </div>
              ` : `
                <ul class="songs-list">
                  ${this.state.songs.map((song, index) => `
                    <li class="song-item" data-song-id="${song.id}" data-song-index="${index}">
                      <div class="song-info">
                        <div class="song-title">${this.escapeHtml(song.title)}</div>
                        <div class="song-artist">${this.escapeHtml(song.artist)}</div>
                      </div>
                      <div class="song-actions">
                        <button 
                          class="btn-move-song btn-move-up" 
                          data-song-id="${song.id}" 
                          data-song-index="${index}"
                          ${index === 0 ? 'disabled' : ''}
                          title="Move up">
                          ⬆️
                        </button>
                        <button 
                          class="btn-move-song btn-move-down" 
                          data-song-id="${song.id}" 
                          data-song-index="${index}"
                          ${index === this.state.songs.length - 1 ? 'disabled' : ''}
                          title="Move down">
                          ⬇️
                        </button>
                      </div>
                    </li>
                  `).join('')}
                </ul>
              `}
            ` : `
              <div class="empty-message">
                Select a playlist to view its songs
              </div>
            `}
          </div>
        </div>

        <!-- New Playlist Modal -->
        ${this.state.showNewPlaylistModal ? `
          <div class="modal-overlay">
            <div class="modal">
              <div class="modal-header">
                <h3 class="modal-title">Create New Playlist</h3>
                <button class="modal-close" id="close-new-playlist-modal">&times;</button>
              </div>
              <div class="modal-body">
                ${this.state.errors.newPlaylist ? `
                  <div class="form-error-general">
                    ${this.escapeHtml(this.state.errors.newPlaylist)}
                  </div>
                ` : ''}
                <div class="form-group">
                  <label for="playlist-name" class="form-label">Playlist Name</label>
                  <input
                    type="text"
                    id="playlist-name"
                    class="form-input"
                    value="${this.escapeHtml(this.state.newPlaylistName)}"
                    placeholder="Enter playlist name"
                    ${this.state.isCreatingPlaylist ? 'disabled' : ''}
                  />
                </div>
              </div>
              <div class="modal-footer">
                <button class="btn-secondary" id="cancel-new-playlist" ${this.state.isCreatingPlaylist ? 'disabled' : ''}>
                  Cancel
                </button>
                <button class="btn-primary" id="create-playlist-btn" ${this.state.isCreatingPlaylist ? 'disabled' : ''}>
                  ${this.state.isCreatingPlaylist ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- Add Song Modal -->
        ${this.state.showAddSongModal ? `
          <div class="modal-overlay">
            <div class="modal">
              <div class="modal-header">
                <h3 class="modal-title">Add Song</h3>
                <button class="modal-close" id="close-add-song-modal">&times;</button>
              </div>
              <div class="modal-body">
                ${this.state.errors.addSong ? `
                  <div class="form-error-general">
                    ${this.escapeHtml(this.state.errors.addSong)}
                  </div>
                ` : ''}
                <div class="form-group">
                  <label for="song-title" class="form-label">Title</label>
                  <input
                    type="text"
                    id="song-title"
                    class="form-input"
                    value="${this.escapeHtml(this.state.newSong.title)}"
                    placeholder="Enter song title"
                    ${this.state.isAddingSong ? 'disabled' : ''}
                  />
                </div>
                <div class="form-group">
                  <label for="song-artist" class="form-label">Artist</label>
                  <input
                    type="text"
                    id="song-artist"
                    class="form-input"
                    value="${this.escapeHtml(this.state.newSong.artist)}"
                    placeholder="Enter artist name"
                    ${this.state.isAddingSong ? 'disabled' : ''}
                  />
                </div>
                <div class="form-group">
                  <label for="song-url" class="form-label">Audio URL</label>
                  <input
                    type="url"
                    id="song-url"
                    class="form-input"
                    value="${this.escapeHtml(this.state.newSong.audioUrl)}"
                    placeholder="https://example.com/song.mp3"
                    ${this.state.isAddingSong ? 'disabled' : ''}
                  />
                </div>
              </div>
              <div class="modal-footer">
                <button class="btn-secondary" id="cancel-add-song" ${this.state.isAddingSong ? 'disabled' : ''}>
                  Cancel
                </button>
                <button class="btn-primary" id="add-song-submit-btn" ${this.state.isAddingSong ? 'disabled' : ''}>
                  ${this.state.isAddingSong ? 'Adding...' : 'Add Song'}
                </button>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- Delete Confirmation Modal -->
        ${this.state.showDeleteConfirmModal && this.state.playlistToDelete ? `
          <div class="modal-overlay">
            <div class="modal modal-small">
              <div class="modal-header">
                <h3 class="modal-title">Delete Playlist</h3>
                <button class="modal-close" id="close-delete-modal">&times;</button>
              </div>
              <div class="modal-body">
                <p>Are you sure you want to delete this playlist? This action cannot be undone.</p>
              </div>
              <div class="modal-footer">
                <button class="btn-secondary" id="cancel-delete">
                  Cancel
                </button>
                <button class="btn-danger" id="confirm-delete-btn">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    `;

    this.addStyles();
  }

  /**
   * Attach event listeners
   * 
   * @private
   */
  private attachEventListeners(): void {
    // New Playlist button
    const newPlaylistBtn = this.container.querySelector('#new-playlist-btn');
    newPlaylistBtn?.addEventListener('click', () => {
      this.updateState({ showNewPlaylistModal: true, newPlaylistName: '', errors: {} });
    });

    // Playlist items (selection)
    const playlistItems = this.container.querySelectorAll('.playlist-item');
    playlistItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        // Don't select if clicking delete button
        if (target.classList.contains('btn-delete-playlist')) {
          return;
        }
        const playlistId = (item as HTMLElement).dataset.playlistId;
        if (playlistId) {
          this.selectPlaylist(playlistId);
        }
      });
    });

    // Delete playlist buttons
    const deleteButtons = this.container.querySelectorAll('.btn-delete-playlist');
    deleteButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const playlistId = (btn as HTMLElement).dataset.playlistId;
        if (playlistId) {
          this.updateState({
            showDeleteConfirmModal: true,
            playlistToDelete: playlistId,
          });
        }
      });
    });

    // Add Song button
    const addSongBtn = this.container.querySelector('#add-song-btn');
    addSongBtn?.addEventListener('click', () => {
      this.updateState({
        showAddSongModal: true,
        newSong: { title: '', artist: '', audioUrl: '' },
        errors: {},
      });
    });

    // New Playlist Modal
    this.attachNewPlaylistModalListeners();

    // Add Song Modal
    this.attachAddSongModalListeners();

    // Delete Confirmation Modal
    this.attachDeleteModalListeners();

    // Song items (click to play)
    this.attachSongClickListeners();

    // Move song buttons
    this.attachMoveSongListeners();
  }

  /**
   * Attach event listeners for new playlist modal
   * 
   * @private
   */
  private attachNewPlaylistModalListeners(): void {
    const playlistNameInput = this.container.querySelector('#playlist-name') as HTMLInputElement;
    const createBtn = this.container.querySelector('#create-playlist-btn');
    const cancelBtn = this.container.querySelector('#cancel-new-playlist');
    const closeBtn = this.container.querySelector('#close-new-playlist-modal');

    playlistNameInput?.addEventListener('input', () => {
      this.state.newPlaylistName = playlistNameInput.value;
      if (this.state.errors.newPlaylist) {
        this.updateState({ errors: { ...this.state.errors, newPlaylist: undefined } });
      }
    });

    createBtn?.addEventListener('click', () => {
      this.createPlaylist();
    });

    cancelBtn?.addEventListener('click', () => {
      this.updateState({ showNewPlaylistModal: false, newPlaylistName: '', errors: {} });
    });

    closeBtn?.addEventListener('click', () => {
      this.updateState({ showNewPlaylistModal: false, newPlaylistName: '', errors: {} });
    });
  }

  /**
   * Attach event listeners for add song modal
   * 
   * @private
   */
  private attachAddSongModalListeners(): void {
    const titleInput = this.container.querySelector('#song-title') as HTMLInputElement;
    const artistInput = this.container.querySelector('#song-artist') as HTMLInputElement;
    const urlInput = this.container.querySelector('#song-url') as HTMLInputElement;
    const addBtn = this.container.querySelector('#add-song-submit-btn');
    const cancelBtn = this.container.querySelector('#cancel-add-song');
    const closeBtn = this.container.querySelector('#close-add-song-modal');

    titleInput?.addEventListener('input', () => {
      this.state.newSong.title = titleInput.value;
      if (this.state.errors.addSong) {
        this.updateState({ errors: { ...this.state.errors, addSong: undefined } });
      }
    });

    artistInput?.addEventListener('input', () => {
      this.state.newSong.artist = artistInput.value;
      if (this.state.errors.addSong) {
        this.updateState({ errors: { ...this.state.errors, addSong: undefined } });
      }
    });

    urlInput?.addEventListener('input', () => {
      this.state.newSong.audioUrl = urlInput.value;
      if (this.state.errors.addSong) {
        this.updateState({ errors: { ...this.state.errors, addSong: undefined } });
      }
    });

    addBtn?.addEventListener('click', () => {
      this.addSong();
    });

    cancelBtn?.addEventListener('click', () => {
      this.updateState({
        showAddSongModal: false,
        newSong: { title: '', artist: '', audioUrl: '' },
        errors: {},
      });
    });

    closeBtn?.addEventListener('click', () => {
      this.updateState({
        showAddSongModal: false,
        newSong: { title: '', artist: '', audioUrl: '' },
        errors: {},
      });
    });
  }

  /**
   * Attach event listeners for delete confirmation modal
   * 
   * @private
   */
  private attachDeleteModalListeners(): void {
    const confirmBtn = this.container.querySelector('#confirm-delete-btn');
    const cancelBtn = this.container.querySelector('#cancel-delete');
    const closeBtn = this.container.querySelector('#close-delete-modal');

    confirmBtn?.addEventListener('click', () => {
      if (this.state.playlistToDelete) {
        this.deletePlaylist(this.state.playlistToDelete);
      }
    });

    cancelBtn?.addEventListener('click', () => {
      this.updateState({
        showDeleteConfirmModal: false,
        playlistToDelete: null,
      });
    });

    closeBtn?.addEventListener('click', () => {
      this.updateState({
        showDeleteConfirmModal: false,
        playlistToDelete: null,
      });
    });
  }

  /**
   * Attach event listeners for song items (click to play)
   * 
   * @private
   */
  private attachSongClickListeners(): void {
    const songItems = this.container.querySelectorAll('.song-item');
    songItems.forEach(item => {
      item.addEventListener('click', () => {
        const songId = (item as HTMLElement).dataset.songId;
        const songIndex = parseInt((item as HTMLElement).dataset.songIndex || '0', 10);
        
        if (songId) {
          this.playSong(songId, songIndex);
        }
      });
    });
  }

  /**
   * Play a song from the current playlist
   * 
   * @param songId - ID of the song to play
   * @param songIndex - Index of the song in the playlist
   * 
   * Requirements: 3.6, 3.7, 3.8
   * 
   * @private
   */
  private playSong(songId: string, songIndex: number): void {
    const appState = this.stateManager.getState();
    const currentPlaylist = appState.playlists.find(p => p.id === appState.currentPlaylist);
    
    if (!currentPlaylist) {
      return;
    }

    const song = this.state.songs.find(s => s.id === songId);
    
    if (!song) {
      return;
    }

    // Set playback state in StateManager
    this.stateManager.setPlaybackState({
      currentSong: song,
      playlistId: currentPlaylist.id,
      playlistName: currentPlaylist.name,
      currentIndex: songIndex,
      totalTracks: this.state.songs.length,
      hasPrevious: songIndex > 0,
      hasNext: songIndex < this.state.songs.length - 1,
    });
  }

  /**
   * Attach event listeners for move song buttons
   * 
   * @private
   */
  private attachMoveSongListeners(): void {
    const moveUpButtons = this.container.querySelectorAll('.btn-move-up');
    const moveDownButtons = this.container.querySelectorAll('.btn-move-down');

    moveUpButtons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const songId = (btn as HTMLElement).dataset.songId;
        const songIndex = parseInt((btn as HTMLElement).dataset.songIndex || '0', 10);
        
        if (songId && songIndex > 0) {
          await this.moveSong(songId, songIndex, songIndex - 1);
        }
      });
    });

    moveDownButtons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const songId = (btn as HTMLElement).dataset.songId;
        const songIndex = parseInt((btn as HTMLElement).dataset.songIndex || '0', 10);
        
        if (songId && songIndex < this.state.songs.length - 1) {
          await this.moveSong(songId, songIndex, songIndex + 1);
        }
      });
    });
  }

  /**
   * Move a song to a new position
   * 
   * @param songId - ID of the song to move
   * @param currentIndex - Current index of the song
   * @param newIndex - New index for the song
   * 
   * Requirements: 3.5
   * 
   * @private
   */
  private async moveSong(songId: string, currentIndex: number, newIndex: number): Promise<void> {
    const appState = this.stateManager.getState();
    
    if (!appState.currentPlaylist) {
      return;
    }

    // Optimistically update local state
    const songs = [...this.state.songs];
    const [song] = songs.splice(currentIndex, 1);
    songs.splice(newIndex, 0, song);
    this.updateState({ songs });

    try {
      // Call backend API
      await this.playlistApi.moveSong(appState.currentPlaylist, songId, newIndex);
      
      // Refresh songs to ensure consistency
      await this.loadSongs(appState.currentPlaylist);
    } catch (error) {
      // Revert on error
      this.handleError(error, 'Failed to reorder song');
      await this.loadSongs(appState.currentPlaylist);
    }
  }

  /**
   * Handle errors from API calls
   * 
   * @param error - Error object
   * @param defaultMessage - Default error message
   * @param field - Specific field to set error for
   * 
   * @private
   */
  private handleError(error: unknown, defaultMessage: string, field?: 'newPlaylist' | 'addSong'): void {
    let errorMessage = defaultMessage;

    if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = (error as { message: string }).message;
    }

    if (field) {
      this.updateState({
        errors: { ...this.state.errors, [field]: errorMessage }
      });
    } else {
      this.updateState({
        errors: { ...this.state.errors, general: errorMessage }
      });
    }
  }

  /**
   * Update component state and re-render
   * 
   * @param partial - Partial state to update
   * 
   * @private
   */
  private updateState(partial: Partial<PlaylistViewState>): void {
    this.state = { ...this.state, ...partial };
    this.render();
    this.attachEventListeners();
  }

  /**
   * Escape HTML to prevent XSS attacks
   * 
   * @param text - Text to escape
   * @returns HTML-escaped text
   * 
   * @private
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Add inline styles for the playlist view
   * 
   * @private
   */
  private addStyles(): void {
    // Check if styles are already added
    if (document.getElementById('playlist-view-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'playlist-view-styles';
    style.textContent = `
      .playlist-view-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
      }

      .playlist-view-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
      }

      .playlist-view-title {
        margin: 0;
        font-size: 2rem;
        font-weight: 700;
        color: #1a202c;
      }

      .playlist-view-content {
        display: grid;
        grid-template-columns: 1fr 2fr;
        gap: 2rem;
      }

      .section-title {
        margin: 0 0 1rem 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #2d3748;
      }

      .playlists-section,
      .songs-section {
        background: white;
        border-radius: 8px;
        padding: 1.5rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .songs-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }

      .playlists-list,
      .songs-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .playlist-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        margin-bottom: 0.5rem;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        border: 2px solid transparent;
      }

      .playlist-item:hover {
        background-color: #2c3338ff;
      }

      .playlist-item-active {
        background-color: #2a2f36ff;
        border-color: #07070aff;
      }

      .playlist-info {
        flex: 1;
      }

      .playlist-name {
        font-weight: 600;
        color: #e9eaecff;
        margin-bottom: 0.25rem;
      }

      .playlist-meta {
        font-size: 0.85rem;
        color: #2f3641ff;
      }

      .btn-delete-playlist {
        background: none;
        border: none;
        font-size: 1.2rem;
        cursor: pointer;
        padding: 0.25rem 0.5rem;
        opacity: 0.6;
        transition: opacity 0.2s;
      }

      .btn-delete-playlist:hover {
        opacity: 1;
      }

      .song-item {
        padding: 1rem;
        margin-bottom: 0.5rem;
        border-radius: 6px;
        background-color: #f7fafc;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .song-item:hover {
        background-color: #edf2f7;
        transform: translateX(4px);
      }

      .song-info {
        flex: 1;
      }

      .song-title {
        font-weight: 600;
        color: #2d3748;
        margin-bottom: 0.25rem;
      }

      .song-artist {
        font-size: 0.9rem;
        color: #718096;
      }

      .song-actions {
        display: flex;
        gap: 0.5rem;
        margin-left: 1rem;
      }

      .btn-move-song {
        background: none;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        font-size: 1rem;
        cursor: pointer;
        padding: 0.25rem 0.5rem;
        transition: all 0.2s;
        opacity: 0.7;
      }

      .btn-move-song:hover:not(:disabled) {
        opacity: 1;
        background-color: #edf2f7;
        border-color: #cbd5e0;
      }

      .btn-move-song:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }

      .loading-message,
      .empty-message {
        text-align: center;
        padding: 2rem;
        color: #718096;
        font-size: 0.95rem;
      }

      .error-message {
        padding: 1rem;
        margin-bottom: 1rem;
        background-color: #fee;
        border: 1px solid #fcc;
        border-radius: 6px;
        color: #c33;
      }

      .btn-primary {
        padding: 0.75rem 1.5rem;
        font-size: 0.95rem;
        font-weight: 600;
        color: white;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn-primary:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }

      .btn-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .btn-secondary {
        padding: 0.75rem 1.5rem;
        font-size: 0.95rem;
        font-weight: 600;
        color: #4a5568;
        background: white;
        border: 2px solid #e2e8f0;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn-secondary:hover:not(:disabled) {
        background-color: #f7fafc;
        border-color: #cbd5e0;
      }

      .btn-secondary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .btn-danger {
        padding: 0.75rem 1.5rem;
        font-size: 0.95rem;
        font-weight: 600;
        color: white;
        background: #e53e3e;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn-danger:hover {
        background: #c53030;
      }

      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .modal {
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        width: 90%;
        max-width: 500px;
        max-height: 90vh;
        overflow-y: auto;
      }

      .modal-small {
        max-width: 400px;
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        border-bottom: 1px solid #e2e8f0;
      }

      .modal-title {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #1a202c;
      }

      .modal-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #718096;
        padding: 0;
        width: 2rem;
        height: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: all 0.2s;
      }

      .modal-close:hover {
        background-color: #f7fafc;
        color: #2d3748;
      }

      .modal-body {
        padding: 1.5rem;
      }

      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        padding: 1.5rem;
        border-top: 1px solid #e2e8f0;
      }

      .form-group {
        margin-bottom: 1.25rem;
      }

      .form-label {
        display: block;
        font-size: 0.9rem;
        font-weight: 600;
        color: #2d3748;
        margin-bottom: 0.5rem;
      }

      .form-input {
        width: 100%;
        padding: 0.75rem 1rem;
        font-size: 1rem;
        border: 2px solid #e2e8f0;
        border-radius: 6px;
        transition: all 0.2s;
        outline: none;
        box-sizing: border-box;
      }

      .form-input:focus {
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }

      .form-input:disabled {
        background-color: #f7fafc;
        cursor: not-allowed;
        opacity: 0.6;
      }

      .form-error-general {
        padding: 0.75rem 1rem;
        background-color: #fee;
        border: 1px solid #fcc;
        border-radius: 6px;
        color: #c33;
        font-size: 0.9rem;
        margin-bottom: 1rem;
      }

      @media (max-width: 768px) {
        .playlist-view-content {
          grid-template-columns: 1fr;
        }

        .playlist-view-header {
          flex-direction: column;
          gap: 1rem;
          align-items: stretch;
        }

        .modal {
          width: 95%;
        }
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Destroy the component and clean up
   */
  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    this.container.innerHTML = '';
  }
}
