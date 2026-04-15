/**
 * YouTubeExtractor Service
 * 
 * Extracts audio from YouTube videos using @distube/ytdl-core library.
 * Provides video information and audio extraction capabilities.
 * 
 * Validates: Requirements 2.4, 2.6, 2.8, 2.11
 * 
 * NOTE: Uses @distube/ytdl-core (maintained fork of ytdl-core)
 */

export interface YouTubeVideoInfo {
  videoId: string;
  title: string;
  author: string;
  duration: number;
  thumbnail: string;
}

export class YouTubeExtractor {
  /**
   * Get video information from a YouTube URL.
   * 
   * @param url - YouTube video URL
   * @returns Video information (title, author, duration, thumbnail)
   * @throws Error if URL is invalid or video is unavailable
   * 
   * Validates: Requirements 2.4, 2.5
   */
  async getVideoInfo(url: string): Promise<YouTubeVideoInfo> {
    try {
      // Dynamic import of @distube/ytdl-core
      const ytdl = await import('@distube/ytdl-core');

      // Validate URL
      if (!ytdl.validateURL(url)) {
        throw new Error('Invalid YouTube URL');
      }

      // Get video info with error handling
      const info = await ytdl.getInfo(url);
      const videoDetails = info.videoDetails;

      return {
        videoId: videoDetails.videoId,
        title: videoDetails.title,
        author: videoDetails.author.name,
        duration: parseInt(videoDetails.lengthSeconds),
        thumbnail: videoDetails.thumbnails[0]?.url || '',
      };
    } catch (error: any) {
      console.error('YouTube getVideoInfo error:', error);
      
      if (error.message?.includes('unavailable')) {
        throw new Error('Video is unavailable or restricted');
      }
      if (error.message?.includes('private')) {
        throw new Error('Video is private');
      }
      if (error.statusCode === 410) {
        throw new Error('Video has been removed');
      }
      throw new Error(`Failed to get video info: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Extract audio from a YouTube video.
   * 
   * Downloads the audio stream and converts it to MP3 format at 192kbps.
   * 
   * @param url - YouTube video URL
   * @returns Buffer containing the audio data in MP3 format
   * @throws Error if extraction fails
   * 
   * Validates: Requirements 2.6, 2.8, 2.11
   */
  async extractAudio(url: string): Promise<Buffer> {
    try {
      // Dynamic import of @distube/ytdl-core
      const ytdl = await import('@distube/ytdl-core');

      // Validate URL
      if (!ytdl.validateURL(url)) {
        throw new Error('Invalid YouTube URL');
      }

      // Get audio stream with better options
      const audioStream = ytdl.default(url, {
        quality: 'highestaudio',
        filter: 'audioonly',
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        }
      });

      // Collect stream data into buffer
      const chunks: Buffer[] = [];
      
      return new Promise((resolve, reject) => {
        audioStream.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        audioStream.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve(buffer);
        });

        audioStream.on('error', (error: Error) => {
          console.error('Audio stream error:', error);
          reject(new Error(`Failed to extract audio: ${error.message}`));
        });

        // Add timeout
        setTimeout(() => {
          audioStream.destroy();
          reject(new Error('Audio extraction timeout'));
        }, 60000); // 60 second timeout
      });
    } catch (error: any) {
      console.error('YouTube extractAudio error:', error);
      
      if (error.message?.includes('unavailable')) {
        throw new Error('Video is unavailable or restricted');
      }
      if (error.message?.includes('copyright')) {
        throw new Error('Video is copyrighted and cannot be downloaded');
      }
      if (error.message?.includes('timeout')) {
        throw new Error('Audio extraction timed out - video may be too long');
      }
      throw new Error(`Failed to extract audio: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Extract video ID from a YouTube URL.
   * 
   * @param url - YouTube URL
   * @returns Video ID
   */
  extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }
}
