/**
 * UploadApi - File upload API client
 * 
 * Features:
 * - Upload audio files with progress tracking
 * - Get storage quota information
 * - Delete uploaded files
 * - Multipart/form-data support
 * 
 * Requirements: 1.10, 4.4
 */

import { ApiClient } from './ApiClient';

/**
 * Upload types
 */
export interface UploadFileRequest {
  file: File;
  playlistId: string;
  onProgress?: (percentage: number) => void;
}

export interface UploadFileResponse {
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

export interface StorageQuotaInfo {
  used: number;
  limit: number;
  remaining: number;
  percentage: number;
}

/**
 * UploadApi - Handles file upload-related API calls
 * 
 * Requirements: 1.10, 4.4
 */
export class UploadApi {
  private apiClient: ApiClient;
  private baseUrl: string;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
    // Get base URL from ApiClient's private baseUrl
    this.baseUrl = (apiClient as any).baseUrl || 'http://localhost:4000';
  }

  /**
   * Upload an audio file to the server
   * 
   * @param request - Upload request with file, playlistId, and optional progress callback
   * @returns Upload response with song and file metadata
   * 
   * Requirements: 1.10
   */
  async uploadFile(request: UploadFileRequest): Promise<UploadFileResponse> {
    const { file, playlistId, onProgress } = request;

    // Create FormData for multipart/form-data upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('playlistId', playlistId);

    // Use XMLHttpRequest for progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentage = Math.round((event.loaded / event.total) * 100);
            onProgress(percentage);
          }
        });
      }

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Failed to parse response'));
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            reject(new Error(errorData.error || errorData.message || 'Upload failed'));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });

      // Get auth token from ApiClient
      const token = (this.apiClient as any).token;

      // Open connection and set headers
      xhr.open('POST', `${this.baseUrl}/api/v1/upload`);
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      // Send request
      xhr.send(formData);
    });
  }

  /**
   * Get current user's storage quota information
   * 
   * @returns Storage quota information
   * 
   * Requirements: 4.4
   */
  async getStorageQuota(): Promise<StorageQuotaInfo> {
    return this.apiClient.get<StorageQuotaInfo>('/api/v1/storage/quota');
  }

  /**
   * Delete an uploaded file
   * 
   * @param fileId - File ID to delete
   * 
   * Requirements: 4.4
   */
  async deleteFile(fileId: string): Promise<void> {
    await this.apiClient.delete<void>(`/api/v1/files/${fileId}`);
  }
}
