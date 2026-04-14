import { Request, Response } from 'express';
import {
  PlaylistManager,
  NotFoundError,
  ValidationError,
  BadRequestError,
} from '../services/PlaylistManager';
import { CreateSongPayload } from '../domain/Song';
import { ApiResponse }       from '../utils/ApiResponse';
import { getParam }          from '../utils/paramHelper';

/**
 * SongController — manages song-level operations within a playlist.
 *
 * All routes are nested under /playlists/:playlistId/songs.
 * Playback endpoints live at /playlists/:playlistId/player.
 */
export class SongController {
  constructor(private readonly manager: PlaylistManager) {}

  /** GET /api/v1/playlists/:playlistId/songs */
  getSongs = (req: Request, res: Response): void => {
    try {
      const songs = this.manager.getSongs(getParam(req, 'playlistId')).map(s => s.toJSON());
      ApiResponse.ok(res, songs, { total: songs.length });
    } catch (err) { this.handleError(res, err); }
  };

  /**
   * POST /api/v1/playlists/:playlistId/songs
   *
   * Body: { title, artist, audioUrl, position?: 'start' | 'end' | number }
   * position defaults to 'end'
   */
  addSong = (req: Request, res: Response): void => {
    try {
      const { title, artist, audioUrl, position } = req.body as {
        title?:    string;
        artist?:   string;
        audioUrl?: string;
        position?: 'start' | 'end' | number;
      };

      const payload: CreateSongPayload = {
        title:    title    ?? '',
        artist:   artist   ?? '',
        audioUrl: audioUrl ?? '',
      };

      const playlistId = getParam(req, 'playlistId');
      let song;

      if (position === 'start') {
        song = this.manager.addSongToStart(playlistId, payload);
      } else if (typeof position === 'number') {
        song = this.manager.addSongAtIndex(playlistId, payload, position);
      } else {
        song = this.manager.addSongToEnd(playlistId, payload);
      }

      ApiResponse.created(res, song.toJSON());
    } catch (err) { this.handleError(res, err); }
  };

  /** DELETE /api/v1/playlists/:playlistId/songs/:songId */
  removeSong = (req: Request, res: Response): void => {
    try {
      const song = this.manager.removeSong(
        getParam(req, 'playlistId'),
        getParam(req, 'songId'),
      );
      ApiResponse.ok(res, { removed: song.toJSON() });
    } catch (err) { this.handleError(res, err); }
  };

  // ── Playback ─────────────────────────────────────────────

  /** GET /api/v1/playlists/:playlistId/player */
  getPlaybackState = (req: Request, res: Response): void => {
    try {
      ApiResponse.ok(res, this.manager.getPlaybackState(getParam(req, 'playlistId')));
    } catch (err) { this.handleError(res, err); }
  };

  /** POST /api/v1/playlists/:playlistId/player/play/:songId */
  playSong = (req: Request, res: Response): void => {
    try {
      const playlistId = getParam(req, 'playlistId');
      const songId     = getParam(req, 'songId');
      const song       = this.manager.playSong(playlistId, songId);
      ApiResponse.ok(res, { currentSong: song.toJSON(), state: this.manager.getPlaybackState(playlistId) });
    } catch (err) { this.handleError(res, err); }
  };

  /** POST /api/v1/playlists/:playlistId/player/next */
  nextSong = (req: Request, res: Response): void => {
    try {
      const playlistId = getParam(req, 'playlistId');
      const song       = this.manager.nextSong(playlistId);
      ApiResponse.ok(res, { currentSong: song.toJSON(), state: this.manager.getPlaybackState(playlistId) });
    } catch (err) { this.handleError(res, err); }
  };

  /** POST /api/v1/playlists/:playlistId/player/previous */
  previousSong = (req: Request, res: Response): void => {
    try {
      const playlistId = getParam(req, 'playlistId');
      const song       = this.manager.previousSong(playlistId);
      ApiResponse.ok(res, { currentSong: song.toJSON(), state: this.manager.getPlaybackState(playlistId) });
    } catch (err) { this.handleError(res, err); }
  };

  /** GET /api/v1/playlists/:playlistId/player/current */
  getCurrentSong = (req: Request, res: Response): void => {
    try {
      const song = this.manager.getCurrentSong(getParam(req, 'playlistId'));
      ApiResponse.ok(res, { currentSong: song?.toJSON() ?? null });
    } catch (err) { this.handleError(res, err); }
  };

  private handleError(res: Response, err: unknown): void {
    if (err instanceof NotFoundError)   { ApiResponse.notFound(res, err.message);               return; }
    if (err instanceof ValidationError) { ApiResponse.badRequest(res, err.message, err.errors); return; }
    if (err instanceof BadRequestError) { ApiResponse.badRequest(res, err.message);              return; }
    console.error('[SongController] Unhandled error:', err);
    ApiResponse.internalError(res);
  }
}
