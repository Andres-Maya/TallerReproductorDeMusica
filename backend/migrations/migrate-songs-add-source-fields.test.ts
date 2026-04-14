import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { migratePlaylistFile, migrateAllPlaylists } from './migrate-songs-add-source-fields';

describe('Song Migration Script', () => {
  const testDataDir = path.join(__dirname, '../../test-data-migration');
  const testPlaylistsDir = path.join(testDataDir, 'playlists');

  beforeEach(async () => {
    // Create test directories
    await fs.mkdir(testPlaylistsDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directories
    await fs.rm(testDataDir, { recursive: true, force: true });
  });

  describe('migratePlaylistFile', () => {
    it('should add sourceType and fileId to songs without these fields', async () => {
      // Create a test playlist with old format songs
      const oldPlaylist = {
        id: 'playlist_123',
        userId: 'user_456',
        name: 'Test Playlist',
        songs: [
          {
            id: 'song_1',
            title: 'Song 1',
            artist: 'Artist 1',
            audioUrl: 'https://example.com/song1.mp3',
            createdAt: '2024-01-01T00:00:00Z'
          },
          {
            id: 'song_2',
            title: 'Song 2',
            artist: 'Artist 2',
            audioUrl: 'https://example.com/song2.mp3',
            createdAt: '2024-01-02T00:00:00Z'
          }
        ],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      };

      const testFile = path.join(testPlaylistsDir, 'test-playlist.json');
      await fs.writeFile(testFile, JSON.stringify(oldPlaylist, null, 2));

      // Run migration
      await migratePlaylistFile(testFile);

      // Read migrated file
      const migratedContent = await fs.readFile(testFile, 'utf-8');
      const migratedPlaylist = JSON.parse(migratedContent);

      // Verify migration
      expect(migratedPlaylist.songs).toHaveLength(2);
      expect(migratedPlaylist.songs[0]).toMatchObject({
        id: 'song_1',
        title: 'Song 1',
        artist: 'Artist 1',
        audioUrl: 'https://example.com/song1.mp3',
        sourceType: 'url',
        fileId: null
      });
      expect(migratedPlaylist.songs[1]).toMatchObject({
        id: 'song_2',
        title: 'Song 2',
        artist: 'Artist 2',
        audioUrl: 'https://example.com/song2.mp3',
        sourceType: 'url',
        fileId: null
      });
    });

    it('should not modify songs that already have sourceType and fileId', async () => {
      // Create a test playlist with already migrated songs
      const migratedPlaylist = {
        id: 'playlist_123',
        userId: 'user_456',
        name: 'Test Playlist',
        songs: [
          {
            id: 'song_1',
            title: 'Song 1',
            artist: 'Artist 1',
            audioUrl: 'https://example.com/song1.mp3',
            sourceType: 'url',
            fileId: null,
            createdAt: '2024-01-01T00:00:00Z'
          },
          {
            id: 'song_2',
            title: 'Uploaded Song',
            artist: 'Artist 2',
            audioUrl: '/api/v1/files/file_123',
            sourceType: 'upload',
            fileId: 'file_123',
            createdAt: '2024-01-02T00:00:00Z'
          }
        ],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      };

      const testFile = path.join(testPlaylistsDir, 'test-playlist.json');
      await fs.writeFile(testFile, JSON.stringify(migratedPlaylist, null, 2));

      // Run migration
      await migratePlaylistFile(testFile);

      // Read file
      const content = await fs.readFile(testFile, 'utf-8');
      const playlist = JSON.parse(content);

      // Verify no changes
      expect(playlist.songs[0].sourceType).toBe('url');
      expect(playlist.songs[0].fileId).toBe(null);
      expect(playlist.songs[1].sourceType).toBe('upload');
      expect(playlist.songs[1].fileId).toBe('file_123');
    });

    it('should handle mixed playlists with both old and new format songs', async () => {
      const mixedPlaylist = {
        id: 'playlist_123',
        userId: 'user_456',
        name: 'Mixed Playlist',
        songs: [
          {
            id: 'song_1',
            title: 'Old Song',
            artist: 'Artist 1',
            audioUrl: 'https://example.com/song1.mp3',
            createdAt: '2024-01-01T00:00:00Z'
          },
          {
            id: 'song_2',
            title: 'New Song',
            artist: 'Artist 2',
            audioUrl: '/api/v1/files/file_123',
            sourceType: 'upload',
            fileId: 'file_123',
            createdAt: '2024-01-02T00:00:00Z'
          }
        ],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      };

      const testFile = path.join(testPlaylistsDir, 'test-playlist.json');
      await fs.writeFile(testFile, JSON.stringify(mixedPlaylist, null, 2));

      // Run migration
      await migratePlaylistFile(testFile);

      // Read migrated file
      const content = await fs.readFile(testFile, 'utf-8');
      const playlist = JSON.parse(content);

      // Verify migration
      expect(playlist.songs[0].sourceType).toBe('url');
      expect(playlist.songs[0].fileId).toBe(null);
      expect(playlist.songs[1].sourceType).toBe('upload');
      expect(playlist.songs[1].fileId).toBe('file_123');
    });
  });

  describe('migrateAllPlaylists', () => {
    it('should migrate all playlist files in the directory', async () => {
      // Create multiple test playlists
      const playlist1 = {
        id: 'playlist_1',
        userId: 'user_1',
        name: 'Playlist 1',
        songs: [
          {
            id: 'song_1',
            title: 'Song 1',
            artist: 'Artist 1',
            audioUrl: 'https://example.com/song1.mp3',
            createdAt: '2024-01-01T00:00:00Z'
          }
        ],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      const playlist2 = {
        id: 'playlist_2',
        userId: 'user_2',
        name: 'Playlist 2',
        songs: [
          {
            id: 'song_2',
            title: 'Song 2',
            artist: 'Artist 2',
            audioUrl: 'https://example.com/song2.mp3',
            createdAt: '2024-01-02T00:00:00Z'
          }
        ],
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      };

      await fs.writeFile(
        path.join(testPlaylistsDir, 'playlist1.json'),
        JSON.stringify(playlist1, null, 2)
      );
      await fs.writeFile(
        path.join(testPlaylistsDir, 'playlist2.json'),
        JSON.stringify(playlist2, null, 2)
      );

      // Run migration
      await migrateAllPlaylists(testDataDir);

      // Verify both files were migrated
      const content1 = await fs.readFile(
        path.join(testPlaylistsDir, 'playlist1.json'),
        'utf-8'
      );
      const content2 = await fs.readFile(
        path.join(testPlaylistsDir, 'playlist2.json'),
        'utf-8'
      );

      const migratedPlaylist1 = JSON.parse(content1);
      const migratedPlaylist2 = JSON.parse(content2);

      expect(migratedPlaylist1.songs[0].sourceType).toBe('url');
      expect(migratedPlaylist1.songs[0].fileId).toBe(null);
      expect(migratedPlaylist2.songs[0].sourceType).toBe('url');
      expect(migratedPlaylist2.songs[0].fileId).toBe(null);
    });

    it('should handle empty playlists directory gracefully', async () => {
      // Run migration on empty directory
      await expect(migrateAllPlaylists(testDataDir)).resolves.not.toThrow();
    });

    it('should handle non-existent playlists directory gracefully', async () => {
      // Remove the playlists directory
      await fs.rm(testPlaylistsDir, { recursive: true, force: true });

      // Run migration
      await expect(migrateAllPlaylists(testDataDir)).resolves.not.toThrow();
    });
  });
});
