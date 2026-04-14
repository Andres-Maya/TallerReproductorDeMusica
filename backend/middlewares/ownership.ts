import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { FilePlaylistRepository } from '../persistence/PlaylistRepository';

/**
 * Ownership validation middleware for playlist routes.
 * 
 * Validates that the authenticated user owns the playlist specified in the route parameter.
 * Returns 403 Forbidden if ownership check fails.
 * Returns 404 Not Found if playlist doesn't exist.
 * 
 * **Validates: Requirements 9.4, 9.6**
 */

const playlistRepository = new FilePlaylistRepository();

/**
 * Middleware to require playlist ownership
 * 
 * Expects:
 * - req.user to be set by requireAuth middleware
 * - req.params.playlistId to contain the playlist ID
 * 
 * Attaches:
 * - req.playlist: The playlist entity if ownership is verified
 * 
 * **Validates: Requirements 9.4, 9.6**
 */
export async function requireOwnership(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Ensure user is authenticated (should be set by requireAuth middleware)
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Get playlist ID from route parameters
    const playlistId = req.params.playlistId;
    
    if (!playlistId) {
      res.status(400).json({ error: 'Playlist ID is required' });
      return;
    }

    // Fetch playlist from repository
    const result = await playlistRepository.findById(playlistId);
    
    if (!result) {
      res.status(404).json({ error: 'Playlist not found' });
      return;
    }

    // Verify ownership
    if (result.playlist.userId !== req.user.userId) {
      res.status(403).json({ error: 'You do not have permission to access this playlist' });
      return;
    }

    // Attach playlist to request for use in route handlers
    (req as any).playlist = result.playlist;
    
    next();
  } catch (error) {
    console.error('Ownership validation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
