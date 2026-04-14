import { Router }             from 'express';
import { PlaylistController } from '../controllers/PlaylistController';
import { SongController }     from '../controllers/SongController';
import { PlaylistManager }    from '../services/PlaylistManager';
import { buildAuthRouter }    from './backend/routes/auth';

/**
 * buildRouter — wires all routes for a given PlaylistManager instance.
 *
 * Authentication routes:
 *   POST   /auth/register
 *   POST   /auth/login
 *   POST   /auth/logout
 *   GET    /auth/me
 *
 * Playlist routes:
 *   GET    /playlists
 *   POST   /playlists
 *   GET    /playlists/:id
 *   PATCH  /playlists/:id
 *   DELETE /playlists/:id
 *
 * Song routes (nested):
 *   GET    /playlists/:playlistId/songs
 *   POST   /playlists/:playlistId/songs
 *   DELETE /playlists/:playlistId/songs/:songId
 *
 * Player routes:
 *   GET    /playlists/:playlistId/player
 *   GET    /playlists/:playlistId/player/current
 *   POST   /playlists/:playlistId/player/play/:songId
 *   POST   /playlists/:playlistId/player/next
 *   POST   /playlists/:playlistId/player/previous
 */
export function buildRouter(manager: PlaylistManager): Router {
  const router     = Router();
  const plCtrl     = new PlaylistController(manager);
  const songCtrl   = new SongController(manager);

  // ── Authentication ─────────────────────────────────────
  router.use('/auth', buildAuthRouter());

  // ── Playlist CRUD ──────────────────────────────────────
  router.get   ('/playlists',     plCtrl.getAll);
  router.post  ('/playlists',     plCtrl.create);
  router.get   ('/playlists/:id', plCtrl.getOne);
  router.patch ('/playlists/:id', plCtrl.rename);
  router.delete('/playlists/:id', plCtrl.delete);

  // ── Songs (nested under playlist) ─────────────────────
  router.get   ('/playlists/:playlistId/songs',          songCtrl.getSongs);
  router.post  ('/playlists/:playlistId/songs',          songCtrl.addSong);
  router.delete('/playlists/:playlistId/songs/:songId',  songCtrl.removeSong);

  // ── Player / Playback controls ─────────────────────────
  router.get  ('/playlists/:playlistId/player',                    songCtrl.getPlaybackState);
  router.get  ('/playlists/:playlistId/player/current',            songCtrl.getCurrentSong);
  router.post ('/playlists/:playlistId/player/play/:songId',       songCtrl.playSong);
  router.post ('/playlists/:playlistId/player/next',               songCtrl.nextSong);
  router.post ('/playlists/:playlistId/player/previous',           songCtrl.previousSong);

  return router;
}
