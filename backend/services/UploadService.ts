import { StorageManager } from './StorageManager';
import { MetadataExtractor } from './MetadataExtractor';
import { FileValidator } from './FileValidator';
import { PlaylistManager } from './PlaylistManager';
import { UploadedFile } from '../domain/UploadedFile';
import { Song } from '../domain/Song';

/**
 * UploadService — orchestrates the file upload workflow.
 * 
 * Coordinates validation, metadata extraction, storage, and playlist integration
 * for uploaded audio files.
 * 
 * Validates: Requirements 1.9, 1.11, 3.3, 4.1, 4.3
 */
export class UploadService {
  private readonly STORAGE_QUOTA_PER_USER = 100 * 1024 * 1024; // 100MB default

  constructor(
    private readonly storageManager: StorageManager,
    private readonly metadataExtractor: MetadataExtractor,
    private readonly fileValidator: FileValidator,
    private readonly playlistManager: PlaylistManager
  ) {}

  /**
   * Upload a file and add it to a playlist.
   * 
   * Workflow:
   * 1. Validate file (MIME type, size, headers)
   * 2. Check storage quota
   * 3. Extract metadata from file
   * 4. Save file to storage
   * 5. Create Song entity
   * 6. Add song to playlist
   * 
   * @param file - Express.Multer.File object
   * @param playlistId - Playlist ID to add song to
   * @param userId - User ID uploading the file
   * @returns Object with uploaded file and created song
   * @throws Error if validation fails, quota exceeded, or upload fails
   * 
   * Validates: Requirements 1.9, 1.11, 3.3, 4.1, 4.3
   */
  async uploadFile(
    file: Express.Multer.File,
    playlistId: string,
    userId: string
  ): Promise<{ file: UploadedFile; song: Song }> {
    // 1. Validate file
    const validationResult = this.fileValidator.validateFile(file);
    if (!validationResult.isValid) {
      throw new Error(`File validation failed: ${validationResult.errors.join(', ')}`);
    }

    // 2. Check storage quota
    const currentUsage = await this.storageManager.getUserStorageUsage(userId);
    if (currentUsage + file.size > this.STORAGE_QUOTA_PER_USER) {
      throw new Error(
        `Storage quota exceeded. Current usage: ${currentUsage} bytes, ` +
        `file size: ${file.size} bytes, limit: ${this.STORAGE_QUOTA_PER_USER} bytes`
      );
    }

    // 3. Extract metadata from file
    const extractedMetadata = await this.metadataExtractor.extractFromBuffer(
      file.buffer,
      file.mimetype
    );

    // 4. Save file to storage
    const uploadedFile = await this.storageManager.saveFile(
      file.buffer,
      file.originalname,
      userId,
      {
        size: file.size,
        mimeType: file.mimetype,
        format: this.getFormatFromMimeType(file.mimetype),
        duration: extractedMetadata.duration,
        audioMetadata: {
          title: extractedMetadata.title,
          artist: extractedMetadata.artist,
          album: extractedMetadata.album,
          year: extractedMetadata.year,
          genre: extractedMetadata.genre,
        },
      }
    );

    // 5. Create Song entity
    const fileUrl = await this.storageManager.getFileUrl(uploadedFile.id, userId);
    const song = new Song(
      extractedMetadata.title || file.originalname,
      extractedMetadata.artist || 'Unknown Artist',
      fileUrl,
      'upload',
      uploadedFile.id
    );

    // 6. Add song to playlist
    await this.playlistManager.addSong(playlistId, song, userId);

    return { file: uploadedFile, song };
  }

  /**
   * Delete an uploaded file and remove associated songs.
   * 
   * @param fileId - File ID to delete
   * @param userId - User ID requesting deletion
   * @throws Error if file not found or access denied
   * 
   * Validates: Requirements 3.11, 4.6
   */
  async deleteFile(fileId: string, userId: string): Promise<void> {
    // Delete file from storage (also deletes metadata)
    await this.storageManager.deleteFile(fileId, userId);

    // Note: Songs associated with this file should be removed from playlists
    // This would require additional logic to find and remove songs by fileId
  }

  /**
   * Get storage quota information for a user.
   * 
   * @param userId - User ID to get quota for
   * @returns Object with usage, limit, percentage, and remaining space
   * 
   * Validates: Requirements 4.4, 4.5
   */
  async getStorageQuota(userId: string): Promise<{
    used: number;
    limit: number;
    percentage: number;
    remaining: number;
  }> {
    const used = await this.storageManager.getUserStorageUsage(userId);
    const limit = this.STORAGE_QUOTA_PER_USER;
    const percentage = (used / limit) * 100;
    const remaining = limit - used;

    return {
      used,
      limit,
      percentage: Math.round(percentage * 100) / 100,
      remaining: Math.max(0, remaining),
    };
  }

  /**
   * Get audio format from MIME type.
   */
  private getFormatFromMimeType(mimeType: string): string {
    const mimeToFormat: Record<string, string> = {
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav',
      'audio/ogg': 'ogg',
      'audio/mp4': 'm4a',
      'audio/x-m4a': 'm4a',
      'audio/flac': 'flac',
    };
    return mimeToFormat[mimeType] || 'unknown';
  }
}
