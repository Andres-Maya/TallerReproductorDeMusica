import { Playlist } from '../domain/Playlist';
import { Song, CreateSongPayload } from '../domain/Song';
import { PlaylistRepository } from '../persistence/PlaylistRepository';

/**
 * PlaylistManager — application service for playlist operations with multi-user support.
 * 
 * Encapsulates all playlist + song management logic with user isolation.
 * All operations require a userId to ensure multi-user data separation.
 * 
 * **Validates: Requirements 9.1, 9.2, 9.3, 9.5**
 */
export class PlaylistManager {
  constructor(private playlistRepository: PlaylistRepository) {}

  /**
   * Create a new playlist for a user
   * 
   * @param userId - ID of the user creating the playlist
   * @param name - Name of the playlist
   * @returns Created playlist
   * 
   * **Validates: Requirements 9.1, 9.2**
   */
  async createPlaylist(userId: string, name: string): Promise<Playlist> {
    const playlist = Playlist.create(name, userId);
    return this.playlistRepository.create(playlist);
  }

  /**
   * Get all playlists for a specific user
   * 
   * @param userId - ID of the user
   * @returns Array of user's playlists
   * 
   * **Validates: Requirements 9.2, 9.3**
   */
  async getUserPlaylists(userId: string): Promise<Playlist[]> {
    return this.playlistRepository.findByUserId(userId);
  }

  /**
   * Get a specific playlist by ID
   * 
   * @param playlistId - ID of the playlist
   * @param userId - ID of the user (for ownership validation)
   * @returns Playlist with songs if found and owned by user
   * @throws Error if playlist not found or not owned by user
   * 
   * **Validates: Requirements 9.3, 9.4**
   */
  async getPlaylist(playlistId: string, userId: string): Promise<{ playlist: Playlist; songs: Song[] }> {
    const result = await this.playlistRepository.findById(playlistId);
    
    if (!result) {
      throw new NotFoundError(`Playlist '${playlistId}' not found`);
    }

    // Verify ownership
    if (result.playlist.userId !== userId) {
      throw new ForbiddenError('You do not have permission to access this playlist');
    }

    return result;
  }

  /**
   * Rename a playlist
   * 
   * @param playlistId - ID of the playlist
   * @param userId - ID of the user (for ownership validation)
   * @param newName - New name for the playlist
   * @returns Updated playlist
   * @throws Error if playlist not found or not owned by user
   * 
   * **Validates: Requirements 9.3, 9.6**
   */
  async renamePlaylist(playlistId: string, userId: string, newName: string): Promise<Playlist> {
    const result = await this.playlistRepository.findById(playlistId);
    
    if (!result) {
      throw new NotFoundError(`Playlist '${playlistId}' not found`);
    }

    // Verify ownership
    if (result.playlist.userId !== userId) {
      throw new ForbiddenError('You do not have permission to modify this playlist');
    }

    result.playlist.rename(newName);
    return this.playlistRepository.update(result.playlist);
  }

  /**
   * Delete a playlist
   * 
   * @param playlistId - ID of the playlist
   * @param userId - ID of the user (for ownership validation)
   * @throws Error if playlist not found or not owned by user
   * 
   * **Validates: Requirements 9.3, 9.6**
   */
  async deletePlaylist(playlistId: string, userId: string): Promise<void> {
    const result = await this.playlistRepository.findById(playlistId);
    
    if (!result) {
      throw new NotFoundError(`Playlist '${playlistId}' not found`);
    }

    // Verify ownership
    if (result.playlist.userId !== userId) {
      throw new ForbiddenError('You do not have permission to delete this playlist');
    }

    await this.playlistRepository.delete(playlistId);
  }

  /**
   * Add a song to a playlist
   * 
   * @param playlistId - ID of the playlist
   * @param userId - ID of the user (for ownership validation)
   * @param payload - Song data
   * @param position - Optional position (0-based index)
   * @returns Created song
   * @throws Error if playlist not found or not owned by user
   * 
   * **Validates: Requirements 9.3, 9.6**
   */
  async addSong(
    playlistId: string,
    userId: string,
    payload: CreateSongPayload,
    position?: number
  ): Promise<Song> {
    const result = await this.playlistRepository.findById(playlistId);
    
    if (!result) {
      throw new NotFoundError(`Playlist '${playlistId}' not found`);
    }

    // Verify ownership
    if (result.playlist.userId !== userId) {
      throw new ForbiddenError('You do not have permission to modify this playlist');
    }

    const song = new Song(payload.title, payload.artist, payload.audioUrl);
    const errors = song.validate();
    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    await this.playlistRepository.addSong(playlistId, song, position);
    return song;
  }

  /**
   * Remove a song from a playlist
   * 
   * @param playlistId - ID of the playlist
   * @param userId - ID of the user (for ownership validation)
   * @param songId - ID of the song to remove
   * @returns Removed song
   * @throws Error if playlist not found, not owned by user, or song not found
   * 
   * **Validates: Requirements 9.3, 9.6**
   */
  async removeSong(playlistId: string, userId: string, songId: string): Promise<Song> {
    const result = await this.playlistRepository.findById(playlistId);
    
    if (!result) {
      throw new NotFoundError(`Playlist '${playlistId}' not found`);
    }

    // Verify ownership
    if (result.playlist.userId !== userId) {
      throw new ForbiddenError('You do not have permission to modify this playlist');
    }

    const song = result.songs.find(s => s.id === songId);
    if (!song) {
      throw new NotFoundError(`Song '${songId}' not found in playlist`);
    }

    await this.playlistRepository.removeSong(playlistId, songId);
    return song;
  }

  /**
   * Get all songs in a playlist
   * 
   * @param playlistId - ID of the playlist
   * @param userId - ID of the user (for ownership validation)
   * @returns Array of songs
   * @throws Error if playlist not found or not owned by user
   * 
   * **Validates: Requirements 9.3**
   */
  async getSongs(playlistId: string, userId: string): Promise<Song[]> {
    const result = await this.playlistRepository.findById(playlistId);
    
    if (!result) {
      throw new NotFoundError(`Playlist '${playlistId}' not found`);
    }

    // Verify ownership
    if (result.playlist.userId !== userId) {
      throw new ForbiddenError('You do not have permission to access this playlist');
    }

    return result.songs;
  }
}

/**
 * Domain Errors
 */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class ValidationError extends Error {
  public readonly errors: string[];
  
  constructor(errors: string[]) {
    super(errors.join(', '));
    this.name = 'ValidationError';
    this.errors = errors;
  }
}
