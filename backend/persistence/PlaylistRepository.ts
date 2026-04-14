import { Playlist, PlaylistDTO } from '../domain/Playlist';
import { Song, SongDTO } from '../domain/Song';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * PlaylistRepository — persistence interface for Playlist entities.
 * 
 * Defines the contract for storing and retrieving playlists with their songs.
 * Implementations can use different storage backends (files, databases, etc.)
 */
export interface PlaylistRepository {
  /**
   * Create a new playlist in the repository.
   * @throws Error if playlist creation fails
   */
  create(playlist: Playlist): Promise<Playlist>;

  /**
   * Find a playlist by its unique ID.
   * @returns Playlist if found, null otherwise
   */
  findById(id: string): Promise<PlaylistWithSongs | null>;

  /**
   * Find all playlists belonging to a specific user.
   * @returns Array of playlists (without songs)
   */
  findByUserId(userId: string): Promise<Playlist[]>;

  /**
   * Update an existing playlist.
   * @throws Error if playlist doesn't exist
   */
  update(playlist: Playlist): Promise<Playlist>;

  /**
   * Delete a playlist by ID.
   * @throws Error if playlist doesn't exist
   */
  delete(id: string): Promise<void>;

  /**
   * Add a song to a playlist.
   * @param playlistId The playlist ID
   * @param song The song to add
   * @param position Optional position (0-based index), defaults to end
   * @throws Error if playlist doesn't exist
   */
  addSong(playlistId: string, song: Song, position?: number): Promise<void>;

  /**
   * Remove a song from a playlist.
   * @param playlistId The playlist ID
   * @param songId The song ID to remove
   * @throws Error if playlist or song doesn't exist
   */
  removeSong(playlistId: string, songId: string): Promise<void>;

  /**
   * Get all songs in a playlist.
   * @returns Array of songs in order
   */
  getSongs(playlistId: string): Promise<Song[]>;
}

/**
 * PlaylistWithSongs — playlist entity with its songs.
 */
export interface PlaylistWithSongs {
  playlist: Playlist;
  songs: Song[];
}

/**
 * FilePlaylistRepository — file-based implementation of PlaylistRepository.
 * 
 * Stores playlists as individual JSON files in data/playlists/{playlistId}.json
 * Maintains a user playlist index in data/metadata/indexes.json for fast lookups
 */
export class FilePlaylistRepository implements PlaylistRepository {
  private readonly playlistsDir: string;
  private readonly metadataDir: string;
  private readonly indexPath: string;

  constructor(dataDir: string = 'data') {
    this.playlistsDir = path.join(dataDir, 'playlists');
    this.metadataDir = path.join(dataDir, 'metadata');
    this.indexPath = path.join(this.metadataDir, 'indexes.json');
    
    // Initialize directories on construction
    this.initializeDirectories();
  }

