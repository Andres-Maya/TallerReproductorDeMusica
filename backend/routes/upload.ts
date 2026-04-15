import { Router } from 'express';
import multer from 'multer';
import { UploadController } from '../controllers/UploadController';
import { FileController } from '../controllers/FileController';
import { YouTubeController } from '../controllers/YouTubeController';
import { requireAuth } from '../middlewares/auth';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
});

/**
 * Upload routes
 * 
 * All routes require authentication.
 */
export function createUploadRoutes(
  uploadController: UploadController,
  fileController: FileController,
  youtubeController: YouTubeController
): Router {
  const router = Router();

  // All routes require authentication
  router.use(requireAuth);

  // File upload
  router.post('/upload', upload.single('file'), uploadController.uploadFile);

  // File serving
  router.get('/files/:fileId', fileController.getFile);
  router.delete('/files/:fileId', fileController.deleteFile);

  // Storage quota
  router.get('/storage/quota', uploadController.getStorageQuota);

  // YouTube extraction
  router.post('/youtube/preview', youtubeController.getPreview);
  router.post('/youtube/extract', youtubeController.extractAudio);

  return router;
}
