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
    const requestId = Math.random().toString(36).substring(7);
    console.log(`[YouTubeController:${requestId}] Extract request received`);
    
    try {
      const { url, playlistId } = req.body;
      const userId = (req as any).user?.userId;

      if (!url) {
        console.log(`[YouTubeController:${requestId}] Missing URL in request`);
        res.status(400).json({ error: 'URL is required' });
        return;
      }

      if (!playlistId) {
        console.log(`[YouTubeController:${requestId}] Missing playlistId in request`);
        res.status(400).json({ error: 'playlistId is required' });
        return;
      }

      if (!userId) {
        console.log(`[YouTubeController:${requestId}] Missing user authentication`);
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      console.log(`[YouTubeController:${requestId}] URL:`, url, 'PlaylistId:', playlistId, 'UserId:', userId);

      // Validate YouTube URL
      const validationResult = this.fileValidator.validateYoutubeUrl(url);
      if (!validationResult.isValid) {
        console.log(`[YouTubeController:${requestId}] URL validation failed:`, validationResult.errors);
        res.status(400).json({ error: validationResult.errors.join(', ') });
        return;
      }

      // Get video info first
      console.log(`[YouTubeController:${requestId}] Getting video info...`);
      const videoInfo = await this.youtubeExtractor.getVideoInfo(url);
      console.log(`[YouTubeController:${requestId}] Video info retrieved:`, videoInfo.title);

      // For now, we'll add the song directly to the playlist using the YouTube URL
      // In the future, this could extract and store the audio file
      // But for MVP, we can just add it as a YouTube source type
      
      // Import dependencies
      const { playlistManager, playlistRepository } = require('../config/dependencies').dependencies;
      
      // Get the playlist
      const playlist = await playlistRepository.findById(playlistId);
      if (!playlist) {
        console.log(`[YouTubeController:${requestId}] Playlist not found:`, playlistId);
        res.status(404).json({ error: 'Playlist not found' });
        return;
      }

      // Check ownership
      if (playlist.userId !== userId) {
        console.log(`[YouTubeController:${requestId}] User does not own playlist`);
        res.status(403).json({ error: 'You do not have permission to modify this playlist' });
        return;
      }

      // Create song with YouTube source
      console.log(`[YouTubeController:${requestId}] Adding song to playlist...`);
      const song = await playlistManager.addSong(
        playlistId,
        {
          title: videoInfo.title,
          artist: videoInfo.author,
          audioUrl: url,
        },
        'youtube',
        null // No fileId for YouTube videos
      );

      console.log(`[YouTubeController:${requestId}] ✓ Song added successfully:`, song.id);

      // Return response matching YouTubeExtractResponse interface
      res.status(200).json({
        song: {
          id: song.id,
          title: song.title,
          artist: song.artist,
          audioUrl: song.audioUrl,
          sourceType: song.sourceType,
          fileId: song.fileId,
          createdAt: song.createdAt,
        },
        file: null, // No file for YouTube videos (they stream directly)
      });
    } catch (error: any) {
      console.error(`[YouTubeController:${requestId}] Error:`, {
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 3).join('\n')
      });
      
      if (error.message.includes('unavailable') || error.message.includes('restricted')) {
        res.status(404).json({ error: error.message });
      } else if (error.message.includes('copyright')) {
        res.status(403).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to extract audio', details: error.message });
      }
    }
  };
}