  /**
   * Ensure required directories exist.
   */
  private async initializeDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.playlistsDir, { recursive: true });
      await fs.mkdir(this.metadataDir, { recursive: true });
      
      // Initialize index file if it doesn't exist
      try {
        await fs.access(this.indexPath);
      } catch {
        await this.saveIndex({ usernameToId: {}, userPlaylists: {} });
      }
    } catch (error) {
      console.error('Failed to initialize directories:', error);
      throw new Error('Failed to initialize playlist repository');
    }
  }

  async create(playlist: Playlist): Promise<Playlist> {
    // Validate playlist
    const errors = playlist.validate();
    if (errors.length > 0) {
      throw new Error(`Playlist validation failed: ${errors.join(', ')}`);
    }

    // Save playlist file with empty songs array
    const playlistPath = this.getPlaylistPath(playlist.id);
    const data: PlaylistFileData = {
      ...playlist.toJSON(),
      songs: []
    };
    await fs.writeFile(playlistPath, JSON.stringify(data, null, 2), 'utf-8');

    // Update user playlist index
    await this.addToUserIndex(playlist.userId, playlist.id);

    return playlist;
  }

  async findById(id: string): Promise<PlaylistWithSongs | null> {
    try {
      const playlistPath = this.getPlaylistPath(id);
      const content = await fs.readFile(playlistPath, 'utf-8');
      const data: PlaylistFileData = JSON.parse(content);
      
      const playlist = Playlist.fromDTO({
        id: data.id,
        userId: data.userId,
        name: data.name,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      });
      
      const songs = data.songs.map(songData => Song.fromDTO(songData));
      
      return { playlist, songs };
    } catch (error) {
      // File doesn't exist or is invalid
      return null;
    }
  }

  async findByUserId(userId: string): Promise<Playlist[]> {
    const index = await this.loadIndex();
    const playlistIds = index.userPlaylists[userId] || [];
    
    const playlists: Playlist[] = [];
    for (const playlistId of playlistIds) {
      const result = await this.findById(playlistId);
      if (result) {
        playlists.push(result.playlist);
      }
    }
    
    return playlists;
  }

  async update(playlist: Playlist): Promise<Playlist> {
    // Verify playlist exists
    const existing = await this.findById(playlist.id);
    if (!existing) {
      throw new Error(`Playlist with id '${playlist.id}' not found`);
    }

    // Validate playlist
    const errors = playlist.validate();
    if (errors.length > 0) {
      throw new Error(`Playlist validation failed: ${errors.join(', ')}`);
    }

    // Save updated playlist file (preserve songs)
    const playlistPath = this.getPlaylistPath(playlist.id);
    const data: PlaylistFileData = {
      ...playlist.toJSON(),
      songs: existing.songs.map(song => song.toJSON())
    };
    await fs.writeFile(playlistPath, JSON.stringify(data, null, 2), 'utf-8');

    return playlist;
  }

  async delete(id: string): Promise<void> {
    // Verify playlist exists
    const result = await this.findById(id);
    if (!result) {
      throw new Error(`Playlist with id '${id}' not found`);
    }

    // Remove from user index
    await this.removeFromUserIndex(result.playlist.userId, id);

    // Delete playlist file
    const playlistPath = this.getPlaylistPath(id);
    await fs.unlink(playlistPath);
  }

  async addSong(playlistId: string, song: Song, position?: number): Promise<void> {
    // Verify playlist exists
    const result = await this.findById(playlistId);
    if (!result) {
      throw new Error(`Playlist with id '${playlistId}' not found`);
    }

    // Validate song
    const errors = song.validate();
    if (errors.length > 0) {
      throw new Error(`Song validation failed: ${errors.join(', ')}`);
    }

    const songs = result.songs;
    
    // Add song at specified position or end
    if (position !== undefined && position >= 0 && position <= songs.length) {
      songs.splice(position, 0, song);
    } else {
      songs.push(song);
    }

    // Update playlist file
    const playlistPath = this.getPlaylistPath(playlistId);
    const data: PlaylistFileData = {
      ...result.playlist.toJSON(),
      songs: songs.map(s => s.toJSON())
    };
    await fs.writeFile(playlistPath, JSON.stringify(data, null, 2), 'utf-8');
  }

  async removeSong(playlistId: string, songId: string): Promise<void> {
    // Verify playlist exists
    const result = await this.findById(playlistId);
    if (!result) {
      throw new Error(`Playlist with id '${playlistId}' not found`);
    }

    const songs = result.songs;
    const songIndex = songs.findIndex(s => s.id === songId);
    
    if (songIndex === -1) {
      throw new Error(`Song with id '${songId}' not found in playlist '${playlistId}'`);
    }

    // Remove song
    songs.splice(songIndex, 1);

    // Update playlist file
    const playlistPath = this.getPlaylistPath(playlistId);
    const data: PlaylistFileData = {
      ...result.playlist.toJSON(),
      songs: songs.map(s => s.toJSON())
    };
    await fs.writeFile(playlistPath, JSON.stringify(data, null, 2), 'utf-8');
  }

  async getSongs(playlistId: string): Promise<Song[]> {
    const result = await this.findById(playlistId);
    if (!result) {
      throw new Error(`Playlist with id '${playlistId}' not found`);
    }
    return result.songs;
  }

  /**
   * Get the file path for a playlist by ID.
   */
  private getPlaylistPath(playlistId: string): string {
    return path.join(this.playlistsDir, `${playlistId}.json`);
  }

  /**
   * Load the index from disk.
   */
  private async loadIndex(): Promise<PlaylistIndex> {
    try {
      const content = await fs.readFile(this.indexPath, 'utf-8');
      const index = JSON.parse(content);
      // Ensure userPlaylists exists
      if (!index.userPlaylists) {
        index.userPlaylists = {};
      }
      return index;
    } catch {
      // If index doesn't exist or is corrupted, return empty index
      return { usernameToId: {}, userPlaylists: {} };
    }
  }

  /**
   * Save the index to disk.
   */
  private async saveIndex(index: PlaylistIndex): Promise<void> {
    await fs.writeFile(this.indexPath, JSON.stringify(index, null, 2), 'utf-8');
  }

  /**
   * Add a playlist to a user's index.
   */
  private async addToUserIndex(userId: string, playlistId: string): Promise<void> {
    const index = await this.loadIndex();
    if (!index.userPlaylists[userId]) {
      index.userPlaylists[userId] = [];
    }
    if (!index.userPlaylists[userId].includes(playlistId)) {
      index.userPlaylists[userId].push(playlistId);
    }
    await this.saveIndex(index);
  }

  /**
   * Remove a playlist from a user's index.
   */
  private async removeFromUserIndex(userId: string, playlistId: string): Promise<void> {
    const index = await this.loadIndex();
    if (index.userPlaylists[userId]) {
      index.userPlaylists[userId] = index.userPlaylists[userId].filter(
        id => id !== playlistId
      );
    }
    await this.saveIndex(index);
  }
}

/**
 * PlaylistIndex — structure for the playlist index file.
 */
interface PlaylistIndex {
  usernameToId: Record<string, string>;
  userPlaylists: Record<string, string[]>;
}

/**
 * PlaylistFileData — structure for playlist JSON files.
 */
interface PlaylistFileData extends PlaylistDTO {
  songs: SongDTO[];
}
