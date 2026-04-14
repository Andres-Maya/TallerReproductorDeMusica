/**
 * Unit tests for LocalStorageAdapter
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LocalStorageAdapter } from './LocalStorageAdapter';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('LocalStorageAdapter', () => {
  const testUploadDir = path.join(__dirname, '../../../../test-uploads');
  let adapter: LocalStorageAdapter;

  beforeEach(async () => {
    adapter = new LocalStorageAdapter(testUploadDir);
    // Clean up test directory
    try {
      await fs.rm(testUploadDir, { recursive: true, force: true });
    } catch {
      // Directory might not exist
    }
  });

  afterEach(async () => {
    // Clean up after tests
    try {
      await fs.rm(testUploadDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('save', () => {
    it('should save a file to the correct user directory', async () => {
      const userId = 'user_123';
      const filename = 'test-file.mp3';
      const fileContent = Buffer.from('test audio content');

      const savedPath = await adapter.save(fileContent, filename, userId);

      expect(savedPath).toContain(userId);
      expect(savedPath).toContain(filename);

      // Verify file exists
      const exists = await adapter.exists(filename, userId);
      expect(exists).toBe(true);
    });

    it('should create user directory if it does not exist', async () => {
      const userId = 'new_user_456';
      const filename = 'test-file.mp3';
      const fileContent = Buffer.from('test audio content');

      await adapter.save(fileContent, filename, userId);

      const userDir = path.join(testUploadDir, userId);
      const stats = await fs.stat(userDir);
      expect(stats.isDirectory()).toBe(true);
    });

    it('should save file content correctly', async () => {
      const userId = 'user_123';
      const filename = 'test-file.mp3';
      const fileContent = Buffer.from('test audio content');

      await adapter.save(fileContent, filename, userId);

      const retrievedContent = await adapter.get(filename, userId);
      expect(retrievedContent.toString()).toBe(fileContent.toString());
    });
  });

  describe('get', () => {
    it('should retrieve a saved file', async () => {
      const userId = 'user_123';
      const filename = 'test-file.mp3';
      const fileContent = Buffer.from('test audio content');

      await adapter.save(fileContent, filename, userId);
      const retrieved = await adapter.get(filename, userId);

      expect(retrieved.toString()).toBe(fileContent.toString());
    });

    it('should throw error if file does not exist', async () => {
      const userId = 'user_123';
      const filename = 'nonexistent.mp3';

      await expect(adapter.get(filename, userId)).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete an existing file', async () => {
      const userId = 'user_123';
      const filename = 'test-file.mp3';
      const fileContent = Buffer.from('test audio content');

      await adapter.save(fileContent, filename, userId);
      expect(await adapter.exists(filename, userId)).toBe(true);

      await adapter.delete(filename, userId);
      expect(await adapter.exists(filename, userId)).toBe(false);
    });

    it('should throw error if file does not exist', async () => {
      const userId = 'user_123';
      const filename = 'nonexistent.mp3';

      await expect(adapter.delete(filename, userId)).rejects.toThrow();
    });
  });

  describe('exists', () => {
    it('should return true for existing file', async () => {
      const userId = 'user_123';
      const filename = 'test-file.mp3';
      const fileContent = Buffer.from('test audio content');

      await adapter.save(fileContent, filename, userId);
      const exists = await adapter.exists(filename, userId);

      expect(exists).toBe(true);
    });

    it('should return false for non-existing file', async () => {
      const userId = 'user_123';
      const filename = 'nonexistent.mp3';

      const exists = await adapter.exists(filename, userId);
      expect(exists).toBe(false);
    });
  });

  describe('getUrl', () => {
    it('should return API endpoint URL', async () => {
      const userId = 'user_123';
      const filename = 'test-file.mp3';

      const url = await adapter.getUrl(filename, userId);

      expect(url).toBe('/api/v1/files/test-file.mp3');
    });
  });

  describe('generateUniqueFilename', () => {
    it('should generate unique filenames', () => {
      const originalName = 'song.mp3';
      
      const filename1 = LocalStorageAdapter.generateUniqueFilename(originalName);
      const filename2 = LocalStorageAdapter.generateUniqueFilename(originalName);

      expect(filename1).not.toBe(filename2);
    });

    it('should preserve file extension', () => {
      const originalName = 'song.mp3';
      
      const filename = LocalStorageAdapter.generateUniqueFilename(originalName);

      expect(filename).toMatch(/\.mp3$/);
    });

    it('should handle files with no extension', () => {
      const originalName = 'song';
      
      const filename = LocalStorageAdapter.generateUniqueFilename(originalName);

      expect(filename).toBeTruthy();
      expect(filename).not.toContain('.');
    });

    it('should handle files with multiple dots', () => {
      const originalName = 'my.song.file.mp3';
      
      const filename = LocalStorageAdapter.generateUniqueFilename(originalName);

      expect(filename).toMatch(/\.mp3$/);
    });
  });

  describe('file organization', () => {
    it('should organize files by userId', async () => {
      const user1 = 'user_123';
      const user2 = 'user_456';
      const filename = 'test-file.mp3';
      const content1 = Buffer.from('user 1 content');
      const content2 = Buffer.from('user 2 content');

      await adapter.save(content1, filename, user1);
      await adapter.save(content2, filename, user2);

      const retrieved1 = await adapter.get(filename, user1);
      const retrieved2 = await adapter.get(filename, user2);

      expect(retrieved1.toString()).toBe('user 1 content');
      expect(retrieved2.toString()).toBe('user 2 content');
    });
  });
});
