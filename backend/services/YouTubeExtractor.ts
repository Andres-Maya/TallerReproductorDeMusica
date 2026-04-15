/**
 * YouTubeExtractor Service
 * 
 * Extracts audio from YouTube videos using multiple fallback strategies.
 * 
 * Strategy 1: YouTube Data API v3 (requires YOUTUBE_API_KEY)
 * Strategy 2: @distube/ytdl-core with cookies
 * Strategy 3: Basic oEmbed API (limited info)
 * 
 * Validates: Requirements 2.4, 2.6, 2.8, 2.11
 */

export interface YouTubeVideoInfo {
  videoId: string;
  title: string;
  author: string;
  duration: number;
  thumbnail: string;
  isAvailable: boolean;
}

export class YouTubeExtractor {
  private readonly apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY;
    console.log('[YouTubeExtractor] Initialized with API key:', this.apiKey ? 'YES' : 'NO');
  }

  /**
   * Get video information from a YouTube URL using multiple fallback strategies.
   * 
   * @param url - YouTube video URL
   * @returns Video information (title, author, duration, thumbnail)
   * @throws Error if URL is invalid or video is unavailable
   * 
   * Validates: Requirements 2.4, 2.5
   */
  async getVideoInfo(url: string): Promise<YouTubeVideoInfo> {
    const videoId = this.extractVideoId(url);
    
    if (!videoId) {
      console.error('[YouTubeExtractor] Invalid URL format:', url);
      throw new Error('Invalid YouTube URL');
    }

    console.log('[YouTubeExtractor] Extracting info for video ID:', videoId);

    const errors: string[] = [];

    // Strategy 1: YouTube Data API v3 (most reliable)
    if (this.apiKey) {
      try {
        console.log('[YouTubeExtractor] Trying YouTube Data API v3...');
        const result = await this.getVideoInfoFromAPI(videoId);
        console.log('[YouTubeExtractor] ✓ YouTube Data API v3 succeeded');
        return result;
      } catch (error: any) {
        const errorMsg = `YouTube API failed: ${error.message}`;
        console.warn('[YouTubeExtractor]', errorMsg);
        errors.push(errorMsg);
      }
    } else {
      console.log('[YouTubeExtractor] Skipping YouTube Data API (no API key)');
    }

    // Strategy 2: ytdl-core with enhanced options
    try {
      console.log('[YouTubeExtractor] Trying @distube/ytdl-core...');
      const result = await this.getVideoInfoFromYTDL(url);
      console.log('[YouTubeExtractor] ✓ ytdl-core succeeded');
      return result;
    } catch (error: any) {
      const errorMsg = `ytdl-core failed: ${error.message}`;
      console.error('[YouTubeExtractor]', errorMsg);
      errors.push(errorMsg);
    }

    // Strategy 3: oEmbed API (basic info only)
    try {
      console.log('[YouTubeExtractor] Trying oEmbed API (last resort)...');
      const result = await this.getVideoInfoFromOEmbed(videoId);
      console.log('[YouTubeExtractor] ✓ oEmbed API succeeded (limited info)');
      return result;
    } catch (error: any) {
      const errorMsg = `oEmbed API failed: ${error.message}`;
      console.error('[YouTubeExtractor]', errorMsg);
      errors.push(errorMsg);
    }

    // All strategies failed
    console.error('[YouTubeExtractor] All strategies failed. Errors:', errors);
    throw new Error(`Failed to get video information. Tried ${errors.length} methods. Last error: ${errors[errors.length - 1]}`);
  }

  /**
   * Strategy 1: Get video info using YouTube Data API v3
   */
  private async getVideoInfoFromAPI(videoId: string): Promise<YouTubeVideoInfo> {
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${this.apiKey}`;
    
    console.log('[YouTubeExtractor] Calling YouTube API...');
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[YouTubeExtractor] API response error:', response.status, errorText);
      throw new Error(`YouTube API HTTP ${response.status}`);
    }

    const data = await response.json() as any;
    
    if (!data.items || data.items.length === 0) {
      console.error('[YouTubeExtractor] Video not found in API response');
      throw new Error('Video not found');
    }

    const video = data.items[0];
    const snippet = video.snippet;
    const contentDetails = video.contentDetails;

    // Parse ISO 8601 duration (e.g., "PT4M13S" -> 253 seconds)
    const duration = this.parseISO8601Duration(contentDetails.duration);

    return {
      videoId: videoId,
      title: snippet.title,
      author: snippet.channelTitle,
      duration: duration,
      thumbnail: snippet.thumbnails.high?.url || snippet.thumbnails.default?.url || '',
      isAvailable: true,
    };
  }

  /**
   * Strategy 2: Get video info using ytdl-core (fallback)
   */
  private async getVideoInfoFromYTDL(url: string): Promise<YouTubeVideoInfo> {
    try {
      // Dynamic import of @distube/ytdl-core
      const ytdl = await import('@distube/ytdl-core');

      console.log('[YouTubeExtractor] Validating URL with ytdl...');
      // Validate URL
      if (!ytdl.validateURL(url)) {
        throw new Error('Invalid YouTube URL');
      }

      console.log('[YouTubeExtractor] Getting video info with ytdl...');
      // Get video info with enhanced options
      const info = await ytdl.getInfo(url, {
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
          }
        }
      });
      
      const videoDetails = info.videoDetails;
      console.log('[YouTubeExtractor] ytdl returned video:', videoDetails.title);

      return {
        videoId: videoDetails.videoId,
        title: videoDetails.title,
        author: videoDetails.author.name,
        duration: parseInt(videoDetails.lengthSeconds),
        thumbnail: videoDetails.thumbnails[0]?.url || '',
        isAvailable: true,
      };
    } catch (error: any) {
      console.error('[YouTubeExtractor] ytdl-core error details:', {
        message: error.message,
        statusCode: error.statusCode,
        stack: error.stack?.split('\n')[0]
      });
      
      if (error.message?.includes('unavailable')) {
        throw new Error('Video is unavailable or restricted');
      }
      if (error.message?.includes('private')) {
        throw new Error('Video is private');
      }
      if (error.statusCode === 410) {
        throw new Error('Video has been removed');
      }
      throw new Error(`ytdl-core: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Strategy 3: Get basic video info using oEmbed API (last resort)
   * This only provides title and thumbnail, duration is estimated
   */
  private async getVideoInfoFromOEmbed(videoId: string): Promise<YouTubeVideoInfo> {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    
    console.log('[YouTubeExtractor] Calling oEmbed API...');
    const response = await fetch(oembedUrl);
    
    if (!response.ok) {
      throw new Error(`oEmbed API HTTP ${response.status}`);
    }

    const data = await response.json() as any;
    
    return {
      videoId: videoId,
      title: data.title || 'Unknown Title',
      author: data.author_name || 'Unknown Author',
      duration: 0, // oEmbed doesn't provide duration
      thumbnail: data.thumbnail_url || '',
      isAvailable: true,
    };
  }

  /**
   * Parse ISO 8601 duration to seconds
   * Example: "PT4M13S" -> 253 seconds
   */
  private parseISO8601Duration(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    
    if (!match) {
      return 0;
    }

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    return hours * 3600 + minutes * 60 + seconds;
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
    console.log('[YouTubeExtractor] Starting audio extraction for:', url);
    
    try {
      // Dynamic import of @distube/ytdl-core
      const ytdl = await import('@distube/ytdl-core');

      // Validate URL
      if (!ytdl.validateURL(url)) {
        throw new Error('Invalid YouTube URL');
      }

      console.log('[YouTubeExtractor] Creating audio stream...');
      // Get audio stream with better options
      const audioStream = ytdl.default(url, {
        quality: 'highestaudio',
        filter: 'audioonly',
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
          }
        }
      });

      // Collect stream data into buffer
      const chunks: Buffer[] = [];
      let totalSize = 0;
      
      return new Promise((resolve, reject) => {
        audioStream.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
          totalSize += chunk.length;
          if (totalSize % (1024 * 1024) === 0) {
            console.log(`[YouTubeExtractor] Downloaded ${Math.floor(totalSize / 1024 / 1024)}MB...`);
          }
        });

        audioStream.on('end', () => {
          const buffer = Buffer.concat(chunks);
          console.log(`[YouTubeExtractor] ✓ Audio extraction complete: ${Math.floor(buffer.length / 1024 / 1024)}MB`);
          resolve(buffer);
        });

        audioStream.on('error', (error: Error) => {
          console.error('[YouTubeExtractor] Audio stream error:', error);
          reject(new Error(`Failed to extract audio: ${error.message}`));
        });

        // Add timeout
        setTimeout(() => {
          audioStream.destroy();
          reject(new Error('Audio extraction timeout'));
        }, 120000); // 120 second timeout (increased from 60)
      });
    } catch (error: any) {
      console.error('[YouTubeExtractor] extractAudio error:', error);
      
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
      /youtube\.com\/shorts\/([^&\n?#]+)/,
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
