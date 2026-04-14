import { UploadedFile, UploadedFileDTO } from '../domain/UploadedFile';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * FileRepository — persistence interface for UploadedFile entities.
 * 
 * Defines the contract for storing and retrieving file metadata.
 * Implementations can use different storage backends (files, databases, etc.)
 * 
 * Validates: Requirements 3.5, 3.7
 */
export interface FileRepository {
  /**
   * Create a new file metadata record in the repository.
   * @throws Error if file creation fails
   */
  create(file: UploadedFile): Promise<UploadedFile>;

  /**
   * Find a file by its unique ID.
   * @returns UploadedFile if found, null otherwise
   */
  findById(id: string): Promise<UploadedFile | null>;

  /**
   * Find all files belonging to a specific user.
   * @returns Array of uploaded files
   */
  findByUserId(userId: string): Promise<UploadedFile[]>;

  /**
   * Delete a file metadata record by ID.
   * @throws Error if file doesn't exist
   */
  delete(id: string): Promise<void>;

  /**
   * Calculate total storage usage for a user.
   * @returns Total bytes used by all files owned by the user
   */
  getUserStorageUsage(userId: string): Promise<number>;
}

/**
 * FileFileRepository — file-based implementation of FileRepository.
 * 
 * Stores file metadata as individual JSON files in data/files/{userId}/{fileId}.json
 * Provides efficient file metadata persistence and retrieval.
 * 
 * Validates: Requirements 3.5, 3.7
 */
export class FileFileRepository implements FileRepository {
  private readonly filesDir: string;

  constructor(dataDir: string = 'data') {
    this.filesDir = path.join(dataDir, 'files');
    
    // Initialize directories on construction
    this.initializeDirectories();
  }

  /**
   * Ensure required directories exist.
   */
  private async initializeDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.filesDir, { recursive: true });
    } catch (error) {
      console.error('Failed to initialize directories:', error);
      throw new Error('Failed to initialize file repository');
    }
  }

  async create(file: UploadedFile): Promise<UploadedFile> {
    // Validate file
    const errors = file.validate();
    if (errors.length > 0) {
      throw new Error(`File validation failed: ${errors.join(', ')}`);
    }

    // Ensure user directory exists
    const userDir = this.getUserDir(file.userId);
    await fs.mkdir(userDir, { recursive: true });

    // Save file metadata
    const filePath = this.getFilePath(file.userId, file.id);
    const data: UploadedFileDTO = file.toJSON();
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');

    return file;
  }

  async findById(id: string): Promise<UploadedFile | null> {
    // We need to search across all user directories since we don't know the userId
    try {
      const userDirs = await fs.readdir(this.filesDir);
      
      for (const userId of userDirs) {
        const filePath = this.getFilePath(userId, id);
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const data: UploadedFileDTO = JSON.parse(content);
          return UploadedFile.fromDTO(data);
        } catch {
          // File doesn't exist in this user's directory, continue searching
          continue;
        }
      }
      
      // File not found in any user directory
      return null;
    } catch {
      // Files directory doesn't exist or is empty
      return null;
    }
  }

  async findByUserId(userId: string): Promise<UploadedFile[]> {
    const userDir = this.getUserDir(userId);
    
    try {
      const fileNames = await fs.readdir(userDir);
      const files: UploadedFile[] = [];
      
      for (const fileName of fileNames) {
        if (!fileName.endsWith('.json')) continue;
        
        const filePath = path.join(userDir, fileName);
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const data: UploadedFileDTO = JSON.parse(content);
          files.push(UploadedFile.fromDTO(data));
        } catch (error) {
          // Skip invalid files
          console.warn(`Failed to read file ${filePath}:`, error);
        }
      }
      
      return files;
    } catch {
      // User directory doesn't exist, return empty array
      return [];
    }
  }

  async delete(id: string): Promise<void> {
    // Find the file first to get the userId
    const file = await this.findById(id);
    if (!file) {
      throw new Error(`File with id '${id}' not found`);
    }

    // Delete the file
    const filePath = this.getFilePath(file.userId, id);
    await fs.unlink(filePath);
  }

  async getUserStorageUsage(userId: string): Promise<number> {
    const files = await this.findByUserId(userId);
    return files.reduce((total, file) => total + file.size, 0);
  }

  /**
   * Get the directory path for a user's files.
   */
  private getUserDir(userId: string): string {
    return path.join(this.filesDir, userId);
  }

  /**
   * Get the file path for a specific file.
   */
  private getFilePath(userId: string, fileId: string): string {
    return path.join(this.getUserDir(userId), `${fileId}.json`);
  }
}
