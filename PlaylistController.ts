import { Request, Response } from 'express';
import {
  PlaylistManager,
  NotFoundError,
  ValidationError,
  BadRequestError,
} from '../services/PlaylistManager';
import { ApiResponse } from '../utils/ApiResponse';
import { getParam }    from '../utils/paramHelper';

export class PlaylistController {
  constructor(private readonly manager: PlaylistManager) {}

  /** GET /api/v1/playlists */
  getAll = (_req: Request, res: Response): void => {
    const playlists = this.manager.getAllPlaylists().map(p => p.toJSON());
    ApiResponse.ok(res, playlists, { total: playlists.length });
  };

  /** GET /api/v1/playlists/:id */
  getOne = (req: Request, res: Response): void => {
    try {
      const id       = getParam(req, 'id');
      const playlist = this.manager.getPlaylist(id);
      if (!playlist) throw new NotFoundError(`Playlist '${id}' not found`);
      const songs = this.manager.getSongs(id).map(s => s.toJSON());
      ApiResponse.ok(res, { ...playlist.toJSON(), songs, totalTracks: songs.length });
    } catch (err) { this.handleError(res, err); }
  };

  /** POST /api/v1/playlists */
  create = (req: Request, res: Response): void => {
    try {
      const { name } = req.body as { name?: string };
      if (!name?.trim()) { ApiResponse.badRequest(res, 'name is required'); return; }
      ApiResponse.created(res, this.manager.createPlaylist(name).toJSON());
    } catch (err) { this.handleError(res, err); }
  };

  /** PATCH /api/v1/playlists/:id */
  rename = (req: Request, res: Response): void => {
    try {
      const { name } = req.body as { name?: string };
      if (!name?.trim()) { ApiResponse.badRequest(res, 'name is required'); return; }
      ApiResponse.ok(res, this.manager.renamePlaylist(getParam(req, 'id'), name).toJSON());
    } catch (err) { this.handleError(res, err); }
  };

  /** DELETE /api/v1/playlists/:id */
  delete = (req: Request, res: Response): void => {
    try {
      this.manager.deletePlaylist(getParam(req, 'id'));
      ApiResponse.noContent(res);
    } catch (err) { this.handleError(res, err); }
  };

  private handleError(res: Response, err: unknown): void {
    if (err instanceof NotFoundError)   { ApiResponse.notFound(res, err.message);               return; }
    if (err instanceof ValidationError) { ApiResponse.badRequest(res, err.message, err.errors); return; }
    if (err instanceof BadRequestError) { ApiResponse.badRequest(res, err.message);              return; }
    console.error('[PlaylistController]', err);
    ApiResponse.internalError(res);
  }
}
