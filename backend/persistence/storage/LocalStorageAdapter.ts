/**
 * LocalStorageAdapter — file-based storage for development
 * 
 * Implements file-based storage using the local filesystem.
 * Organizes files in directory structure by userId.
 * Generates unique filenames using UUID.
 * 
 * Validates: Requirements 3.1, 3.2, 3.4, 9.1
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { StorageAdapter } from './StorageAdapter';
import { randomUUID } from 'crypto';

export class LocalStorageAdapter implements StorageAdapter {
  private readonly uploadDir: string;

  constructor(uploadDir: string) {
    this.uploadDir = uploadDir;
  }

  /**
   * Save a file to local filesystem
   * Organizes files by userId in directory structure
   * 
   * Validates: Requirements 3.1, 3.4
   */
  async save(file: Buffer, filename: string, userId: string): Promise<string> {
    const userDir = path.join(this.uploadDir, userId);
    
    // Ensure user directory exists
    await fs.mkdir(userDir, { recursive: true });
    
    const filePath = path.join(userDir, filename);
    await fs.writeFile(filePath, file);
    
    return filePath;
  }

  /**
   * Retrieve a file from local filesystem
   */
  async get(filename: string, userId: string): Promise<Buffer> {
    const filePath = path.join(this.uploadDir, userId, filename);
    return await fs.readFile(filePath);
  }

  /**
   * Delete a file from local filesystem
   */
  async delete(filename: string, userId: string): Promise<void> {
    const filePath = path.join(this.uploadDir, userId, filename);
    await fs.unlink(filePath);
  }

  /**
   * Check if a file exists in local filesystem
   */
  async exists(filename: string, userId: string): Promise<boolean> {
    const filePath = path.join(this.uploadDir, userId, filename);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get URL for accessing a file
   * Returns a relative path for local development
   */
  async getUrl(filename: string, userId: string): Promise<string> {
    // Return API endpoint URL for file serving
    return `/api/v1/files/${filename}`;
  }

  /**
   * Generate a unique filename using UUID
   * Preserves the original file extension
   * 
   * Validates: Requirements 3.2
   */
  static generateUniqueFilename(originalName: string): string {
    const ext = path.extname(originalName);
    const uuid = randomUUID();
    return `${uuid}${ext}`;
  }
}
