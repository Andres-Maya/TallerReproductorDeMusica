import { Request, Response } from 'express';
import { StorageManager } from '../services/StorageManager';

/**
 * FileController — handles file serving HTTP requests.
 * 
 * Validates: Requirements 3.6, 3.7, 3.9, 3.10
 */
export class FileController {
  constructor(private readonly storageManager: StorageManager) {}

  /**
   * GET /api/v1/files/:fileId
   * Retrieve a file for streaming/download.
   * Supports HTTP range requests for audio streaming.
   */
  getFile = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fileId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const fileBuffer = await this.storageManager.getFile(fileId, userId);
      
      // Get file metadata to set proper Content-Type
      // For now, we'll default to audio/mpeg
      const contentType = 'audio/mpeg';

      // Support HTTP range requests for streaming
      const range = req.headers.range;
      
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileBuffer.length - 1;
        const chunkSize = end - start + 1;
        
        res.status(206);
        res.set({
          'Content-Range': `bytes ${start}-${end}/${fileBuffer.length}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': contentType,
        });
        
        res.send(fileBuffer.slice(start, end + 1));
      } else {
        res.set({
          'Content-Type': contentType,
          'Content-Length': fileBuffer.length.toString(),
          'Accept-Ranges': 'bytes',
        });
        
        res.send(fileBuffer);
      }
    } catch (error: any) {
      console.error('Get file error:', error);
      
      if (error.message.includes('Access denied')) {
        res.status(403).json({ error: error.message });
      } else if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to retrieve file' });
      }
    }
  };

  /**
   * DELETE /api/v1/files/:fileId
   * Delete a file.
   */
  deleteFile = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fileId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      await this.storageManager.deleteFile(fileId, userId);

      res.status(204).send();
    } catch (error: any) {
      console.error('Delete file error:', error);
      
      if (error.message.includes('Access denied')) {
        res.status(403).json({ error: error.message });
      } else if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to delete file' });
      }
    }
  };
}
