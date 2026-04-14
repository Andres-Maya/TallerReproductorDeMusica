/**
 * PlaylistApi - Playlist management API client
 * 
 * Features:
 * - Get all user playlists
 * - Create new playlist
 * - Get playlist details with songs
 * - Update playlist name
 * - Delete playlist
 * - Add song to playlist
 * - Remove song from playlist
 * - Get all songs in playlist
 * 
 * Requirements: 3.3, 3.4, 3.5
 */

import { ApiClient } from './ApiClient';

/**
 * Playlist types
 */
export interface PlaylistDTO {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  songCount?: number;
}

export interface PlaylistWithSongsDTO {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  songs: SongDTO[];
}

export interface SongDTO {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  createdAt: string;
}

export interface CreatePlaylistRequest {
  name: string;
}

export interface UpdatePlaylistRequest {
  name: string;
}

export interface AddSongRequest {
  title: string;
  artist: string;
  audioUrl: string;
  position?: number;
}

/**
 * PlaylistApi - Handles playlist-related API calls
 * 
 * Requirements: 3.3, 3.4, 3.5
 */
export class PlaylistApi {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * Get all playlists for authenticated user
   * 
   * @returns Array of playlists with song counts
   * 
   * Requirements: 3.3
   */
  async getPlaylists(): Promise<PlaylistDTO[]> {
    return this.apiClient.get<PlaylistDTO[]>('/api/v1/playlists');
  }

  /**
   * Create a new playlist
   * 
   * @param name - Name of the playlist
   * @returns Created playlist
   * 
   * Requirements: 3.3
   */
  async createPlaylist(name: string): Promise<PlaylistDTO> {
    const payload: CreatePlaylistRequest = { name };
    return this.apiClient.post<PlaylistDTO>('/api/v1/playlists', payload);
  }

  /**
   * Get playlist details with songs
   * 
   * @param id - Playlist ID
   * @returns Playlist with songs
   * 
   * Requirements: 3.5
   */
  async getPlaylist(id: string): Promise<PlaylistWithSongsDTO> {
    return this.apiClient.get<PlaylistWithSongsDTO>(`/api/v1/playlists/${id}`);
  }

  /**
   * Update playlist name
   * 
   * @param id - Playlist ID
   * @param name - New name
   * @returns Updated playlist
   * 
   * Requirements: 3.4
   */
  async updatePlaylist(id: string, name: string): Promise<PlaylistDTO> {
    const payload: UpdatePlaylistRequest = { name };
    return this.apiClient.put<PlaylistDTO>(`/api/v1/playlists/${id}`, payload);
  }

  /**
   * Delete a playlist
   * 
   * @param id - Playlist ID
   * 
   * Requirements: 3.4
   */
  async deletePlaylist(id: string): Promise<void> {
    await this.apiClient.delete<void>(`/api/v1/playlists/${id}`);
  }

  /**
   * Add a song to playlist
   * 
   * @param playlistId - Playlist ID
   * @param song - Song data
   * @returns Created song
   * 
   * Requirements: 3.5
   */
  async addSong(playlistId: string, song: AddSongRequest): Promise<SongDTO> {
    return this.apiClient.post<SongDTO>(
      `/api/v1/playlists/${playlistId}/songs`,
      song
    );
  }

  /**
   * Remove a song from playlist
   * 
   * @param playlistId - Playlist ID
   * @param songId - Song ID
   * 
   * Requirements: 3.5
   */
  async removeSong(playlistId: string, songId: string): Promise<void> {
    await this.apiClient.delete<void>(
      `/api/v1/playlists/${playlistId}/songs/${songId}`
    );
  }

  /**
   * Get all songs in a playlist
   * 
   * @param playlistId - Playlist ID
   * @returns Array of songs
   * 
   * Requirements: 3.5
   */
  async getSongs(playlistId: string): Promise<SongDTO[]> {
    return this.apiClient.get<SongDTO[]>(`/api/v1/playlists/${playlistId}/songs`);
  }
}
