import { Request, Response } from 'express';
import { YouTubeExtractor } from '../services/YouTubeExtractor';
import { FileValidator } from '../services/FileValidator';

/**
 * YouTubeController — handles YouTube extraction HTTP requests.
 * 
 * Validates: Requirements 2.1, 2.4, 2.6
 */
export class YouTubeController {
  constructor(
    private readonly youtubeExtractor: YouTubeExtractor,
    private readonly fileValidator: FileValidator
  ) {}

  /**
   * POST /api/v1/youtube/preview
   * Get video information from a YouTube URL.
   * 
   * Body: { url: string }
   */
  getPreview = async (req: Request, res: Response): Promise<void> => {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`[YouTubeController:${requestId}] Preview request received`);
    
    try {
      const { url } = req.body;

      if (!url) {
        console.log(`[YouTubeController:${requestId}] Missing URL in request`);
        res.status(400).json({ error: 'URL is required' });
        return;
      }

      console.log(`[YouTubeController:${requestId}] URL:`, url);

      // Validate YouTube URL
      const validationResult = this.fileValidator.validateYoutubeUrl(url);
      if (!validationResult.isValid) {
        console.log(`[YouTubeController:${requestId}] URL validation failed:`, validationResult.errors);
        res.status(400).json({ error: validationResult.errors.join(', ') });
        return;
      }

      console.log(`[YouTubeController:${requestId}] Calling YouTubeExtractor.getVideoInfo...`);
      const videoInfo = await this.youtubeExtractor.getVideoInfo(url);
      console.log(`[YouTubeController:${requestId}] ✓ Success:`, videoInfo.title);

      res.status(200).json(videoInfo);
    } catch (error: any) {
      console.error(`[YouTubeController:${requestId}] Error:`, {
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 3).join('\n')
      });
      
      if (error.message.includes('unavailable') || error.message.includes('restricted')) {
        res.status(404).json({ error: error.message });
      } else if (error.message.includes('Invalid YouTube URL')) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ 
          error: 'Failed to get video information',
          details: error.message 
        });
      }
    }
  };

  /**
   * POST /api/v1/youtube/extract
   * Extract audio from a YouTube video and add to playlist.
   * 
   * Body: { url: string, playlistId: string }
   */
  extractAudio = async (req: Request, res: Response): Promise<void> => {
    try {
      const { url, playlistId } = req.body;
      const userId = (req as any).user?.id;

      if (!url) {
        res.status(400).json({ error: 'URL is required' });
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

      // Validate YouTube URL
      const validationResult = this.fileValidator.validateYoutubeUrl(url);
      if (!validationResult.isValid) {
        res.status(400).json({ error: validationResult.errors.join(', ') });
        return;
      }

      // Get video info first
      const videoInfo = await this.youtubeExtractor.getVideoInfo(url);

      // Extract audio
      const audioBuffer = await this.youtubeExtractor.extractAudio(url);

      // TODO: Save audio buffer using UploadService
      // For now, return success with video info
      res.status(200).json({
        message: 'Audio extracted successfully',
        videoInfo,
        note: 'Full implementation requires UploadService integration',
      });
    } catch (error: any) {
      console.error('YouTube extract error:', error);
      
      if (error.message.includes('unavailable') || error.message.includes('restricted')) {
        res.status(404).json({ error: error.message });
      } else if (error.message.includes('copyright')) {
        res.status(403).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to extract audio' });
      }
    }
  };
}
