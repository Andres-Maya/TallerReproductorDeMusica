/**
 * StateManager - Centralized application state management with observer pattern
 * 
 * Features:
 * - Maintains centralized application state (user, playlists, playback, loading, errors)
 * - Implements observer pattern for reactive updates
 * - Provides type-safe state updates with partial updates
 * - Offers domain-specific methods for common state operations
 * - Notifies all subscribers when state changes
 * 
 * Requirements: 8.9, 8.10, 1.2
 */

import type { SongDTO } from '../api/PlaylistApi';

/**
 * User state information
 */
export interface UserState {
  id: string;
  username: string;
}

/**
 * Playlist data structure
 */
export interface Playlist {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  songCount?: number;
}

/**
 * Playback state information
 */
export interface PlaybackState {
  playlistId: string;
  playlistName: string;
  totalTracks: number;
  currentIndex: number;
  currentSong: SongDTO | null;
  hasPrevious: boolean;
  hasNext: boolean;
  position?: number;        // Playback position in seconds
  volume?: number;          // Volume level 0-1
  isPlaying?: boolean;      // Playing or paused
  repeatMode?: 'none' | 'one' | 'all';
  shuffleEnabled?: boolean;
}

/**
 * Complete application state
 */
export interface AppState {
  user: UserState | null;
  playlists: Playlist[];
  currentPlaylist: string | null;
  playbackState: PlaybackState | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * State change listener callback
 */
export type StateListener = (state: Readonly<AppState>) => void;

/**
 * StateManager - Manages application state with observer pattern
 * 
 * Provides centralized state management for the entire application.
 * Components can subscribe to state changes and receive notifications
 * when the state is updated.
 * 
 * Requirements: 8.9, 8.10, 1.2
 */
export class StateManager {
  private state: AppState;
  private listeners: Set<StateListener>;

  constructor() {
    // Initialize with default empty state
    this.state = {
      user: null,
      playlists: [],
      currentPlaylist: null,
      playbackState: null,
      isLoading: false,
      error: null,
    };

    this.listeners = new Set();
  }

  /**
   * Get the current application state (read-only)
   * 
   * Returns a readonly copy to prevent direct mutations
   */
  getState(): Readonly<AppState> {
    return Object.freeze({ ...this.state });
  }

  /**
   * Update state with partial updates and notify listeners
   * 
   * @param partial - Partial state object with properties to update
   * 
   * Requirements: 8.9, 8.10
   */
  setState(partial: Partial<AppState>): void {
    // Merge partial update into current state
    this.state = {
      ...this.state,
      ...partial,
    };

    // Notify all subscribers of state change
    this.notifyListeners();
  }

  /**
   * Subscribe to state changes
   * 
   * @param listener - Callback function to invoke on state changes
   * @returns Unsubscribe function to remove the listener
   * 
   * Requirements: 8.10
   */
  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Unsubscribe a listener from state changes
   * 
   * @param listener - The listener callback to remove
   */
  unsubscribe(listener: StateListener): void {
    this.listeners.delete(listener);
  }

  // ========================================
  // Domain-specific methods
  // ========================================

  /**
   * Set the authenticated user
   * 
   * @param user - User state information
   * 
   * Requirements: 1.2
   */
  setUser(user: UserState): void {
    this.setState({ user, error: null });
  }

  /**
   * Clear the authenticated user (logout)
   * 
   * Also clears playlists, current playlist, and playback state
   * 
   * Requirements: 1.2
   */
  clearUser(): void {
    this.setState({
      user: null,
      playlists: [],
      currentPlaylist: null,
      playbackState: null,
      error: null,
    });
  }

  /**
   * Set the list of playlists
   * 
   * @param playlists - Array of playlist objects
   * 
   * Requirements: 8.9
   */
  setPlaylists(playlists: Playlist[]): void {
    this.setState({ playlists, error: null });
  }

  /**
   * Set the current active playlist
   * 
   * @param id - Playlist ID to set as current
   * 
   * Requirements: 8.9
   */
  setCurrentPlaylist(id: string): void {
    this.setState({ currentPlaylist: id, error: null });
  }

  /**
   * Set the playback state
   * 
   * @param state - Playback state information
   * 
   * Requirements: 8.9
   */
  setPlaybackState(state: PlaybackState): void {
    this.setState({ playbackState: state, error: null });
  }

  /**
   * Set an error message
   * 
   * @param error - Error message to display
   * 
   * Requirements: 8.10
   */
  setError(error: string): void {
    this.setState({ error, isLoading: false });
  }

  /**
   * Clear the current error message
   * 
   * Requirements: 8.10
   */
  clearError(): void {
    this.setState({ error: null });
  }

  /**
   * Set the loading state
   * 
   * @param isLoading - Whether the application is loading
   * 
   * Requirements: 8.10
   */
  setLoading(isLoading: boolean): void {
    this.setState({ isLoading });
  }

  /**
   * Notify all listeners of state changes
   * 
   * @private
   */
  private notifyListeners(): void {
    const frozenState = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(frozenState);
      } catch (error) {
        console.error('Error in state listener:', error);
      }
    });
  }
}
