/**
 * StorageAdapter — interface for storage backends
 * 
 * Provides a common interface for different storage implementations
 * (local filesystem, AWS S3, Cloudinary, etc.)
 * 
 * Validates: Requirements 9.6
 */

export interface StorageAdapter {
  /**
   * Save a file to storage
   * 
   * @param file - File buffer to save
   * @param filename - Unique filename to use
   * @param userId - User ID for organizing files
   * @returns Path or key where file was saved
   */
  save(file: Buffer, filename: string, userId: string): Promise<string>;

  /**
   * Retrieve a file from storage
   * 
   * @param filename - Filename to retrieve
   * @param userId - User ID for locating file
   * @returns File buffer
   */
  get(filename: string, userId: string): Promise<Buffer>;

  /**
   * Delete a file from storage
   * 
   * @param filename - Filename to delete
   * @param userId - User ID for locating file
   */
  delete(filename: string, userId: string): Promise<void>;

  /**
   * Check if a file exists in storage
   * 
   * @param filename - Filename to check
   * @param userId - User ID for locating file
   * @returns True if file exists
   */
  exists(filename: string, userId: string): Promise<boolean>;

  /**
   * Get URL for accessing a file
   * 
   * @param filename - Filename to get URL for
   * @param userId - User ID for locating file
   * @returns URL to access the file
   */
  getUrl(filename: string, userId: string): Promise<string>;
}
