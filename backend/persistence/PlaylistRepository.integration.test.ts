import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FilePlaylistRepository } from './PlaylistRepository';
import { Playlist } from '../domain/Playlist';
import { Song } from '../../Song';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Integration tests for PlaylistRepository.
 * 
 * These tests verify the complete workflow including:
 * - File system operations
 * - Index management
 * - Data persistence and retrieval
 * - Song management within playlists
 */
describe('PlaylistRepository Integration Tests', () => {
  const testDataDir = path.join(__dirname, '../../../test-data-playlists-integration');
  let repository: FilePlaylistRepository;

  beforeEach(async () => {
    // Clean up test data directory
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
    // Clean up test data directory
    try {
      await fs.rm(testDataDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should complete full playlist lifecycle: create, read, update, delete', async () => {
    // Create playlist
    const playlist = Playlist.create('Lifecycle Test', 'user_123');
    const created = await repository.create(playlist);
    expect(created.name).toBe('Lifecycle Test');

    // Read by ID
    const foundById = await repository.findById(playlist.id);
    expect(foundById).not.toBeNull();
    expect(foundById!.playlist.name).toBe('Lifecycle Test');
    expect(foundById!.songs).toEqual([]);

    // Read by user ID
    const foundByUserId = await repository.findByUserId('user_123');
    expect(foundByUserId).toHaveLength(1);
    expect(foundByUserId[0].id).toBe(playlist.id);

    // Update
    playlist.rename('Updated Name');
    await repository.update(playlist);
    const updated = await repository.findById(playlist.id);
    expect(updated!.playlist.name).toBe('Updated Name');

    // Delete
    await repository.delete(playlist.id);
    const deleted = await repository.findById(playlist.id);
    expect(deleted).toBeNull();
  });

  it('should maintain index consistency across operations', async () => {
    // Create multiple playlists for different users
    const playlist1 = Playlist.create('User1 Playlist1', 'user_1');
    const playlist2 = Playlist.create('User1 Playlist2', 'user_1');
    const playlist3 = Playlist.create('User2 Playlist1', 'user_2');

    await repository.create(playlist1);
    await repository.create(playlist2);
    await repository.create(playlist3);

    // Verify user1 has 2 playlists
    const user1Playlists = await repository.findByUserId('user_1');
    expect(user1Playlists).toHaveLength(2);

    // Verify user2 has 1 playlist
    const user2Playlists = await repository.findByUserId('user_2');
    expect(user2Playlists).toHaveLength(1);

    // Delete one of user1's playlists
    await repository.delete(playlist1.id);

    // Verify index updated correctly
    const user1PlaylistsAfter = await repository.findByUserId('user_1');
    expect(user1PlaylistsAfter).toHaveLength(1);
    expect(user1PlaylistsAfter[0].id).toBe(playlist2.id);

    // Verify user2's playlists unaffected
    const user2PlaylistsAfter = await repository.findByUserId('user_2');
    expect(user2PlaylistsAfter).toHaveLength(1);
  });

  it('should persist data across repository instances', async () => {
    // Create playlist with first repository instance
    const playlist = Playlist.create('Persistent Playlist', 'user_123');
    await repository.create(playlist);

    const song = new Song('Persistent Song', 'Artist', 'https://example.com/song.mp3');
    await repository.addSong(playlist.id, song);

    // Create new repository instance pointing to same data directory
    const newRepository = new FilePlaylistRepository(testDataDir);
    await new Promise(resolve => setTimeout(resolve, 50));

    // Verify playlist can be found with new instance
    const found = await newRepository.findById(playlist.id);
    expect(found).not.toBeNull();
    expect(found!.playlist.name).toBe('Persistent Playlist');
    expect(found!.songs).toHaveLength(1);
    expect(found!.songs[0].title).toBe('Persistent Song');
  });

  it('should handle complete song management workflow', async () => {
    // Create playlist
    const playlist = Playlist.create('Song Management Test', 'user_123');
    await repository.create(playlist);

    // Add multiple songs
    const song1 = new Song('Song 1', 'Artist 1', 'https://example.com/song1.mp3');
    const song2 = new Song('Song 2', 'Artist 2', 'https://example.com/song2.mp3');
    const song3 = new Song('Song 3', 'Artist 3', 'https://example.com/song3.mp3');

    await repository.addSong(playlist.id, song1);
    await repository.addSong(playlist.id, song2);
    await repository.addSong(playlist.id, song3);

    // Verify all songs added
    let songs = await repository.getSongs(playlist.id);
    expect(songs).toHaveLength(3);

    // Remove middle song
    await repository.removeSong(playlist.id, song2.id);

    // Verify song removed and order maintained
    songs = await repository.getSongs(playlist.id);
    expect(songs).toHaveLength(2);
    expect(songs[0].id).toBe(song1.id);
    expect(songs[1].id).toBe(song3.id);

    // Add song at specific position
    const song4 = new Song('Song 4', 'Artist 4', 'https://example.com/song4.mp3');
    await repository.addSong(playlist.id, song4, 1);

    // Verify insertion
    songs = await repository.getSongs(playlist.id);
    expect(songs).toHaveLength(3);
    expect(songs[0].id).toBe(song1.id);
    expect(songs[1].id).toBe(song4.id);
    expect(songs[2].id).toBe(song3.id);
  });

  it('should handle multi-user isolation', async () => {
    // Create playlists for different users
    const user1Playlist1 = Playlist.create('User1 Favorites', 'user_1');
    const user1Playlist2 = Playlist.create('User1 Workout', 'user_1');
    const user2Playlist1 = Playlist.create('User2 Chill', 'user_2');

    await repository.create(user1Playlist1);
    await repository.create(user1Playlist2);
    await repository.create(user2Playlist1);

    // Add songs to each playlist
    const song1 = new Song('Song 1', 'Artist 1', 'https://example.com/song1.mp3');
    const song2 = new Song('Song 2', 'Artist 2', 'https://example.com/song2.mp3');

    await repository.addSong(user1Playlist1.id, song1);
    await repository.addSong(user2Playlist1.id, song2);

    // Verify user1 can only see their playlists
    const user1Playlists = await repository.findByUserId('user_1');
    expect(user1Playlists).toHaveLength(2);
    expect(user1Playlists.map(p => p.id)).toContain(user1Playlist1.id);
    expect(user1Playlists.map(p => p.id)).toContain(user1Playlist2.id);
    expect(user1Playlists.map(p => p.id)).not.toContain(user2Playlist1.id);

    // Verify user2 can only see their playlists
    const user2Playlists = await repository.findByUserId('user_2');
    expect(user2Playlists).toHaveLength(1);
    expect(user2Playlists[0].id).toBe(user2Playlist1.id);

    // Verify songs are isolated
    const user1Songs = await repository.getSongs(user1Playlist1.id);
    const user2Songs = await repository.getSongs(user2Playlist1.id);
    expect(user1Songs[0].id).toBe(song1.id);
    expect(user2Songs[0].id).toBe(song2.id);
  });

  it('should verify directory structure is created correctly', async () => {
    const playlist = Playlist.create('Structure Test', 'user_123');
    await repository.create(playlist);

    // Verify playlists directory exists
    const playlistsDir = path.join(testDataDir, 'playlists');
    const playlistsDirStats = await fs.stat(playlistsDir);
    expect(playlistsDirStats.isDirectory()).toBe(true);

    // Verify metadata directory exists
    const metadataDir = path.join(testDataDir, 'metadata');
    const metadataDirStats = await fs.stat(metadataDir);
    expect(metadataDirStats.isDirectory()).toBe(true);

    // Verify playlist file exists
    const playlistFile = path.join(playlistsDir, `${playlist.id}.json`);
    const playlistFileStats = await fs.stat(playlistFile);
    expect(playlistFileStats.isFile()).toBe(true);

    // Verify index file exists
    const indexFile = path.join(metadataDir, 'indexes.json');
    const indexFileStats = await fs.stat(indexFile);
    expect(indexFileStats.isFile()).toBe(true);
  });

  it('should handle playlist updates without losing songs', async () => {
    // Create playlist and add songs
    const playlist = Playlist.create('Update Test', 'user_123');
    await repository.create(playlist);

    const songs = [
      new Song('Song 1', 'Artist 1', 'https://example.com/song1.mp3'),
      new Song('Song 2', 'Artist 2', 'https://example.com/song2.mp3'),
      new Song('Song 3', 'Artist 3', 'https://example.com/song3.mp3'),
    ];

    for (const song of songs) {
      await repository.addSong(playlist.id, song);
    }

    // Update playlist name multiple times
    playlist.rename('First Update');
    await repository.update(playlist);

    playlist.rename('Second Update');
    await repository.update(playlist);

    playlist.rename('Final Update');
    await repository.update(playlist);

    // Verify songs preserved
    const found = await repository.findById(playlist.id);
    expect(found!.playlist.name).toBe('Final Update');
    expect(found!.songs).toHaveLength(3);
    expect(found!.songs.map(s => s.title)).toEqual(['Song 1', 'Song 2', 'Song 3']);
  });

  it('should handle empty playlist operations', async () => {
    const playlist = Playlist.create('Empty Playlist', 'user_123');
    await repository.create(playlist);

    // Get songs from empty playlist
    const songs = await repository.getSongs(playlist.id);
    expect(songs).toEqual([]);

    // Update empty playlist
    playlist.rename('Still Empty');
    await repository.update(playlist);

    const found = await repository.findById(playlist.id);
    expect(found!.playlist.name).toBe('Still Empty');
    expect(found!.songs).toEqual([]);

    // Delete empty playlist
    await repository.delete(playlist.id);
    const deleted = await repository.findById(playlist.id);
    expect(deleted).toBeNull();
  });

  it('should handle large number of songs in playlist', async () => {
    const playlist = Playlist.create('Large Playlist', 'user_123');
    await repository.create(playlist);

    // Add 100 songs
    const songs: Song[] = [];
    for (let i = 1; i <= 100; i++) {
      const song = new Song(`Song ${i}`, `Artist ${i}`, `https://example.com/song${i}.mp3`);
      songs.push(song);
      await repository.addSong(playlist.id, song);
    }

    // Verify all songs added
    const retrievedSongs = await repository.getSongs(playlist.id);
    expect(retrievedSongs).toHaveLength(100);

    // Verify order preserved
    for (let i = 0; i < 100; i++) {
      expect(retrievedSongs[i].title).toBe(`Song ${i + 1}`);
    }

    // Remove some songs
    await repository.removeSong(playlist.id, songs[0].id);
    await repository.removeSong(playlist.id, songs[50].id);
    await repository.removeSong(playlist.id, songs[99].id);

    // Verify correct songs removed
    const afterRemoval = await repository.getSongs(playlist.id);
    expect(afterRemoval).toHaveLength(97);
  });

  it('should handle sequential song additions reliably', async () => {
    const playlist = Playlist.create('Sequential Test', 'user_123');
    await repository.create(playlist);

    const songs = [
      new Song('Song 1', 'Artist 1', 'https://example.com/song1.mp3'),
      new Song('Song 2', 'Artist 2', 'https://example.com/song2.mp3'),
      new Song('Song 3', 'Artist 3', 'https://example.com/song3.mp3'),
    ];

    // Add songs sequentially (file-based storage doesn't handle concurrent writes well)
    for (const song of songs) {
      await repository.addSong(playlist.id, song);
    }

    // Verify all songs added in order
    const retrievedSongs = await repository.getSongs(playlist.id);
    expect(retrievedSongs).toHaveLength(3);
    
    expect(retrievedSongs[0].title).toBe('Song 1');
    expect(retrievedSongs[1].title).toBe('Song 2');
    expect(retrievedSongs[2].title).toBe('Song 3');
  });
});
