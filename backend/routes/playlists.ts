import { Router } from 'express';
import { PlaylistController } from '../controllers/PlaylistController';
import { PlaylistManager } from '../services/PlaylistManager';
import { FilePlaylistRepository } from '../persistence/PlaylistRepository';
import { requireAuth } from '../middlewares/auth';
import { requireOwnership } from '../middlewares/ownership';

/**
 * buildPlaylistRouter — creates Express router for playlist endpoints.
 * 
 * All routes require authentication. Routes that modify or access specific
 * playlists also require ownership validation.
 * 
 * Routes:
 * - GET /playlists - Get all playlists for authenticated user
 * - POST /playlists - Create new playlist
 * - GET /playlists/:playlistId - Get playlist details with songs
 * - PUT /playlists/:playlistId - Update playlist name
 * - DELETE /playlists/:playlistId - Delete playlist
 * - POST /playlists/:playlistId/songs - Add song to playlist
 * - DELETE /playlists/:playlistId/songs/:songId - Remove song from playlist
 * - GET /playlists/:playlistId/songs - Get all songs in playlist
 * 
 * **Validates: Requirements 9.3, 9.4, 9.6, 2.9**
 */
export function buildPlaylistRouter(): Router {
  const router = Router();

  // Initialize dependencies
  const playlistRepository = new FilePlaylistRepository();
  const playlistManager = new PlaylistManager(playlistRepository);
  const playlistController = new PlaylistController(playlistManager);

  // All routes require authentication
  router.use(requireAuth);

  // Playlist CRUD operations
  router.get('/', playlistController.getAllPlaylists);
  router.post('/', playlistController.createPlaylist);
  
  // Routes that access specific playlists (ownership is validated in controller)
  router.get('/:playlistId', playlistController.getPlaylist);
  router.put('/:playlistId', playlistController.updatePlaylist);
  router.delete('/:playlistId', playlistController.deletePlaylist);
  
  // Song management routes
  router.post('/:playlistId/songs', playlistController.addSong);
  router.delete('/:playlistId/songs/:songId', playlistController.removeSong);
  router.get('/:playlistId/songs', playlistController.getSongs);

  return router;
}

// Default export for easier importing
const router = buildPlaylistRouter();
export default router;
