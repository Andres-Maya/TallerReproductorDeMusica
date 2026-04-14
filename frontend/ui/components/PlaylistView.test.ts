/**
 * PlaylistView - Unit Tests
 * 
 * Tests for the PlaylistView component covering:
 * - Component rendering
 * - Playlist loading and display
 * - Playlist creation
 * - Playlist selection
 * - Song display
 * - Song addition
 * - Playlist deletion
 * - State management integration
 * 
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PlaylistView } from './PlaylistView';
import { ApiClient } from '../../api/ApiClient';
import { StateManager, Playlist } from '../../app/StateManager';
import type { SongDTO } from '../../../Song';

describe('PlaylistView', () => {
  let container: HTMLElement;
  let apiClient: ApiClient;
  let stateManager: StateManager;

  const mockPlaylists: Playlist[] = [
    {
      id: 'playlist-1',
      userId: 'user-1',
      name: 'My Favorites',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      songCount: 5,
    },
    {
      id: 'playlist-2',
      userId: 'user-1',
      name: 'Workout Mix',
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
      songCount: 3,
    },
  ];

  const mockSongs: SongDTO[] = [
    {
      id: 'song-1',
      title: 'Test Song 1',
      artist: 'Test Artist 1',
      audioUrl: 'https://example.com/song1.mp3',
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'song-2',
      title: 'Test Song 2',
      artist: 'Test Artist 2',
      audioUrl: 'https://example.com/song2.mp3',
      createdAt: '2024-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    // Create container
    container = document.createElement('div');
    document.body.appendChild(container);

    // Create instances
    apiClient = new ApiClient('http://localhost:3000');
    stateManager = new StateManager();
  });

  afterEach(() => {
    // Clean up
    if (container && container.parentNode) {
      document.body.removeChild(container);
    }
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render playlist view with header', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockPlaylists);

      new PlaylistView(container, apiClient, stateManager);
      await new Promise(resolve => setTimeout(resolve, 50));

      const title = container.querySelector('.playlist-view-title');
      const newPlaylistBtn = container.querySelector('#new-playlist-btn');

      expect(title?.textContent).toContain('My Playlists');
      expect(newPlaylistBtn).toBeTruthy();
    });

    it('should render empty state when no playlists', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue([]);

      new PlaylistView(container, apiClient, stateManager);
      await new Promise(resolve => setTimeout(resolve, 50));

      const emptyMessage = container.querySelector('.empty-message');
      expect(emptyMessage?.textContent).toContain('No playlists yet');
    });

    it('should render playlists list', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockPlaylists);

      new PlaylistView(container, apiClient, stateManager);
      await new Promise(resolve => setTimeout(resolve, 50));

      const playlistItems = container.querySelectorAll('.playlist-item');
      expect(playlistItems.length).toBe(2);

      const firstPlaylist = playlistItems[0];
      expect(firstPlaylist.textContent).toContain('My Favorites');
      expect(firstPlaylist.textContent).toContain('5 songs');
    });
  });

  describe('Playlist Creation', () => {
    it('should open new playlist modal when button clicked', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockPlaylists);

      new PlaylistView(container, apiClient, stateManager);
      await new Promise(resolve => setTimeout(resolve, 50));

      const newPlaylistBtn = container.querySelector('#new-playlist-btn') as HTMLButtonElement;
      newPlaylistBtn.click();

      await new Promise(resolve => setTimeout(resolve, 10));

      const modal = container.querySelector('.modal');
      const modalTitle = container.querySelector('.modal-title');
      expect(modal).toBeTruthy();
      expect(modalTitle?.textContent).toContain('Create New Playlist');
    });

    it('should create playlist with valid name', async () => {
      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockPlaylists);
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({
        id: 'playlist-3',
        userId: 'user-1',
        name: 'New Playlist',
        createdAt: '2024-01-03T00:00:00Z',
        updatedAt: '2024-01-03T00:00:00Z',
        songCount: 0,
      });

      new PlaylistView(container, apiClient, stateManager);
      await new Promise(resolve => setTimeout(resolve, 50));

      // Open modal
      const newPlaylistBtn = container.querySelector('#new-playlist-btn') as HTMLButtonElement;
      newPlaylistBtn.click();
      await new Promise(resolve => setTimeout(resolve, 10));

      // Fill in name
      const nameInput = container.querySelector('#playlist-name') as HTMLInputElement;
      nameInput.value = 'New Playlist';
      nameInput.dispatchEvent(new Event('input'));

      // Submit
      const createBtn = container.querySelector('#create-playlist-btn') as HTMLButtonElement;
      createBtn.click();
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(postSpy).toHaveBeenCalledWith('/api/playlists', { name: 'New Playlist' });
    });

    it('should show error when playlist name is empty', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockPlaylists);

      new PlaylistView(container, apiClient, stateManager);
      await new Promise(resolve => setTimeout(resolve, 50));

      // Open modal
      const newPlaylistBtn = container.querySelector('#new-playlist-btn') as HTMLButtonElement;
      newPlaylistBtn.click();
      await new Promise(resolve => setTimeout(resolve, 10));

      // Submit without name
      const createBtn = container.querySelector('#create-playlist-btn') as HTMLButtonElement;
      createBtn.click();
      await new Promise(resolve => setTimeout(resolve, 10));

      const errorMessage = container.querySelector('.form-error-general');
      expect(errorMessage?.textContent).toContain('Playlist name is required');
    });

    it('should close modal after successful creation', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockPlaylists);
      vi.spyOn(apiClient, 'post').mockResolvedValue({
        id: 'playlist-3',
        userId: 'user-1',
        name: 'New Playlist',
        createdAt: '2024-01-03T00:00:00Z',
        updatedAt: '2024-01-03T00:00:00Z',
        songCount: 0,
      });

      new PlaylistView(container, apiClient, stateManager);
      await new Promise(resolve => setTimeout(resolve, 50));

      // Open modal
      const newPlaylistBtn = container.querySelector('#new-playlist-btn') as HTMLButtonElement;
      newPlaylistBtn.click();
      await new Promise(resolve => setTimeout(resolve, 10));

      // Fill and submit
      const nameInput = container.querySelector('#playlist-name') as HTMLInputElement;
      nameInput.value = 'New Playlist';
      nameInput.dispatchEvent(new Event('input'));

      const createBtn = container.querySelector('#create-playlist-btn') as HTMLButtonElement;
      createBtn.click();
      await new Promise(resolve => setTimeout(resolve, 50));

      const modal = container.querySelector('.modal');
      expect(modal).toBeFalsy();
    });
  });

  describe('Playlist Selection', () => {
    it('should select playlist when clicked', async () => {
      vi.spyOn(apiClient, 'get')
        .mockResolvedValueOnce(mockPlaylists)
        .mockResolvedValueOnce(mockSongs);

      new PlaylistView(container, apiClient, stateManager);
      await new Promise(resolve => setTimeout(resolve, 50));

      const playlistItem = container.querySelector('.playlist-item') as HTMLElement;
      playlistItem.click();
      await new Promise(resolve => setTimeout(resolve, 50));

      const appState = stateManager.getState();
      expect(appState.currentPlaylist).toBe('playlist-1');
    });

    it('should highlight selected playlist', async () => {
      vi.spyOn(apiClient, 'get')
        .mockResolvedValueOnce(mockPlaylists)
        .mockResolvedValueOnce(mockSongs);

      new PlaylistView(container, apiClient, stateManager);
      await new Promise(resolve => setTimeout(resolve, 50));

      const playlistItem = container.querySelector('.playlist-item') as HTMLElement;
      playlistItem.click();
      await new Promise(resolve => setTimeout(resolve, 50));

      const activeItem = container.querySelector('.playlist-item-active');
      expect(activeItem).toBeTruthy();
    });

    it('should load songs when playlist is selected', async () => {
      const getSpy = vi.spyOn(apiClient, 'get')
        .mockResolvedValueOnce(mockPlaylists)
        .mockResolvedValueOnce(mockSongs);

      new PlaylistView(container, apiClient, stateManager);
      await new Promise(resolve => setTimeout(resolve, 50));

      const playlistItem = container.querySelector('.playlist-item') as HTMLElement;
      playlistItem.click();
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(getSpy).toHaveBeenCalledWith('/api/playlists/playlist-1/songs');
    });
  });

  describe('Song Display', () => {
    it('should display songs for selected playlist', async () => {
      vi.spyOn(apiClient, 'get')
        .mockResolvedValueOnce(mockPlaylists)
        .mockResolvedValueOnce(mockSongs);

      new PlaylistView(container, apiClient, stateManager);
      await new Promise(resolve => setTimeout(resolve, 50));

      // Select playlist
      const playlistItem = container.querySelector('.playlist-item') as HTMLElement;
      playlistItem.click();
      await new Promise(resolve => setTimeout(resolve, 50));

      const songItems = container.querySelectorAll('.song-item');
      expect(songItems.length).toBe(2);

      const firstSong = songItems[0];
      expect(firstSong.textContent).toContain('Test Song 1');
      expect(firstSong.textContent).toContain('Test Artist 1');
    });

    it('should show empty state when no songs in playlist', async () => {
      vi.spyOn(apiClient, 'get')
        .mockResolvedValueOnce(mockPlaylists)
        .mockResolvedValueOnce([]);

      new PlaylistView(container, apiClient, stateManager);
      await new Promise(resolve => setTimeout(resolve, 50));

      // Select playlist
      const playlistItem = container.querySelector('.playlist-item') as HTMLElement;
      playlistItem.click();
      await new Promise(resolve => setTimeout(resolve, 50));

      const emptyMessage = container.querySelector('.empty-message');
      expect(emptyMessage?.textContent).toContain('No songs in this playlist');
    });
  });

  describe('Song Addition', () => {
    it('should open add song modal when button clicked', async () => {
      vi.spyOn(apiClient, 'get')
        .mockResolvedValueOnce(mockPlaylists)
        .mockResolvedValueOnce(mockSongs);

      new PlaylistView(container, apiClient, stateManager);
      await new Promise(resolve => setTimeout(resolve, 50));

      // Select playlist
      const playlistItem = container.querySelector('.playlist-item') as HTMLElement;
      playlistItem.click();
      await new Promise(resolve => setTimeout(resolve, 50));

      // Click add song button
      const addSongBtn = container.querySelector('#add-song-btn') as HTMLButtonElement;
      addSongBtn.click();
      await new Promise(resolve => setTimeout(resolve, 10));

      const modal = container.querySelector('.modal');
      const modalTitle = container.querySelector('.modal-title');
      expect(modal).toBeTruthy();
      expect(modalTitle?.textContent).toContain('Add Song');
    });

    it('should add song with valid inputs', async () => {
      vi.spyOn(apiClient, 'get')
        .mockResolvedValueOnce(mockPlaylists)
        .mockResolvedValueOnce(mockSongs);
      
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({
        id: 'song-3',
        title: 'New Song',
        artist: 'New Artist',
        audioUrl: 'https://example.com/new.mp3',
        createdAt: '2024-01-03T00:00:00Z',
      });

      new PlaylistView(container, apiClient, stateManager);
      await new Promise(resolve => setTimeout(resolve, 50));

      // Select playlist
      const playlistItem = container.querySelector('.playlist-item') as HTMLElement;
      playlistItem.click();
      await new Promise(resolve => setTimeout(resolve, 50));

      // Open add song modal
      const addSongBtn = container.querySelector('#add-song-btn') as HTMLButtonElement;
      addSongBtn.click();
      await new Promise(resolve => setTimeout(resolve, 10));

      // Fill in song details
      const titleInput = container.querySelector('#song-title') as HTMLInputElement;
      const artistInput = container.querySelector('#song-artist') as HTMLInputElement;
      const urlInput = container.querySelector('#song-url') as HTMLInputElement;

      titleInput.value = 'New Song';
      artistInput.value = 'New Artist';
      urlInput.value = 'https://example.com/new.mp3';

      titleInput.dispatchEvent(new Event('input'));
      artistInput.dispatchEvent(new Event('input'));
      urlInput.dispatchEvent(new Event('input'));

      // Submit
      const submitBtn = container.querySelector('#add-song-submit-btn') as HTMLButtonElement;
      submitBtn.click();
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(postSpy).toHaveBeenCalledWith('/api/playlists/playlist-1/songs', {
        title: 'New Song',
        artist: 'New Artist',
        audioUrl: 'https://example.com/new.mp3',
      });
    });

    it('should validate required fields', async () => {
      vi.spyOn(apiClient, 'get')
        .mockResolvedValueOnce(mockPlaylists)
        .mockResolvedValueOnce(mockSongs);

      new PlaylistView(container, apiClient, stateManager);
      await new Promise(resolve => setTimeout(resolve, 50));

      // Select playlist
      const playlistItem = container.querySelector('.playlist-item') as HTMLElement;
      playlistItem.click();
      await new Promise(resolve => setTimeout(resolve, 50));

      // Open add song modal
      const addSongBtn = container.querySelector('#add-song-btn') as HTMLButtonElement;
      addSongBtn.click();
      await new Promise(resolve => setTimeout(resolve, 10));

      // Submit without filling fields
      const submitBtn = container.querySelector('#add-song-submit-btn') as HTMLButtonElement;
      submitBtn.click();
      await new Promise(resolve => setTimeout(resolve, 10));

      const errorMessage = container.querySelector('.form-error-general');
      expect(errorMessage?.textContent).toContain('required');
    });

    it('should validate URL format', async () => {
      vi.spyOn(apiClient, 'get')
        .mockResolvedValueOnce(mockPlaylists)
        .mockResolvedValueOnce(mockSongs);

      new PlaylistView(container, apiClient, stateManager);
      await new Promise(resolve => setTimeout(resolve, 50));

      // Select playlist
      const playlistItem = container.querySelector('.playlist-item') as HTMLElement;
      playlistItem.click();
      await new Promise(resolve => setTimeout(resolve, 50));

      // Open add song modal
      const addSongBtn = container.querySelector('#add-song-btn') as HTMLButtonElement;
      addSongBtn.click();
      await new Promise(resolve => setTimeout(resolve, 10));

      // Fill with invalid URL
      const titleInput = container.querySelector('#song-title') as HTMLInputElement;
      const artistInput = container.querySelector('#song-artist') as HTMLInputElement;
      const urlInput = container.querySelector('#song-url') as HTMLInputElement;

      titleInput.value = 'New Song';
      artistInput.value = 'New Artist';
      urlInput.value = 'not-a-valid-url';

      titleInput.dispatchEvent(new Event('input'));
      artistInput.dispatchEvent(new Event('input'));
      urlInput.dispatchEvent(new Event('input'));

      // Submit
      const submitBtn = container.querySelector('#add-song-submit-btn') as HTMLButtonElement;
      submitBtn.click();
      await new Promise(resolve => setTimeout(resolve, 10));

      const errorMessage = container.querySelector('.form-error-general');
      expect(errorMessage?.textContent).toContain('valid URL');
    });

    it('should reject duplicate song titles (case-insensitive)', async () => {
      vi.spyOn(apiClient, 'get')
        .mockResolvedValueOnce(mockPlaylists)
        .mockResolvedValueOnce(mockSongs);

      new PlaylistView(container, apiClient, stateManager);
      await new Promise(resolve => setTimeout(resolve, 50));

      // Select playlist
      const playlistItem = container.querySelector('.playlist-item') as HTMLElement;
      playlistItem.click();
      await new Promise(resolve => setTimeout(resolve, 50));

      // Open add song modal
      const addSongBtn = container.querySelector('#add-song-btn') as HTMLButtonElement;
      addSongBtn.click();
      await new Promise(resolve => setTimeout(resolve, 10));

      // Try to add song with duplicate title (exact match)
      const titleInput = container.querySelector('#song-title') as HTMLInputElement;
      const artistInput = container.querySelector('#song-artist') as HTMLInputElement;
      const urlInput = container.querySelector('#song-url') as HTMLInputElement;

      titleInput.value = 'Test Song 1';
      artistInput.value = 'Different Artist';
      urlInput.value = 'https://example.com/different.mp3';

      titleInput.dispatchEvent(new Event('input'));
      artistInput.dispatchEvent(new Event('input'));
      urlInput.dispatchEvent(new Event('input'));

      // Submit
      const submitBtn = container.querySelector('#add-song-submit-btn') as HTMLButtonElement;
      submitBtn.click();
      await new Promise(resolve => setTimeout(resolve, 10));

      const errorMessage = container.querySelector('.form-error-general');
      expect(errorMessage?.textContent).toContain('A song with this title already exists in the playlist');
    });

    it('should reject duplicate song titles with different case', async () => {
      vi.spyOn(apiClient, 'get')
        .mockResolvedValueOnce(mockPlaylists)
        .mockResolvedValueOnce(mockSongs);

      new PlaylistView(container, apiClient, stateManager);
      await new Promise(resolve => setTimeout(resolve, 50));

      // Select playlist
      const playlistItem = container.querySelector('.playlist-item') as HTMLElement;
      playlistItem.click();
      await new Promise(resolve => setTimeout(resolve, 50));

      // Open add song modal
      const addSongBtn = container.querySelector('#add-song-btn') as HTMLButtonElement;
      addSongBtn.click();
      await new Promise(resolve => setTimeout(resolve, 10));

      // Try to add song with duplicate title (different case)
      const titleInput = container.querySelector('#song-title') as HTMLInputElement;
      const artistInput = container.querySelector('#song-artist') as HTMLInputElement;
      const urlInput = container.querySelector('#song-url') as HTMLInputElement;

      titleInput.value = 'TEST SONG 1';
      artistInput.value = 'Different Artist';
      urlInput.value = 'https://example.com/different.mp3';

      titleInput.dispatchEvent(new Event('input'));
      artistInput.dispatchEvent(new Event('input'));
      urlInput.dispatchEvent(new Event('input'));

      // Submit
      const submitBtn = container.querySelector('#add-song-submit-btn') as HTMLButtonElement;
      submitBtn.click();
      await new Promise(resolve => setTimeout(resolve, 10));

      const errorMessage = container.querySelector('.form-error-general');
      expect(errorMessage?.textContent).toContain('A song with this title already exists in the playlist');
    });

    it('should allow adding song with unique title', async () => {
      vi.spyOn(apiClient, 'get')
        .mockResolvedValueOnce(mockPlaylists)
        .mockResolvedValueOnce(mockSongs);
      
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({
        id: 'song-3',
        title: 'Unique Song',
        artist: 'New Artist',
        audioUrl: 'https://example.com/unique.mp3',
        createdAt: '2024-01-03T00:00:00Z',
      });

      new PlaylistView(container, apiClient, stateManager);
      await new Promise(resolve => setTimeout(resolve, 50));

      // Select playlist
      const playlistItem = container.querySelector('.playlist-item') as HTMLElement;
      playlistItem.click();
      await new Promise(resolve => setTimeout(resolve, 50));

      // Open add song modal
      const addSongBtn = container.querySelector('#add-song-btn') as HTMLButtonElement;
      addSongBtn.click();
      await new Promise(resolve => setTimeout(resolve, 10));

      // Add song with unique title
      const titleInput = container.querySelector('#song-title') as HTMLInputElement;
      const artistInput = container.querySelector('#song-artist') as HTMLInputElement;
      const urlInput = container.querySelector('#song-url') as HTMLInputElement;

      titleInput.value = 'Unique Song';
      artistInput.value = 'New Artist';
      urlInput.value = 'https://example.com/unique.mp3';

      titleInput.dispatchEvent(new Event('input'));
      artistInput.dispatchEvent(new Event('input'));
      urlInput.dispatchEvent(new Event('input'));

      // Submit
      const submitBtn = container.querySelector('#add-song-submit-btn') as HTMLButtonElement;
      submitBtn.click();
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(postSpy).toHaveBeenCalledWith('/api/playlists/playlist-1/songs', {
        title: 'Unique Song',
        artist: 'New Artist',
        audioUrl: 'https://example.com/unique.mp3',
      });
    });
  });

  describe('Playlist Deletion', () => {
    it('should open delete confirmation modal', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockPlaylists);

      new PlaylistView(container, apiClient, stateManager);
      await new Promise(resolve => setTimeout(resolve, 50));

      // Click delete button
      const deleteBtn = container.querySelector('.btn-delete-playlist') as HTMLButtonElement;
      deleteBtn.click();
      await new Promise(resolve => setTimeout(resolve, 10));

      const modal = container.querySelector('.modal');
      const modalTitle = container.querySelector('.modal-title');
      expect(modal).toBeTruthy();
      expect(modalTitle?.textContent).toContain('Delete Playlist');
    });

    it('should delete playlist when confirmed', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockPlaylists);
      const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValue(undefined);

      new PlaylistView(container, apiClient, stateManager);
      await new Promise(resolve => setTimeout(resolve, 50));

      // Click delete button
      const deleteBtn = container.querySelector('.btn-delete-playlist') as HTMLButtonElement;
      deleteBtn.click();
      await new Promise(resolve => setTimeout(resolve, 10));

      // Confirm deletion
      const confirmBtn = container.querySelector('#confirm-delete-btn') as HTMLButtonElement;
      confirmBtn.click();
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(deleteSpy).toHaveBeenCalledWith('/api/playlists/playlist-1');
    });

    it('should close modal when deletion cancelled', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockPlaylists);

      new PlaylistView(container, apiClient, stateManager);
      await new Promise(resolve => setTimeout(resolve, 50));

      // Click delete button
      const deleteBtn = container.querySelector('.btn-delete-playlist') as HTMLButtonElement;
      deleteBtn.click();
      await new Promise(resolve => setTimeout(resolve, 10));

      // Cancel deletion
      const cancelBtn = container.querySelector('#cancel-delete') as HTMLButtonElement;
      cancelBtn.click();
      await new Promise(resolve => setTimeout(resolve, 10));

      const modal = container.querySelector('.modal');
      expect(modal).toBeFalsy();
    });
  });

  describe('XSS Protection', () => {
    it('should escape HTML in playlist names', async () => {
      const maliciousPlaylists = [{
        ...mockPlaylists[0],
        name: '<script>alert("xss")</script>',
      }];

      vi.spyOn(apiClient, 'get').mockResolvedValue(maliciousPlaylists);

      new PlaylistView(container, apiClient, stateManager);
      await new Promise(resolve => setTimeout(resolve, 50));

      const playlistName = container.querySelector('.playlist-name');
      expect(playlistName?.innerHTML).not.toContain('<script>');
      expect(playlistName?.textContent).toContain('<script>alert("xss")</script>');
    });

    it('should escape HTML in song titles', async () => {
      const maliciousSongs = [{
        ...mockSongs[0],
        title: '<img src=x onerror=alert("xss")>',
      }];

      vi.spyOn(apiClient, 'get')
        .mockResolvedValueOnce(mockPlaylists)
        .mockResolvedValueOnce(maliciousSongs);

      new PlaylistView(container, apiClient, stateManager);
      await new Promise(resolve => setTimeout(resolve, 50));

      // Select playlist
      const playlistItem = container.querySelector('.playlist-item') as HTMLElement;
      playlistItem.click();
      await new Promise(resolve => setTimeout(resolve, 50));

      const songTitle = container.querySelector('.song-title');
      expect(songTitle?.innerHTML).not.toContain('<img');
      expect(songTitle?.textContent).toContain('<img src=x onerror=alert("xss")>');
    });
  });

  describe('Song Playback', () => {
    it('should set playback state when song is clicked', async () => {
      vi.spyOn(apiClient, 'get')
        .mockResolvedValueOnce(mockPlaylists)
        .mockResolvedValueOnce(mockSongs);

      new PlaylistView(container, apiClient, stateManager);
      await new Promise(resolve => setTimeout(resolve, 50));

      // Select playlist
      const playlistItem = container.querySelector('.playlist-item') as HTMLElement;
      playlistItem.click();
      await new Promise(resolve => setTimeout(resolve, 50));

      // Click on first song
      const songItem = container.querySelector('.song-item') as HTMLElement;
      songItem.click();
      await new Promise(resolve => setTimeout(resolve, 10));

      const appState = stateManager.getState();
      expect(appState.playbackState).toBeTruthy();
      expect(appState.playbackState?.currentSong?.id).toBe('song-1');
      expect(appState.playbackState?.playlistId).toBe('playlist-1');
      expect(appState.playbackState?.playlistName).toBe('My Favorites');
      expect(appState.playbackState?.currentIndex).toBe(0);
      expect(appState.playbackState?.totalTracks).toBe(2);
    });

    it('should set correct navigation flags for first song', async () => {
      vi.spyOn(apiClient, 'get')
        .mockResolvedValueOnce(mockPlaylists)
        .mockResolvedValueOnce(mockSongs);

      new PlaylistView(container, apiClient, stateManager);
      await new Promise(resolve => setTimeout(resolve, 50));

      // Select playlist
      const playlistItem = container.querySelector('.playlist-item') as HTMLElement;
      playlistItem.click();
      await new Promise(resolve => setTimeout(resolve, 50));

      // Click on first song
      const songItem = container.querySelector('.song-item') as HTMLElement;
      songItem.click();
      await new Promise(resolve => setTimeout(resolve, 10));

      const appState = stateManager.getState();
      expect(appState.playbackState?.hasPrevious).toBe(false);
      expect(appState.playbackState?.hasNext).toBe(true);
    });

    it('should set correct navigation flags for last song', async () => {
      vi.spyOn(apiClient, 'get')
        .mockResolvedValueOnce(mockPlaylists)
        .mockResolvedValueOnce(mockSongs);

      new PlaylistView(container, apiClient, stateManager);
      await new Promise(resolve => setTimeout(resolve, 50));

      // Select playlist
      const playlistItem = container.querySelector('.playlist-item') as HTMLElement;
      playlistItem.click();
      await new Promise(resolve => setTimeout(resolve, 50));

      // Click on last song
      const songItems = container.querySelectorAll('.song-item');
      const lastSong = songItems[songItems.length - 1] as HTMLElement;
      lastSong.click();
      await new Promise(resolve => setTimeout(resolve, 10));

      const appState = stateManager.getState();
      expect(appState.playbackState?.hasPrevious).toBe(true);
      expect(appState.playbackState?.hasNext).toBe(false);
    });

    it('should make song items clickable with cursor pointer', async () => {
      vi.spyOn(apiClient, 'get')
        .mockResolvedValueOnce(mockPlaylists)
        .mockResolvedValueOnce(mockSongs);

      new PlaylistView(container, apiClient, stateManager);
      await new Promise(resolve => setTimeout(resolve, 50));

      // Select playlist
      const playlistItem = container.querySelector('.playlist-item') as HTMLElement;
      playlistItem.click();
      await new Promise(resolve => setTimeout(resolve, 50));

      const songItem = container.querySelector('.song-item') as HTMLElement;
      const styles = window.getComputedStyle(songItem);
      expect(styles.cursor).toBe('pointer');
    });
  });
});
