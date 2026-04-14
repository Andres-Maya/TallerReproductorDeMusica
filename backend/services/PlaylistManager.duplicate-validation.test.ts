/**
 * PlaylistManager - Duplicate Song Title Validation Tests
 * 
 * Tests for the duplicate song title validation feature added in task 16.3
 * 
 * @vitest-environment node
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PlaylistManager, ValidationError } from './PlaylistManager';
import { Playlist } from '../domain/Playlist';
import { Song } from '../domain/Song';
import { PlaylistRepository } from '../persistence/PlaylistRepository';

// Mock PlaylistRepository
class MockPlaylistRepository implements PlaylistRepository {
  private playlists: Map<string, { playlist: Playlist; songs: Song[] }> = new Map();

  async create(playlist: Playlist): Promise<Playlist> {
    this.playlists.set(playlist.id, { playlist, songs: [] });
    return playlist;
  }

  async findById(id: string): Promise<{ playlist: Playlist; songs: Song[] } | null> {
    return this.playlists.get(id) || null;
  }

  async findByUserId(userId: string): Promise<Playlist[]> {
    return Array.from(this.playlists.values())
      .filter(p => p.playlist.userId === userId)
      .map(p => p.playlist);
  }

  async update(playlist: Playlist): Promise<Playlist> {
    const existing = this.playlists.get(playlist.id);
    if (existing) {
      existing.playlist = playlist;
    }
    return playlist;
  }

  async delete(id: string): Promise<void> {
    this.playlists.delete(id);
  }

  async addSong(playlistId: string, song: Song, position?: number): Promise<void> {
    const existing = this.playlists.get(playlistId);
    if (existing) {
      if (position !== undefined) {
        existing.songs.splice(position, 0, song);
      } else {
        existing.songs.push(song);
      }
    }
  }

  async removeSong(playlistId: string, songId: string): Promise<void> {
    const existing = this.playlists.get(playlistId);
    if (existing) {
      existing.songs = existing.songs.filter(s => s.id !== songId);
    }
  }

  async updateSongPosition(playlistId: string, songId: string, newPosition: number): Promise<void> {
    const existing = this.playlists.get(playlistId);
    if (existing) {
      const songIndex = existing.songs.findIndex(s => s.id === songId);
      if (songIndex !== -1) {
        const [song] = existing.songs.splice(songIndex, 1);
        existing.songs.splice(newPosition, 0, song);
      }
    }
  }
}

describe('PlaylistManager - Duplicate Song Title Validation', () => {
  let playlistManager: PlaylistManager;
  let repository: MockPlaylistRepository;
  const userId = 'user-123';
  let playlistId: string;

  beforeEach(async () => {
    repository = new MockPlaylistRepository();
    playlistManager = new PlaylistManager(repository);

    // Create a test playlist
    const playlist = await playlistManager.createPlaylist(userId, 'Test Playlist');
    playlistId = playlist.id;

    // Add initial songs
    await playlistManager.addSong(playlistId, userId, {
      title: 'Bohemian Rhapsody',
      artist: 'Queen',
      audioUrl: 'https://example.com/bohemian.mp3'
    });

    await playlistManager.addSong(playlistId, userId, {
      title: 'Stairway to Heaven',
      artist: 'Led Zeppelin',
      audioUrl: 'https://example.com/stairway.mp3'
    });
  });

  describe('Duplicate Title Validation', () => {
    it('should reject duplicate song title (exact match)', async () => {
      await expect(
        playlistManager.addSong(playlistId, userId, {
          title: 'Bohemian Rhapsody',
          artist: 'Different Artist',
          audioUrl: 'https://example.com/different.mp3'
        })
      ).rejects.toThrow(ValidationError);

      await expect(
        playlistManager.addSong(playlistId, userId, {
          title: 'Bohemian Rhapsody',
          artist: 'Different Artist',
          audioUrl: 'https://example.com/different.mp3'
        })
      ).rejects.toThrow('A song with this title already exists in the playlist');
    });

    it('should reject duplicate song title (case-insensitive)', async () => {
      await expect(
        playlistManager.addSong(playlistId, userId, {
          title: 'BOHEMIAN RHAPSODY',
          artist: 'Different Artist',
          audioUrl: 'https://example.com/different.mp3'
        })
      ).rejects.toThrow(ValidationError);

      await expect(
        playlistManager.addSong(playlistId, userId, {
          title: 'bohemian rhapsody',
          artist: 'Different Artist',
          audioUrl: 'https://example.com/different.mp3'
        })
      ).rejects.toThrow(ValidationError);

      await expect(
        playlistManager.addSong(playlistId, userId, {
          title: 'BoHeMiAn RhApSoDy',
          artist: 'Different Artist',
          audioUrl: 'https://example.com/different.mp3'
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should reject duplicate with extra whitespace', async () => {
      await expect(
        playlistManager.addSong(playlistId, userId, {
          title: '  Bohemian Rhapsody  ',
          artist: 'Different Artist',
          audioUrl: 'https://example.com/different.mp3'
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should allow adding song with unique title', async () => {
      const song = await playlistManager.addSong(playlistId, userId, {
        title: 'Hotel California',
        artist: 'Eagles',
        audioUrl: 'https://example.com/hotel.mp3'
      });

      expect(song).toBeDefined();
      expect(song.title).toBe('Hotel California');

      const songs = await playlistManager.getSongs(playlistId, userId);
      expect(songs).toHaveLength(3);
      expect(songs.some(s => s.title === 'Hotel California')).toBe(true);
    });

    it('should allow same title in different playlists', async () => {
      // Create another playlist
      const playlist2 = await playlistManager.createPlaylist(userId, 'Another Playlist');

      // Should be able to add the same song title to different playlist
      const song = await playlistManager.addSong(playlist2.id, userId, {
        title: 'Bohemian Rhapsody',
        artist: 'Queen',
        audioUrl: 'https://example.com/bohemian.mp3'
      });

      expect(song).toBeDefined();
      expect(song.title).toBe('Bohemian Rhapsody');

      const songs = await playlistManager.getSongs(playlist2.id, userId);
      expect(songs).toHaveLength(1);
      expect(songs[0].title).toBe('Bohemian Rhapsody');
    });

    it('should allow adding song after removing duplicate', async () => {
      // Get the song to remove
      const songs = await playlistManager.getSongs(playlistId, userId);
      const bohemianRhapsody = songs.find(s => s.title === 'Bohemian Rhapsody');
      expect(bohemianRhapsody).toBeDefined();

      // Remove the song
      await playlistManager.removeSong(playlistId, userId, bohemianRhapsody!.id);

      // Now should be able to add a song with the same title
      const newSong = await playlistManager.addSong(playlistId, userId, {
        title: 'Bohemian Rhapsody',
        artist: 'Queen Cover Band',
        audioUrl: 'https://example.com/cover.mp3'
      });

      expect(newSong).toBeDefined();
      expect(newSong.title).toBe('Bohemian Rhapsody');
      expect(newSong.artist).toBe('Queen Cover Band');
    });
  });

  describe('Empty Playlist', () => {
    it('should allow adding first song to empty playlist', async () => {
      const emptyPlaylist = await playlistManager.createPlaylist(userId, 'Empty Playlist');

      const song = await playlistManager.addSong(emptyPlaylist.id, userId, {
        title: 'First Song',
        artist: 'First Artist',
        audioUrl: 'https://example.com/first.mp3'
      });

      expect(song).toBeDefined();
      expect(song.title).toBe('First Song');

      const songs = await playlistManager.getSongs(emptyPlaylist.id, userId);
      expect(songs).toHaveLength(1);
    });
  });
});
