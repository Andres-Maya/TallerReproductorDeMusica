/**
 * StateManager Unit Tests
 * 
 * Tests the StateManager class for:
 * - Initial state
 * - State updates with partial updates
 * - Observer pattern (subscribe/unsubscribe)
 * - Domain-specific methods
 * - Listener notifications
 * - Error handling in listeners
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StateManager, type AppState, type UserState, type Playlist, type PlaybackState } from './StateManager';

describe('StateManager', () => {
  let stateManager: StateManager;

  beforeEach(() => {
    stateManager = new StateManager();
  });

  describe('Initial State', () => {
    it('should initialize with default empty state', () => {
      const state = stateManager.getState();

      expect(state).toEqual({
        user: null,
        playlists: [],
        currentPlaylist: null,
        playbackState: null,
        isLoading: false,
        error: null,
      });
    });

    it('should return a frozen state object', () => {
      const state = stateManager.getState();

      expect(Object.isFrozen(state)).toBe(true);
    });
  });

  describe('setState', () => {
    it('should update state with partial updates', () => {
      stateManager.setState({ isLoading: true });

      const state = stateManager.getState();
      expect(state.isLoading).toBe(true);
      expect(state.user).toBeNull();
    });

    it('should merge partial updates into existing state', () => {
      const user: UserState = { id: 'user_1', username: 'testuser' };
      
      stateManager.setState({ user });
      stateManager.setState({ isLoading: true });

      const state = stateManager.getState();
      expect(state.user).toEqual(user);
      expect(state.isLoading).toBe(true);
    });

    it('should notify listeners when state changes', () => {
      const listener = vi.fn();
      stateManager.subscribe(listener);

      stateManager.setState({ isLoading: true });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ isLoading: true })
      );
    });

    it('should pass frozen state to listeners', () => {
      const listener = vi.fn();
      stateManager.subscribe(listener);

      stateManager.setState({ isLoading: true });

      const receivedState = listener.mock.calls[0][0];
      expect(Object.isFrozen(receivedState)).toBe(true);
    });
  });

  describe('Observer Pattern', () => {
    it('should allow subscribing to state changes', () => {
      const listener = vi.fn();
      const unsubscribe = stateManager.subscribe(listener);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should notify all subscribers on state change', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const listener3 = vi.fn();

      stateManager.subscribe(listener1);
      stateManager.subscribe(listener2);
      stateManager.subscribe(listener3);

      stateManager.setState({ isLoading: true });

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
      expect(listener3).toHaveBeenCalledTimes(1);
    });

    it('should allow unsubscribing via returned function', () => {
      const listener = vi.fn();
      const unsubscribe = stateManager.subscribe(listener);

      stateManager.setState({ isLoading: true });
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      stateManager.setState({ isLoading: false });
      expect(listener).toHaveBeenCalledTimes(1); // Not called again
    });

    it('should allow unsubscribing via unsubscribe method', () => {
      const listener = vi.fn();
      stateManager.subscribe(listener);

      stateManager.setState({ isLoading: true });
      expect(listener).toHaveBeenCalledTimes(1);

      stateManager.unsubscribe(listener);
      stateManager.setState({ isLoading: false });
      expect(listener).toHaveBeenCalledTimes(1); // Not called again
    });

    it('should handle multiple subscriptions and unsubscriptions', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      const unsubscribe1 = stateManager.subscribe(listener1);
      stateManager.subscribe(listener2);

      stateManager.setState({ isLoading: true });
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);

      unsubscribe1();
      stateManager.setState({ isLoading: false });
      expect(listener1).toHaveBeenCalledTimes(1); // Not called again
      expect(listener2).toHaveBeenCalledTimes(2); // Called again
    });

    it('should not throw if unsubscribing a non-existent listener', () => {
      const listener = vi.fn();

      expect(() => {
        stateManager.unsubscribe(listener);
      }).not.toThrow();
    });

    it('should handle errors in listeners gracefully', () => {
      const errorListener = vi.fn(() => {
        throw new Error('Listener error');
      });
      const normalListener = vi.fn();

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      stateManager.subscribe(errorListener);
      stateManager.subscribe(normalListener);

      stateManager.setState({ isLoading: true });

      expect(errorListener).toHaveBeenCalledTimes(1);
      expect(normalListener).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error in state listener:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Domain-Specific Methods', () => {
    describe('setUser', () => {
      it('should set the user state', () => {
        const user: UserState = { id: 'user_1', username: 'testuser' };

        stateManager.setUser(user);

        const state = stateManager.getState();
        expect(state.user).toEqual(user);
        expect(state.error).toBeNull();
      });

      it('should clear error when setting user', () => {
        stateManager.setState({ error: 'Previous error' });

        const user: UserState = { id: 'user_1', username: 'testuser' };
        stateManager.setUser(user);

        const state = stateManager.getState();
        expect(state.error).toBeNull();
      });

      it('should notify listeners', () => {
        const listener = vi.fn();
        stateManager.subscribe(listener);

        const user: UserState = { id: 'user_1', username: 'testuser' };
        stateManager.setUser(user);

        expect(listener).toHaveBeenCalledTimes(1);
      });
    });

    describe('clearUser', () => {
      it('should clear user and related state', () => {
        const user: UserState = { id: 'user_1', username: 'testuser' };
        const playlists: Playlist[] = [
          {
            id: 'pl_1',
            userId: 'user_1',
            name: 'My Playlist',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ];

        stateManager.setState({
          user,
          playlists,
          currentPlaylist: 'pl_1',
          error: 'Some error',
        });

        stateManager.clearUser();

        const state = stateManager.getState();
        expect(state.user).toBeNull();
        expect(state.playlists).toEqual([]);
        expect(state.currentPlaylist).toBeNull();
        expect(state.playbackState).toBeNull();
        expect(state.error).toBeNull();
      });

      it('should notify listeners', () => {
        const listener = vi.fn();
        stateManager.subscribe(listener);

        stateManager.clearUser();

        expect(listener).toHaveBeenCalledTimes(1);
      });
    });

    describe('setPlaylists', () => {
      it('should set the playlists array', () => {
        const playlists: Playlist[] = [
          {
            id: 'pl_1',
            userId: 'user_1',
            name: 'Playlist 1',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
          {
            id: 'pl_2',
            userId: 'user_1',
            name: 'Playlist 2',
            createdAt: '2024-01-02T00:00:00Z',
            updatedAt: '2024-01-02T00:00:00Z',
          },
        ];

        stateManager.setPlaylists(playlists);

        const state = stateManager.getState();
        expect(state.playlists).toEqual(playlists);
        expect(state.error).toBeNull();
      });

      it('should clear error when setting playlists', () => {
        stateManager.setState({ error: 'Previous error' });

        stateManager.setPlaylists([]);

        const state = stateManager.getState();
        expect(state.error).toBeNull();
      });
    });

    describe('setCurrentPlaylist', () => {
      it('should set the current playlist ID', () => {
        stateManager.setCurrentPlaylist('pl_1');

        const state = stateManager.getState();
        expect(state.currentPlaylist).toBe('pl_1');
        expect(state.error).toBeNull();
      });

      it('should clear error when setting current playlist', () => {
        stateManager.setState({ error: 'Previous error' });

        stateManager.setCurrentPlaylist('pl_1');

        const state = stateManager.getState();
        expect(state.error).toBeNull();
      });
    });

    describe('setPlaybackState', () => {
      it('should set the playback state', () => {
        const playbackState: PlaybackState = {
          playlistId: 'pl_1',
          playlistName: 'My Playlist',
          totalTracks: 10,
          currentIndex: 3,
          currentSong: {
            id: 'song_1',
            title: 'Test Song',
            artist: 'Test Artist',
            audioUrl: 'https://example.com/song.mp3',
            createdAt: '2024-01-01T00:00:00Z',
          },
          hasPrevious: true,
          hasNext: true,
          position: 45,
          volume: 0.8,
          isPlaying: true,
          repeatMode: 'none',
          shuffleEnabled: false,
        };

        stateManager.setPlaybackState(playbackState);

        const state = stateManager.getState();
        expect(state.playbackState).toEqual(playbackState);
        expect(state.error).toBeNull();
      });

      it('should clear error when setting playback state', () => {
        stateManager.setState({ error: 'Previous error' });

        const playbackState: PlaybackState = {
          playlistId: 'pl_1',
          playlistName: 'My Playlist',
          totalTracks: 5,
          currentIndex: 0,
          currentSong: null,
          hasPrevious: false,
          hasNext: true,
        };

        stateManager.setPlaybackState(playbackState);

        const state = stateManager.getState();
        expect(state.error).toBeNull();
      });
    });

    describe('setError', () => {
      it('should set the error message', () => {
        stateManager.setError('Something went wrong');

        const state = stateManager.getState();
        expect(state.error).toBe('Something went wrong');
      });

      it('should set isLoading to false when setting error', () => {
        stateManager.setState({ isLoading: true });

        stateManager.setError('Error occurred');

        const state = stateManager.getState();
        expect(state.isLoading).toBe(false);
      });
    });

    describe('clearError', () => {
      it('should clear the error message', () => {
        stateManager.setState({ error: 'Some error' });

        stateManager.clearError();

        const state = stateManager.getState();
        expect(state.error).toBeNull();
      });
    });

    describe('setLoading', () => {
      it('should set the loading state to true', () => {
        stateManager.setLoading(true);

        const state = stateManager.getState();
        expect(state.isLoading).toBe(true);
      });

      it('should set the loading state to false', () => {
        stateManager.setState({ isLoading: true });

        stateManager.setLoading(false);

        const state = stateManager.getState();
        expect(state.isLoading).toBe(false);
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete login flow', () => {
      const listener = vi.fn();
      stateManager.subscribe(listener);

      // Start loading
      stateManager.setLoading(true);
      expect(stateManager.getState().isLoading).toBe(true);

      // Set user after successful login
      const user: UserState = { id: 'user_1', username: 'testuser' };
      stateManager.setUser(user);
      expect(stateManager.getState().user).toEqual(user);

      // Load playlists
      const playlists: Playlist[] = [
        {
          id: 'pl_1',
          userId: 'user_1',
          name: 'Favorites',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];
      stateManager.setPlaylists(playlists);

      // Stop loading
      stateManager.setLoading(false);

      const finalState = stateManager.getState();
      expect(finalState.user).toEqual(user);
      expect(finalState.playlists).toEqual(playlists);
      expect(finalState.isLoading).toBe(false);
      expect(finalState.error).toBeNull();

      // Should have notified listener 4 times
      expect(listener).toHaveBeenCalledTimes(4);
    });

    it('should handle error during operation', () => {
      stateManager.setLoading(true);
      stateManager.setError('Network error');

      const state = stateManager.getState();
      expect(state.error).toBe('Network error');
      expect(state.isLoading).toBe(false);
    });

    it('should handle logout flow', () => {
      // Setup logged-in state
      const user: UserState = { id: 'user_1', username: 'testuser' };
      const playlists: Playlist[] = [
        {
          id: 'pl_1',
          userId: 'user_1',
          name: 'My Playlist',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      stateManager.setState({
        user,
        playlists,
        currentPlaylist: 'pl_1',
      });

      // Logout
      stateManager.clearUser();

      const state = stateManager.getState();
      expect(state.user).toBeNull();
      expect(state.playlists).toEqual([]);
      expect(state.currentPlaylist).toBeNull();
      expect(state.playbackState).toBeNull();
    });
  });
});
