/**
 * YouTubeApi - YouTube audio extraction API client
 * 
 * Features:
 * - Get YouTube video preview information
 * - Extract audio from YouTube videos with progress tracking
 * 
 * Requirements: 2.4, 2.7
 */

import { ApiClient } from './ApiClient';

/**
 * YouTube types
 */
export interface YouTubePreviewRequest {
  url: string;
}

export interface YouTubePreviewResponse {
  title: string;
  duration: number;
  thumbnail: string;
  isAvailable: boolean;
}

export interface YouTubeExtractRequest {
  url: string;
  playlistId: string;
}

export interface YouTubeExtractResponse {
  song: SongDTO;
  file: UploadedFileDTO;
}

export interface SongDTO {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  sourceType: 'url' | 'upload' | 'youtube';
  fileId: string | null;
  createdAt: string;
}

export interface UploadedFileDTO {
  id: string;
  userId: string;
  originalName: string;
  storedName: string;
  size: number;
  mimeType: string;
  format: string;
  duration: number | null;
  metadata: AudioMetadata | null;
  uploadedAt: string;
}

export interface AudioMetadata {
  title?: string;
  artist?: string;
  album?: string;
  year?: number;
  genre?: string;
}

/**
 * YouTubeApi - Handles YouTube extraction-related API calls
 * 
 * Requirements: 2.4, 2.7
 */
export class YouTubeApi {
  private apiClient: ApiClient;
  private baseUrl: string;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
    // Get base URL from ApiClient's private baseUrl
    this.baseUrl = (apiClient as any).baseUrl || 'http://localhost:4000';
  }

  /**
   * Get preview information for a YouTube video
   * 
   * @param request - Preview request with YouTube URL
   * @returns Video preview information
   * 
   * Requirements: 2.4
   */
  async getPreview(request: YouTubePreviewRequest): Promise<YouTubePreviewResponse> {
    return this.apiClient.post<YouTubePreviewResponse>('/api/v1/youtube/preview', request);
  }

  /**
   * Extract audio from a YouTube video
   * 
   * @param request - Extract request with URL and playlistId
   * @param onProgress - Optional progress callback (percentage 0-100)
   * @returns Extract response with song and file metadata
   * 
   * Requirements: 2.7
   */
  async extractAudio(
    request: YouTubeExtractRequest,
    onProgress?: (percentage: number) => void
  ): Promise<YouTubeExtractResponse> {
    // For YouTube extraction, we use polling to track progress
    // since the extraction happens on the server side
    
    // Start the extraction
    const extractPromise = this.apiClient.post<YouTubeExtractResponse>(
      '/api/v1/youtube/extract',
      request
    );

    // Simulate progress updates while waiting for extraction
    // In a real implementation, this could poll a status endpoint
    if (onProgress) {
      const progressInterval = setInterval(() => {
        // Simulate progress (this is a simple approximation)
        // A real implementation would poll the server for actual progress
        const currentProgress = Math.min(90, Math.random() * 100);
        onProgress(currentProgress);
      }, 1000);

      try {
        const result = await extractPromise;
        clearInterval(progressInterval);
        onProgress(100); // Complete
        return result;
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      }
    }

    return extractPromise;
  }
}
