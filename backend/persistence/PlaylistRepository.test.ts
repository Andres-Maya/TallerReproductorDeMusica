import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FilePlaylistRepository } from './PlaylistRepository';
import { Playlist } from '../domain/Playlist';
import { Song } from '../../Song';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('FilePlaylistRepository', () => {
  const testDataDir = path.join(__dirname, '../../../test-data-playlists');
  let repository: FilePlaylistRepository;

  beforeEach(async () => {
    // Clean up test data directory before each test
    try {
      await fs.rm(testDataDir, { recursive: true, force: true });
    } catch {
      // Directory might not exist
    }
    
    repository = new FilePlaylistRepository(testDataDir);
    // Give time for directory initialization
    await new Promise(resolve => setTimeout(resolve, 50));
  });

  afterEach(async () => {
    // Clean up test data directory after each test
    try {
      await fs.rm(testDataDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('create', () => {
    it('should create a new playlist and save to file', async () => {
      const playlist = Playlist.create('My Favorites', 'user_123');
      
      const created = await repository.create(playlist);
      
      expect(created.id).toBe(playlist.id);
      expect(created.name).toBe('My Favorites');
      expect(created.userId).toBe('user_123');
      
      // Verify file was created
      const playlistPath = path.join(testDataDir, 'playlists', `${playlist.id}.json`);
      const fileContent = await fs.readFile(playlistPath, 'utf-8');
      const data = JSON.parse(fileContent);
      expect(data.name).toBe('My Favorites');
      expect(data.userId).toBe('user_123');
      expect(data.songs).toEqual([]);
    });

    it('should update the user playlist index when creating a playlist', async () => {
      const playlist = Playlist.create('Index Test', 'user_456');
      
      await repository.create(playlist);
      
      // Verify index was updated
      const indexPath = path.join(testDataDir, 'metadata', 'indexes.json');
      const indexContent = await fs.readFile(indexPath, 'utf-8');
      const index = JSON.parse(indexContent);
      expect(index.userPlaylists['user_456']).toContain(playlist.id);
    });

    it('should throw error if playlist validation fails', async () => {
      const invalidPlaylist = new Playlist('', 'user_123');
      
      await expect(repository.create(invalidPlaylist)).rejects.toThrow(
        'Playlist validation failed'
      );
    });

    it('should create multiple playlists for the same user', async () => {
      const playlist1 = Playlist.create('Playlist 1', 'user_789');
      const playlist2 = Playlist.create('Playlist 2', 'user_789');
      
      await repository.create(playlist1);
      await repository.create(playlist2);
      
      const indexPath = path.join(testDataDir, 'metadata', 'indexes.json');
      const indexContent = await fs.readFile(indexPath, 'utf-8');
      const index = JSON.parse(indexContent);
      expect(index.userPlaylists['user_789']).toHaveLength(2);
      expect(index.userPlaylists['user_789']).toContain(playlist1.id);
      expect(index.userPlaylists['user_789']).toContain(playlist2.id);
    });
  });

  describe('findById', () => {
    it('should find an existing playlist by ID', async () => {
      const playlist = Playlist.create('Find Me', 'user_123');
      await repository.create(playlist);
      
      const found = await repository.findById(playlist.id);
      
      expect(found).not.toBeNull();
      expect(found!.playlist.id).toBe(playlist.id);
      expect(found!.playlist.name).toBe('Find Me');
      expect(found!.playlist.userId).toBe('user_123');
      expect(found!.songs).toEqual([]);
    });

    it('should return null for non-existent playlist ID', async () => {
      const found = await repository.findById('nonexistent_id');
      
      expect(found).toBeNull();
    });

    it('should return playlist with songs', async () => {
      const playlist = Playlist.create('With Songs', 'user_123');
      await repository.create(playlist);
      
      const song = new Song('Test Song', 'Test Artist', 'https://example.com/song.mp3');
      await repository.addSong(playlist.id, song);
      
      const found = await repository.findById(playlist.id);
      
      expect(found).not.toBeNull();
      expect(found!.songs).toHaveLength(1);
      expect(found!.songs[0].title).toBe('Test Song');
    });
  });

  describe('findByUserId', () => {
    it('should find all playlists for a user', async () => {
      const playlist1 = Playlist.create('Playlist 1', 'user_123');
      const playlist2 = Playlist.create('Playlist 2', 'user_123');
      const playlist3 = Playlist.create('Playlist 3', 'user_456');
      
      await repository.create(playlist1);
      await repository.create(playlist2);
      await repository.create(playlist3);
      
      const playlists = await repository.findByUserId('user_123');
      
      expect(playlists).toHaveLength(2);
      expect(playlists.map(p => p.id)).toContain(playlist1.id);
      expect(playlists.map(p => p.id)).toContain(playlist2.id);
      expect(playlists.map(p => p.id)).not.toContain(playlist3.id);
    });

    it('should return empty array for user with no playlists', async () => {
      const playlists = await repository.findByUserId('user_nonexistent');
      
      expect(playlists).toEqual([]);
    });

    it('should return playlists without songs array', async () => {
      const playlist = Playlist.create('Test', 'user_123');
      await repository.create(playlist);
      
      const song = new Song('Song', 'Artist', 'https://example.com/song.mp3');
      await repository.addSong(playlist.id, song);
      
      const playlists = await repository.findByUserId('user_123');
      
      expect(playlists).toHaveLength(1);
      expect(playlists[0]).toBeInstanceOf(Playlist);
      // Songs are not included in findByUserId results
    });
  });

  describe('update', () => {
    it('should update an existing playlist', async () => {
      const playlist = Playlist.create('Original Name', 'user_123');
      await repository.create(playlist);
      
      playlist.rename('Updated Name');
      const updated = await repository.update(playlist);
      
      expect(updated.name).toBe('Updated Name');
      
      // Verify file was updated
      const found = await repository.findById(playlist.id);
      expect(found!.playlist.name).toBe('Updated Name');
    });

    it('should throw error when updating non-existent playlist', async () => {
      const playlist = Playlist.create('Ghost', 'user_123');
      
      await expect(repository.update(playlist)).rejects.toThrow(
        `Playlist with id '${playlist.id}' not found`
      );
    });

    it('should preserve songs when updating playlist', async () => {
      const playlist = Playlist.create('Test', 'user_123');
      await repository.create(playlist);
      
      const song = new Song('Song', 'Artist', 'https://example.com/song.mp3');
      await repository.addSong(playlist.id, song);
      
      playlist.rename('New Name');
      await repository.update(playlist);
      
      const found = await repository.findById(playlist.id);
      expect(found!.playlist.name).toBe('New Name');
      expect(found!.songs).toHaveLength(1);
      expect(found!.songs[0].title).toBe('Song');
    });

    it('should throw error if updated playlist fails validation', async () => {
      const playlist = Playlist.create('Valid', 'user_123');
      await repository.create(playlist);
      
      // Create invalid playlist with same ID
      const invalidPlaylist = new Playlist('', 'user_123', playlist.id);
      
      await expect(repository.update(invalidPlaylist)).rejects.toThrow(
        'Playlist validation failed'
      );
    });
  });

  describe('delete', () => {
    it('should delete an existing playlist', async () => {
      const playlist = Playlist.create('Delete Me', 'user_123');
      await repository.create(playlist);
      
      await repository.delete(playlist.id);
      
      // Playlist should not be found
      const found = await repository.findById(playlist.id);
      expect(found).toBeNull();
    });

    it('should throw error when deleting non-existent playlist', async () => {
      await expect(repository.delete('nonexistent')).rejects.toThrow(
        "Playlist with id 'nonexistent' not found"
      );
    });

    it('should remove playlist from user index', async () => {
      const playlist = Playlist.create('Remove Me', 'user_123');
      await repository.create(playlist);
      
      await repository.delete(playlist.id);
      
      const playlists = await repository.findByUserId('user_123');
      expect(playlists).toEqual([]);
    });

    it('should remove playlist file from disk', async () => {
      const playlist = Playlist.create('Remove File', 'user_123');
      await repository.create(playlist);
      
      const playlistPath = path.join(testDataDir, 'playlists', `${playlist.id}.json`);
      
      // Verify file exists
      await fs.access(playlistPath);
      
      await repository.delete(playlist.id);
      
      // Verify file was deleted
      await expect(fs.access(playlistPath)).rejects.toThrow();
    });
  });

  describe('addSong', () => {
    it('should add a song to the end of playlist', async () => {
      const playlist = Playlist.create('Test', 'user_123');
      await repository.create(playlist);
      
      const song = new Song('Song 1', 'Artist 1', 'https://example.com/song1.mp3');
      await repository.addSong(playlist.id, song);
      
      const songs = await repository.getSongs(playlist.id);
      expect(songs).toHaveLength(1);
      expect(songs[0].title).toBe('Song 1');
    });

    it('should add a song at specified position', async () => {
      const playlist = Playlist.create('Test', 'user_123');
      await repository.create(playlist);
      
      const song1 = new Song('Song 1', 'Artist 1', 'https://example.com/song1.mp3');
      const song2 = new Song('Song 2', 'Artist 2', 'https://example.com/song2.mp3');
      const song3 = new Song('Song 3', 'Artist 3', 'https://example.com/song3.mp3');
      
      await repository.addSong(playlist.id, song1);
      await repository.addSong(playlist.id, song2);
      await repository.addSong(playlist.id, song3, 1); // Insert at position 1
      
      const songs = await repository.getSongs(playlist.id);
      expect(songs).toHaveLength(3);
      expect(songs[0].title).toBe('Song 1');
      expect(songs[1].title).toBe('Song 3');
      expect(songs[2].title).toBe('Song 2');
    });

    it('should throw error if playlist does not exist', async () => {
      const song = new Song('Song', 'Artist', 'https://example.com/song.mp3');
      
      await expect(repository.addSong('nonexistent', song)).rejects.toThrow(
        "Playlist with id 'nonexistent' not found"
      );
    });

    it('should throw error if song validation fails', async () => {
      const playlist = Playlist.create('Test', 'user_123');
      await repository.create(playlist);
      
      const invalidSong = new Song('', '', '');
      
      await expect(repository.addSong(playlist.id, invalidSong)).rejects.toThrow(
        'Song validation failed'
      );
    });

    it('should add multiple songs in order', async () => {
      const playlist = Playlist.create('Test', 'user_123');
      await repository.create(playlist);
      
      const songs = [
        new Song('Song 1', 'Artist 1', 'https://example.com/song1.mp3'),
        new Song('Song 2', 'Artist 2', 'https://example.com/song2.mp3'),
        new Song('Song 3', 'Artist 3', 'https://example.com/song3.mp3'),
      ];
      
      for (const song of songs) {
        await repository.addSong(playlist.id, song);
      }
      
      const retrievedSongs = await repository.getSongs(playlist.id);
      expect(retrievedSongs).toHaveLength(3);
      expect(retrievedSongs[0].title).toBe('Song 1');
      expect(retrievedSongs[1].title).toBe('Song 2');
      expect(retrievedSongs[2].title).toBe('Song 3');
    });
  });

  describe('removeSong', () => {
    it('should remove a song from playlist', async () => {
      const playlist = Playlist.create('Test', 'user_123');
      await repository.create(playlist);
      
      const song1 = new Song('Song 1', 'Artist 1', 'https://example.com/song1.mp3');
      const song2 = new Song('Song 2', 'Artist 2', 'https://example.com/song2.mp3');
      
      await repository.addSong(playlist.id, song1);
      await repository.addSong(playlist.id, song2);
      
      await repository.removeSong(playlist.id, song1.id);
      
      const songs = await repository.getSongs(playlist.id);
      expect(songs).toHaveLength(1);
      expect(songs[0].title).toBe('Song 2');
    });

    it('should throw error if playlist does not exist', async () => {
      await expect(repository.removeSong('nonexistent', 'song_id')).rejects.toThrow(
        "Playlist with id 'nonexistent' not found"
      );
    });

    it('should throw error if song does not exist in playlist', async () => {
      const playlist = Playlist.create('Test', 'user_123');
      await repository.create(playlist);
      
      await expect(repository.removeSong(playlist.id, 'nonexistent_song')).rejects.toThrow(
        "Song with id 'nonexistent_song' not found in playlist"
      );
    });

    it('should maintain order when removing middle song', async () => {
      const playlist = Playlist.create('Test', 'user_123');
      await repository.create(playlist);
      
      const song1 = new Song('Song 1', 'Artist 1', 'https://example.com/song1.mp3');
      const song2 = new Song('Song 2', 'Artist 2', 'https://example.com/song2.mp3');
      const song3 = new Song('Song 3', 'Artist 3', 'https://example.com/song3.mp3');
      
      await repository.addSong(playlist.id, song1);
      await repository.addSong(playlist.id, song2);
      await repository.addSong(playlist.id, song3);
      
      await repository.removeSong(playlist.id, song2.id);
      
      const songs = await repository.getSongs(playlist.id);
      expect(songs).toHaveLength(2);
      expect(songs[0].title).toBe('Song 1');
      expect(songs[1].title).toBe('Song 3');
    });
  });

  describe('getSongs', () => {
    it('should return empty array for playlist with no songs', async () => {
      const playlist = Playlist.create('Empty', 'user_123');
      await repository.create(playlist);
      
      const songs = await repository.getSongs(playlist.id);
      
      expect(songs).toEqual([]);
    });

    it('should return all songs in order', async () => {
      const playlist = Playlist.create('Test', 'user_123');
      await repository.create(playlist);
      
      const song1 = new Song('Song 1', 'Artist 1', 'https://example.com/song1.mp3');
      const song2 = new Song('Song 2', 'Artist 2', 'https://example.com/song2.mp3');
      
      await repository.addSong(playlist.id, song1);
      await repository.addSong(playlist.id, song2);
      
      const songs = await repository.getSongs(playlist.id);
      
      expect(songs).toHaveLength(2);
      expect(songs[0].id).toBe(song1.id);
      expect(songs[1].id).toBe(song2.id);
    });

    it('should throw error if playlist does not exist', async () => {
      await expect(repository.getSongs('nonexistent')).rejects.toThrow(
        "Playlist with id 'nonexistent' not found"
      );
    });
  });

  describe('concurrent operations', () => {
    it('should handle multiple playlists created concurrently', async () => {
      const playlists = [
        Playlist.create('Playlist 1', 'user_123'),
        Playlist.create('Playlist 2', 'user_123'),
        Playlist.create('Playlist 3', 'user_456'),
      ];
      
      // Create all playlists concurrently
      await Promise.all(playlists.map(p => repository.create(p)));
      
      // Verify all playlists exist
      for (const playlist of playlists) {
        const found = await repository.findById(playlist.id);
        expect(found).not.toBeNull();
        expect(found!.playlist.name).toBe(playlist.name);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle playlist names with special characters', async () => {
      const playlist = Playlist.create('My "Awesome" Playlist!', 'user_123');
      await repository.create(playlist);
      
      const found = await repository.findById(playlist.id);
      
      expect(found).not.toBeNull();
      expect(found!.playlist.name).toBe('My "Awesome" Playlist!');
    });

    it('should handle very long playlist IDs', async () => {
      const longId = 'pl_' + 'a'.repeat(100);
      const playlist = new Playlist('Long ID', 'user_123', longId);
      await repository.create(playlist);
      
      const found = await repository.findById(longId);
      
      expect(found).not.toBeNull();
      expect(found!.playlist.id).toBe(longId);
    });

    it('should handle adding same song multiple times', async () => {
      const playlist = Playlist.create('Test', 'user_123');
      await repository.create(playlist);
      
      const song = new Song('Song', 'Artist', 'https://example.com/song.mp3');
      
      await repository.addSong(playlist.id, song);
      await repository.addSong(playlist.id, song);
      
      const songs = await repository.getSongs(playlist.id);
      expect(songs).toHaveLength(2);
      expect(songs[0].id).toBe(song.id);
      expect(songs[1].id).toBe(song.id);
    });
  });
});
