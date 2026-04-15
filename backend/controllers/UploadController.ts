import { Request, Response } from 'express';
import { UploadService } from '../services/UploadService';

/**
 * UploadController — handles file upload HTTP requests.
 * 
 * Validates: Requirements 1.9, 1.11, 5.7
 */
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * POST /api/v1/upload
   * Upload a file and add it to a playlist.
   * 
   * Expects multipart/form-data with:
   * - file: audio file
   * - playlistId: playlist to add song to
   */
  uploadFile = async (req: Request, res: Response): Promise<void> => {
    try {
      const file = req.file;
      const { playlistId } = req.body;
      const userId = (req as any).user?.id;

      if (!file) {
        res.status(400).json({ error: 'No file provided' });
        return;
      }

      if (!playlistId) {
        res.status(400).json({ error: 'playlistId is required' });
        return;
      }

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const result = await this.uploadService.uploadFile(file, playlistId, userId);

      res.status(201).json({
        message: 'File uploaded successfully',
        file: result.file.toJSON(),
        song: result.song.toJSON(),
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      
      if (error.message.includes('quota exceeded')) {
        res.status(413).json({ error: error.message });
      } else if (error.message.includes('validation failed')) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to upload file' });
      }
    }
  };

  /**
   * GET /api/v1/storage/quota
   * Get storage quota information for the authenticated user.
   */
  getStorageQuota = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const quota = await this.uploadService.getStorageQuota(userId);

      res.status(200).json(quota);
    } catch (error: any) {
      console.error('Get quota error:', error);
      res.status(500).json({ error: 'Failed to get storage quota' });
    }
  };
}
