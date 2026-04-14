/**
 * PlayerControls - Audio player component
 * 
 * Features:
 * - Display current song info (title, artist)
 * - Play/pause button
 * - Next/previous buttons
 * - Volume control slider
 * - Progress bar with seek functionality
 * - HTML5 Audio API for playback
 * 
 * Requirements: 3.6, 3.7, 3.8
 */

import { StateManager } from '../../app/StateManager';
import type { SongDTO } from '../../api/PlaylistApi';

/**
 * PlayerControls component state
 */
interface PlayerControlsState {
  currentSong: SongDTO | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  error: string | null;
}

/**
 * PlayerControls - Manages audio playback
 * 
 * This component renders the audio player interface and handles
 * playback using the HTML5 Audio API.
 * 
 * Requirements: 3.6, 3.7, 3.8
 */
export class PlayerControls {
  private container: HTMLElement;
  private stateManager: StateManager;
  private state: PlayerControlsState;
  private audio: HTMLAudioElement;
  private unsubscribe?: () => void;
  private updateInterval?: number;

  constructor(container: HTMLElement, stateManager: StateManager) {
    this.container = container;
    this.stateManager = stateManager;

    // Initialize audio element
    this.audio = new Audio();
    this.audio.preload = 'metadata';

    // Initialize state
    this.state = {
      currentSong: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 0.7,
      isMuted: false,
      error: null,
    };

    // Set initial volume
    this.audio.volume = this.state.volume;

    // Subscribe to state changes
    this.unsubscribe = this.stateManager.subscribe((appState) => {
      this.handleStateChange(appState);
    });

    // Set up audio event listeners
    this.setupAudioListeners();

    // Initial render
    this.render();
    this.attachEventListeners();

    // Load saved playback state from localStorage
    this.loadPlaybackState();
  }

  /**
   * Handle state changes from StateManager
   * 
   * @param appState - Current application state
   * 
   * Requirements: 3.6
   */
  private handleStateChange(appState: Readonly<typeof appState>): void {
    // Update current song if playback state changes
    if (appState.playbackState?.currentSong) {
      const newSong = appState.playbackState.currentSong as SongDTO;
      if (!this.state.currentSong || this.state.currentSong.id !== newSong.id) {
        this.loadSong(newSong);
      }
    }
  }

  /**
   * Set up audio element event listeners
   * 
   * @private
   */
  private setupAudioListeners(): void {
    // Update duration when metadata is loaded
    this.audio.addEventListener('loadedmetadata', () => {
      this.updateState({ duration: this.audio.duration });
    });

    // Update current time during playback
    this.audio.addEventListener('timeupdate', () => {
      this.updateState({ currentTime: this.audio.currentTime });
      this.savePlaybackState();
    });

    // Handle playback end
    this.audio.addEventListener('ended', () => {
      this.updateState({ isPlaying: false });
      // Auto-play next song if available
      // TODO: Implement next song logic when playlist navigation is added
    });

    // Handle errors
    this.audio.addEventListener('error', (e) => {
      console.error('Audio error:', e);
      
      let errorMessage = 'Failed to load audio file';
      
      // Provide more specific error messages based on error type
      if (this.audio.error) {
        switch (this.audio.error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = 'Audio loading was aborted';
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = 'Network error while loading audio';
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = 'Audio file is corrupted or in an unsupported format';
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'Audio source not supported. The URL may require authentication or have CORS restrictions.';
            break;
        }
      }
      
      this.updateState({
        error: errorMessage,
        isPlaying: false,
      });
    });

    // Handle play event
    this.audio.addEventListener('play', () => {
      this.updateState({ isPlaying: true, error: null });
    });

    // Handle pause event
    this.audio.addEventListener('pause', () => {
      this.updateState({ isPlaying: false });
    });
  }

  /**
   * Load a song into the player
   * 
   * @param song - Song to load
   * 
   * Requirements: 3.6
   */
  private loadSong(song: SongDTO): void {
    // Pause current playback
    this.audio.pause();

    // Check if URL is potentially problematic
    const url = song.audioUrl.toLowerCase();
    const isExternalUrl = url.includes('youtube.com') || 
                         url.includes('youtu.be') || 
                         url.includes('soundcloud.com') ||
                         url.includes('spotify.com');
    
    if (isExternalUrl) {
      this.updateState({
        currentSong: song,
        currentTime: 0,
        duration: 0,
        isPlaying: false,
        error: 'Cannot play external URLs directly. Please use the upload or YouTube extraction feature to add this song.',
      });
      this.render();
      this.attachEventListeners();
      return;
    }

    // Load new song
    this.audio.src = song.audioUrl;
    this.updateState({
      currentSong: song,
      currentTime: 0,
      duration: 0,
      isPlaying: false,
      error: null,
    });

    // Auto-play if there was a song playing before
    if (this.state.isPlaying) {
      this.play();
    }

    this.render();
    this.attachEventListeners();
  }

