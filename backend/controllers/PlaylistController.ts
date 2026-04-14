import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { PlaylistManager } from '../services/PlaylistManager';
import { CreateSongPayload } from '../domain/Song';

/**
 * PlaylistController — HTTP request handlers for playlist operations.
 * 
 * All endpoints require authentication and enforce user ownership.
 * 
 * **Validates: Requirements 9.3, 9.4, 9.6, 2.9**
 */
export class PlaylistController {
  constructor(private playlistManager: PlaylistManager) {
    // Bind methods to preserve 'this' context
    this.getAllPlaylists = this.getAllPlaylists.bind(this);
    this.createPlaylist = this.createPlaylist.bind(this);
    this.getPlaylist = this.getPlaylist.bind(this);
    this.updatePlaylist = this.updatePlaylist.bind(this);
    this.deletePlaylist = this.deletePlaylist.bind(this);
    this.addSong = this.addSong.bind(this);
    this.removeSong = this.removeSong.bind(this);
    this.getSongs = this.getSongs.bind(this);
    this.updateSongPosition = this.updateSongPosition.bind(this);
  }

  /**
   * GET /api/v1/playlists
   * Get all playlists for authenticated user
   * 
   * **Validates: Requirements 9.3**
   */
  async getAllPlaylists(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const playlists = await this.playlistManager.getUserPlaylists(req.user.userId);
      
      // Add song count to each playlist
      const playlistsWithCount = await Promise.all(
        playlists.map(async (playlist) => {
          const songs = await this.playlistManager.getSongs(playlist.id, req.user!.userId);
          return {
            ...playlist.toJSON(),
            songCount: songs.length
          };
        })
      );

      res.json(playlistsWithCount);
    } catch (error) {
      console.error('Get playlists error:', error);
      res.status(500).json({ error: 'Failed to retrieve playlists' });
    }
  }

  /**
   * POST /api/v1/playlists
   * Create a new playlist
   * 
   * **Validates: Requirements 9.2, 9.3**
   */
  async createPlaylist(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { name } = req.body;

      if (!name || typeof name !== 'string') {
        res.status(400).json({ error: 'Playlist name is required' });
        return;
      }

      const playlist = await this.playlistManager.createPlaylist(req.user.userId, name);
      
      res.status(201).json({
        ...playlist.toJSON(),
        songCount: 0
      });
    } catch (error: any) {
      console.error('Create playlist error:', error);
      
      if (error.name === 'ValidationError') {
        res.status(400).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: 'Failed to create playlist' });
    }
  }

  /**
   * GET /api/v1/playlists/:playlistId
   * Get playlist details with songs
   * 
   * **Validates: Requirements 9.3, 9.4**
   */
  async getPlaylist(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { playlistId } = req.params;
      const result = await this.playlistManager.getPlaylist(playlistId, req.user.userId);

      res.json({
        ...result.playlist.toJSON(),
        songs: result.songs.map(song => song.toJSON())
      });
    } catch (error: any) {
      console.error('Get playlist error:', error);
      
      if (error.name === 'NotFoundError') {
        res.status(404).json({ error: error.message });
        return;
      }
      
      if (error.name === 'ForbiddenError') {
        res.status(403).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: 'Failed to retrieve playlist' });
    }
  }

  /**
   * PUT /api/v1/playlists/:playlistId
   * Update playlist name
   * 
   * **Validates: Requirements 9.3, 9.6**
   */
  async updatePlaylist(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { playlistId } = req.params;
      const { name } = req.body;

      if (!name || typeof name !== 'string') {
        res.status(400).json({ error: 'Playlist name is required' });
        return;
      }

      const playlist = await this.playlistManager.renamePlaylist(
        playlistId,
        req.user.userId,
        name
      );

      const songs = await this.playlistManager.getSongs(playlistId, req.user.userId);

      res.json({
        ...playlist.toJSON(),
        songCount: songs.length
      });
    } catch (error: any) {
      console.error('Update playlist error:', error);
      
      if (error.name === 'NotFoundError') {
        res.status(404).json({ error: error.message });
        return;
      }
      
      if (error.name === 'ForbiddenError') {
        res.status(403).json({ error: error.message });
        return;
      }
      
      if (error.name === 'ValidationError') {
        res.status(400).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: 'Failed to update playlist' });
    }
  }

  /**
   * DELETE /api/v1/playlists/:playlistId
   * Delete a playlist
   * 
   * **Validates: Requirements 9.3, 9.6**
   */
  async deletePlaylist(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { playlistId } = req.params;
      await this.playlistManager.deletePlaylist(playlistId, req.user.userId);

      res.status(204).send();
    } catch (error: any) {
      console.error('Delete playlist error:', error);
      
      if (error.name === 'NotFoundError') {
        res.status(404).json({ error: error.message });
        return;
      }
      
      if (error.name === 'ForbiddenError') {
        res.status(403).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: 'Failed to delete playlist' });
    }
  }

  /**
   * POST /api/v1/playlists/:playlistId/songs
   * Add a song to playlist
   * 
   * **Validates: Requirements 9.3, 9.6**
   */
  async addSong(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { playlistId } = req.params;
      const { title, artist, audioUrl, position } = req.body;

      if (!title || !artist || !audioUrl) {
        res.status(400).json({ error: 'Title, artist, and audioUrl are required' });
        return;
      }

      const payload: CreateSongPayload = { title, artist, audioUrl };
      const song = await this.playlistManager.addSong(
        playlistId,
        req.user.userId,
        payload,
        position
      );

      res.status(201).json(song.toJSON());
    } catch (error: any) {
      console.error('Add song error:', error);
      
      if (error.name === 'NotFoundError') {
        res.status(404).json({ error: error.message });
        return;
      }
      
      if (error.name === 'ForbiddenError') {
        res.status(403).json({ error: error.message });
        return;
      }
      
      if (error.name === 'ValidationError') {
        res.status(400).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: 'Failed to add song' });
    }
  }

  /**
   * DELETE /api/v1/playlists/:playlistId/songs/:songId
   * Remove a song from playlist
   * 
   * **Validates: Requirements 9.3, 9.6**
   */
  async removeSong(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { playlistId, songId } = req.params;
      await this.playlistManager.removeSong(playlistId, req.user.userId, songId);

      res.status(204).send();
    } catch (error: any) {
      console.error('Remove song error:', error);
      
      if (error.name === 'NotFoundError') {
        res.status(404).json({ error: error.message });
        return;
      }
      
      if (error.name === 'ForbiddenError') {
        res.status(403).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: 'Failed to remove song' });
    }
  }

  /**
   * GET /api/v1/playlists/:playlistId/songs
   * Get all songs in a playlist
   * 
   * **Validates: Requirements 9.3**
   */
  async getSongs(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { playlistId } = req.params;
      const songs = await this.playlistManager.getSongs(playlistId, req.user.userId);

      res.json(songs.map(song => song.toJSON()));
    } catch (error: any) {
      console.error('Get songs error:', error);
      
      if (error.name === 'NotFoundError') {
        res.status(404).json({ error: error.message });
        return;
      }
      
      if (error.name === 'ForbiddenError') {
        res.status(403).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: 'Failed to retrieve songs' });
    }
  }

  /**
   * PUT /api/v1/playlists/:playlistId/songs/:songId/position
   * Update song position in playlist
   * 
   * **Validates: Requirements 3.5, 9.3, 9.6**
   */
  async updateSongPosition(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { playlistId, songId } = req.params;
      const { newPosition } = req.body;

      if (typeof newPosition !== 'number' || newPosition < 0) {
        res.status(400).json({ error: 'Valid newPosition is required' });
        return;
      }

      await this.playlistManager.moveSong(
        playlistId,
        req.user.userId,
        songId,
        newPosition
      );

      res.status(204).send();
    } catch (error: any) {
      console.error('Update song position error:', error);
      
      if (error.name === 'NotFoundError') {
        res.status(404).json({ error: error.message });
        return;
      }
      
      if (error.name === 'ForbiddenError') {
        res.status(403).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: 'Failed to update song position' });
    }
  }
}
