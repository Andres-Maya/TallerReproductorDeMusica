import { StorageAdapter } from '../persistence/storage/StorageAdapter';
import { FileRepository } from '../persistence/FileRepository';
import { UploadedFile, AudioMetadata } from '../domain/UploadedFile';
import * as crypto from 'crypto';
import * as path from 'path';

/**
 * StorageManager — orchestrates file storage operations.
 * 
 * Integrates StorageAdapter (for actual file storage) with FileRepository
 * (for metadata persistence) and implements access control to ensure users
 * can only access their own files.
 * 
 * Validates: Requirements 3.1, 3.6, 3.7, 4.2, 4.7
 */
export class StorageManager {
  constructor(
    private readonly adapter: StorageAdapter,
    private readonly fileRepository: FileRepository
  ) {}

  /**
   * Save a file to storage and persist its metadata.
   * 
   * @param file - File buffer to save
   * @param originalName - Original filename from user
   * @param userId - User ID who owns the file
   * @param metadata - Additional file metadata (size, mimeType, format, etc.)
   * @returns UploadedFile entity with persisted metadata
   * @throws Error if save fails or validation fails
   * 
   * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
   */
  async saveFile(
    file: Buffer,
    originalName: string,
    userId: string,
    metadata: {
      size: number;
      mimeType: string;
      format: string;
      duration?: number;
      audioMetadata?: AudioMetadata;
    }
  ): Promise<UploadedFile> {
    // Generate unique filename
    const storedName = this.generateUniqueFilename(originalName);

    // Save file to storage
    await this.adapter.save(file, storedName, userId);

    // Create UploadedFile entity
    const uploadedFile = new UploadedFile(
      userId,
      originalName,
      storedName,
      metadata.size,
      metadata.mimeType,
      metadata.format,
      metadata.duration,
      metadata.audioMetadata
    );

    // Validate entity
    const errors = uploadedFile.validate();
    if (errors.length > 0) {
      // Cleanup: delete file from storage if validation fails
      try {
        await this.adapter.delete(storedName, userId);
      } catch (cleanupError) {
        console.error('Failed to cleanup file after validation error:', cleanupError);
      }
      throw new Error(`File validation failed: ${errors.join(', ')}`);
    }

    // Persist metadata
    await this.fileRepository.create(uploadedFile);

    return uploadedFile;
  }

  /**
   * Retrieve a file from storage.
   * 
   * @param fileId - File ID to retrieve
   * @param userId - User ID requesting the file
   * @returns File buffer
   * @throws Error if file not found or access denied
   * 
   * Validates: Requirements 3.6, 3.7
   */
  async getFile(fileId: string, userId: string): Promise<Buffer> {
    // Validate access control
    await this.validateAccess(fileId, userId);

    // Get file metadata
    const fileMetadata = await this.fileRepository.findById(fileId);
    if (!fileMetadata) {
      throw new Error(`File with id '${fileId}' not found`);
    }

    // Retrieve file from storage
    return await this.adapter.get(fileMetadata.storedName, userId);
  }

  /**
   * Delete a file from storage and remove its metadata.
   * 
   * @param fileId - File ID to delete
   * @param userId - User ID requesting deletion
   * @throws Error if file not found or access denied
   * 
   * Validates: Requirements 3.7, 4.6
   */
  async deleteFile(fileId: string, userId: string): Promise<void> {
    // Validate access control
    await this.validateAccess(fileId, userId);

    // Get file metadata
    const fileMetadata = await this.fileRepository.findById(fileId);
    if (!fileMetadata) {
      throw new Error(`File with id '${fileId}' not found`);
    }

    // Delete from storage
    await this.adapter.delete(fileMetadata.storedName, userId);

    // Delete metadata
    await this.fileRepository.delete(fileId);
  }

  /**
   * Get URL for accessing a file.
   * 
   * @param fileId - File ID to get URL for
   * @param userId - User ID requesting the URL
   * @returns URL to access the file
   * @throws Error if file not found or access denied
   * 
   * Validates: Requirements 3.6, 3.7
   */
  async getFileUrl(fileId: string, userId: string): Promise<string> {
    // Validate access control
    await this.validateAccess(fileId, userId);

    // Get file metadata
    const fileMetadata = await this.fileRepository.findById(fileId);
    if (!fileMetadata) {
      throw new Error(`File with id '${fileId}' not found`);
    }

    // Get URL from storage adapter
    return await this.adapter.getUrl(fileMetadata.storedName, userId);
  }

  /**
   * Calculate total storage usage for a user.
   * 
   * @param userId - User ID to calculate usage for
   * @returns Total bytes used by all files owned by the user
   * 
   * Validates: Requirements 4.2, 4.7
   */
  async getUserStorageUsage(userId: string): Promise<number> {
    return await this.fileRepository.getUserStorageUsage(userId);
  }

  /**
   * Generate a unique filename using UUID and preserve extension.
   * 
   * @param originalName - Original filename from user
   * @returns Unique filename with preserved extension
   * 
   * Validates: Requirements 3.2
   */
  private generateUniqueFilename(originalName: string): string {
    const ext = path.extname(originalName);
    const uuid = crypto.randomUUID();
    return `${uuid}${ext}`;
  }

  /**
   * Validate that the requesting user owns the file.
   * 
   * @param fileId - File ID to validate access for
   * @param userId - User ID requesting access
   * @throws Error with 403 message if access denied
   * 
   * Validates: Requirements 3.7
   */
  private async validateAccess(fileId: string, userId: string): Promise<void> {
    const fileMetadata = await this.fileRepository.findById(fileId);
    
    if (!fileMetadata) {
      throw new Error(`File with id '${fileId}' not found`);
    }

    if (fileMetadata.userId !== userId) {
      throw new Error('Access denied: You do not own this file');
    }
  }
}