  /**
   * Play audio
   * 
   * Requirements: 3.6
   */
  private async play(): Promise<void> {
    try {
      await this.audio.play();
      this.updateState({ isPlaying: true, error: null });
    } catch (error) {
      console.error('Play error:', error);
      this.updateState({
        error: 'Failed to play audio',
        isPlaying: false,
      });
    }
  }

  /**
   * Pause audio
   * 
   * Requirements: 3.6
   */
  private pause(): void {
    this.audio.pause();
    this.updateState({ isPlaying: false });
  }

  /**
   * Toggle play/pause
   * 
   * Requirements: 3.6
   */
  private togglePlayPause(): void {
    if (this.state.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  /**
   * Seek to a specific time
   * 
   * @param time - Time in seconds
   * 
   * Requirements: 3.8
   */
  private seek(time: number): void {
    this.audio.currentTime = time;
    this.updateState({ currentTime: time });
  }

  /**
   * Set volume
   * 
   * @param volume - Volume level (0-1)
   * 
   * Requirements: 3.7
   */
  private setVolume(volume: number): void {
    this.audio.volume = volume;
    this.updateState({ volume, isMuted: volume === 0 });
    this.savePlaybackState();
  }

  /**
   * Toggle mute
   * 
   * Requirements: 3.7
   */
  private toggleMute(): void {
    if (this.state.isMuted) {
      this.audio.volume = this.state.volume;
      this.updateState({ isMuted: false });
    } else {
      this.audio.volume = 0;
      this.updateState({ isMuted: true });
    }
  }

  /**
   * Format time in MM:SS format
   * 
   * @param seconds - Time in seconds
   * @returns Formatted time string
   * 
   * @private
   */
  private formatTime(seconds: number): string {
    if (!isFinite(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Save playback state to localStorage
   * 
   * Requirements: 3.6, 3.7, 3.8
   * 
   * @private
   */
  private savePlaybackState(): void {
    if (!this.state.currentSong) return;

    const state = {
      songId: this.state.currentSong.id,
      currentTime: this.audio.currentTime,
      volume: this.state.volume,
    };

    localStorage.setItem('waveline_playback_state', JSON.stringify(state));
  }

  /**
   * Load playback state from localStorage
   * 
   * Requirements: 3.6, 3.7, 3.8
   * 
   * @private
   */
  private loadPlaybackState(): void {
    try {
      const saved = localStorage.getItem('waveline_playback_state');
      if (!saved) return;

      const state = JSON.parse(saved);
      
      // Restore volume
      if (typeof state.volume === 'number') {
        this.setVolume(state.volume);
      }

      // Note: Song restoration would require playlist context
      // This is handled by the main app when loading playlists
    } catch (error) {
      console.error('Failed to load playback state:', error);
    }
  }

  /**
   * Render the player controls
   * 
   * Requirements: 3.6, 3.7, 3.8
   */
  private render(): void {
    const { currentSong, isPlaying, currentTime, duration, volume, isMuted, error } = this.state;

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    this.container.innerHTML = `
      <div class="player-controls-container">
        ${error ? `
          <div class="player-error">
            ${this.escapeHtml(error)}
          </div>
        ` : ''}

        <div class="player-info">
          ${currentSong ? `
            <div class="song-info">
              <div class="song-title">${this.escapeHtml(currentSong.title)}</div>
              <div class="song-artist">${this.escapeHtml(currentSong.artist)}</div>
            </div>
          ` : `
            <div class="no-song">No song selected</div>
          `}
        </div>

        <div class="player-progress">
          <span class="time-current">${this.formatTime(currentTime)}</span>
          <div class="progress-bar-container">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${progressPercent}%"></div>
              <input
                type="range"
                class="progress-slider"
                min="0"
                max="${duration || 100}"
                value="${currentTime}"
                step="0.1"
                ${!currentSong ? 'disabled' : ''}
              />
            </div>
          </div>
          <span class="time-duration">${this.formatTime(duration)}</span>
        </div>

        <div class="player-controls">
          <button
            class="control-btn"
            id="prev-btn"
            title="Previous"
            disabled
          >
            ⏮️
          </button>

          <button
            class="control-btn control-btn-play"
            id="play-pause-btn"
            title="${isPlaying ? 'Pause' : 'Play'}"
            ${!currentSong ? 'disabled' : ''}
          >
            ${isPlaying ? '⏸️' : '▶️'}
          </button>

          <button
            class="control-btn"
            id="next-btn"
            title="Next"
            disabled
          >
            ⏭️
          </button>
        </div>

        <div class="player-volume">
          <button
            class="volume-btn"
            id="mute-btn"
            title="${isMuted ? 'Unmute' : 'Mute'}"
          >
            ${isMuted ? '🔇' : volume > 0.5 ? '🔊' : volume > 0 ? '🔉' : '🔈'}
          </button>
          <input
            type="range"
            class="volume-slider"
            id="volume-slider"
            min="0"
            max="1"
            step="0.01"
            value="${isMuted ? 0 : volume}"
          />
        </div>
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
    // Play/pause button
    const playPauseBtn = this.container.querySelector('#play-pause-btn');
    playPauseBtn?.addEventListener('click', () => {
      this.togglePlayPause();
    });

    // Progress slider
    const progressSlider = this.container.querySelector('.progress-slider') as HTMLInputElement;
    progressSlider?.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      this.seek(parseFloat(target.value));
    });

    // Volume slider
    const volumeSlider = this.container.querySelector('#volume-slider') as HTMLInputElement;
    volumeSlider?.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      this.setVolume(parseFloat(target.value));
    });

    // Mute button
    const muteBtn = this.container.querySelector('#mute-btn');
    muteBtn?.addEventListener('click', () => {
      this.toggleMute();
    });

    // Previous/Next buttons (disabled for now)
    // TODO: Implement when playlist navigation is added
  }

  /**
   * Update component state and re-render
   * 
   * @param partial - Partial state to update
   * 
   * @private
   */
  private updateState(partial: Partial<PlayerControlsState>): void {
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
   * Add inline styles for the player controls
   * 
   * @private
   */
  private addStyles(): void {
    // Check if styles are already added
    if (document.getElementById('player-controls-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'player-controls-styles';
    style.textContent = `
      .player-controls-container {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        max-width: 800px;
        margin: 0 auto;
      }

      .player-error {
        padding: 0.75rem;
        margin-bottom: 1rem;
        background-color: #fee;
        border: 1px solid #fcc;
        border-radius: 6px;
        color: #c33;
        font-size: 0.9rem;
      }

      .player-info {
        text-align: center;
        margin-bottom: 1.5rem;
      }

      .song-info .song-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1a202c;
        margin-bottom: 0.25rem;
      }

      .song-info .song-artist {
        font-size: 1rem;
        color: #718096;
      }

      .no-song {
        font-size: 1rem;
        color: #a0aec0;
        font-style: italic;
      }

      .player-progress {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .time-current,
      .time-duration {
        font-size: 0.85rem;
        color: #718096;
        min-width: 40px;
      }

      .progress-bar-container {
        flex: 1;
      }

      .progress-bar {
        position: relative;
        height: 6px;
        background-color: #e2e8f0;
        border-radius: 3px;
        overflow: hidden;
      }

      .progress-fill {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        border-radius: 3px;
        transition: width 0.1s linear;
      }

      .progress-slider {
        position: absolute;
        top: 50%;
        left: 0;
        width: 100%;
        height: 20px;
        margin-top: -10px;
        opacity: 0;
        cursor: pointer;
      }

      .progress-slider:disabled {
        cursor: not-allowed;
      }

      .player-controls {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .control-btn {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 50%;
        transition: all 0.2s;
        opacity: 0.8;
      }

      .control-btn:hover:not(:disabled) {
        opacity: 1;
        background-color: #f7fafc;
      }

      .control-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }

      .control-btn-play {
        font-size: 2rem;
        background-color: #f7fafc;
      }

      .control-btn-play:hover:not(:disabled) {
        background-color: #edf2f7;
        transform: scale(1.1);
      }

      .player-volume {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        justify-content: center;
      }

      .volume-btn {
        background: none;
        border: none;
        font-size: 1.25rem;
        cursor: pointer;
        padding: 0.25rem;
        opacity: 0.8;
        transition: opacity 0.2s;
      }

      .volume-btn:hover {
        opacity: 1;
      }

      .volume-slider {
        width: 100px;
        height: 4px;
        border-radius: 2px;
        background: #e2e8f0;
        outline: none;
        -webkit-appearance: none;
      }

      .volume-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #667eea;
        cursor: pointer;
      }

      .volume-slider::-moz-range-thumb {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #667eea;
        cursor: pointer;
        border: none;
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    // Stop playback
    this.audio.pause();
    this.audio.src = '';

    // Clear interval
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    // Unsubscribe from state changes
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}
