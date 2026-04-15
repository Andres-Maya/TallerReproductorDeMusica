import { Router } from 'express';
import multer from 'multer';
import { dependencies } from '../config/dependencies';
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
 * 
 * Routes:
 * - POST /upload - Upload audio file and add to playlist
 * - GET /files/:fileId - Retrieve audio file for streaming
 * - DELETE /files/:fileId - Delete uploaded file
 * - GET /storage/quota - Get user storage quota information
 * - POST /youtube/preview - Get YouTube video information
 * - POST /youtube/extract - Extract audio from YouTube video
 * 
 * Validates: Requirements 12.8
 */
function buildUploadRouter(): Router {
  const router = Router();

  // Get controllers from dependency container
  const { uploadController, fileController, youtubeController } = dependencies;

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

// Default export for easier importing
const router = buildUploadRouter();
export default router;
