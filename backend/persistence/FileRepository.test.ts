import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FileFileRepository } from './FileRepository';
import { UploadedFile } from '../domain/UploadedFile';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('FileFileRepository', () => {
  const testDataDir = path.join(__dirname, '../../test-data-file-repo');
  let repository: FileFileRepository;

  beforeEach(async () => {
    // Clean up test directory before each test
    try {
      await fs.rm(testDataDir, { recursive: true, force: true });
    } catch {
      // Directory doesn't exist, ignore
    }
    
    repository = new FileFileRepository(testDataDir);
    
    // Wait a bit for directory initialization
    await new Promise(resolve => setTimeout(resolve, 50));
  });

  afterEach(async () => {
    // Clean up test directory after each test
    try {
      await fs.rm(testDataDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('create', () => {
    it('should create a new file metadata record', async () => {
      const file = new UploadedFile(
        'user_123',
        'song.mp3',
        'abc-def-ghi.mp3',
        5242880,
        'audio/mpeg',
        'mp3',
        245,
        { title: 'Test Song', artist: 'Test Artist' }
      );

      const result = await repository.create(file);

      expect(result).toEqual(file);
      expect(result.id).toBe(file.id);
      expect(result.userId).toBe('user_123');
    });

    it('should persist file metadata to disk', async () => {
      const file = new UploadedFile(
        'user_123',
        'song.mp3',
        'abc-def-ghi.mp3',
        5242880,
        'audio/mpeg',
        'mp3'
      );

      await repository.create(file);

      // Verify file exists on disk
      const filePath = path.join(testDataDir, 'files', 'user_123', `${file.id}.json`);
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      expect(data.id).toBe(file.id);
      expect(data.userId).toBe('user_123');
      expect(data.originalName).toBe('song.mp3');
    });

    it('should reject invalid file metadata', async () => {
      const file = new UploadedFile(
        '', // Invalid: empty userId
        'song.mp3',
        'abc-def-ghi.mp3',
        5242880,
        'audio/mpeg',
        'mp3'
      );

      await expect(repository.create(file)).rejects.toThrow('File validation failed');
    });

    it('should create user directory if it does not exist', async () => {
      const file = new UploadedFile(
        'new_user_456',
        'song.mp3',
        'abc-def-ghi.mp3',
        5242880,
        'audio/mpeg',
        'mp3'
      );

      await repository.create(file);

      const userDir = path.join(testDataDir, 'files', 'new_user_456');
      const stats = await fs.stat(userDir);
      expect(stats.isDirectory()).toBe(true);
    });
  });

  describe('findById', () => {
    it('should find a file by ID', async () => {
      const file = new UploadedFile(
        'user_123',
        'song.mp3',
        'abc-def-ghi.mp3',
        5242880,
        'audio/mpeg',
        'mp3',
        245
      );

      await repository.create(file);
      const found = await repository.findById(file.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(file.id);
      expect(found!.userId).toBe('user_123');
      expect(found!.originalName).toBe('song.mp3');
      expect(found!.duration).toBe(245);
    });

    it('should return null if file does not exist', async () => {
      const found = await repository.findById('nonexistent_id');
      expect(found).toBeNull();
    });

    it('should search across multiple user directories', async () => {
      const file1 = new UploadedFile(
        'user_123',
        'song1.mp3',
        'abc-def-ghi.mp3',
        5242880,
        'audio/mpeg',
        'mp3'
      );
      const file2 = new UploadedFile(
        'user_456',
        'song2.mp3',
        'xyz-uvw-rst.mp3',
        3145728,
        'audio/mpeg',
        'mp3'
      );

      await repository.create(file1);
      await repository.create(file2);

      const found1 = await repository.findById(file1.id);
      const found2 = await repository.findById(file2.id);

      expect(found1).not.toBeNull();
      expect(found1!.userId).toBe('user_123');
      expect(found2).not.toBeNull();
      expect(found2!.userId).toBe('user_456');
    });
  });

  describe('findByUserId', () => {
    it('should find all files for a user', async () => {
      const file1 = new UploadedFile(
        'user_123',
        'song1.mp3',
        'abc-def-ghi.mp3',
        5242880,
        'audio/mpeg',
        'mp3'
      );
      const file2 = new UploadedFile(
        'user_123',
        'song2.mp3',
        'xyz-uvw-rst.mp3',
        3145728,
        'audio/mpeg',
        'mp3'
      );
      const file3 = new UploadedFile(
        'user_456',
        'song3.mp3',
        'lmn-opq-stu.mp3',
        2097152,
        'audio/mpeg',
        'mp3'
      );

      await repository.create(file1);
      await repository.create(file2);
      await repository.create(file3);

      const user123Files = await repository.findByUserId('user_123');
      const user456Files = await repository.findByUserId('user_456');

      expect(user123Files).toHaveLength(2);
      expect(user456Files).toHaveLength(1);
      expect(user123Files.map(f => f.id)).toContain(file1.id);
      expect(user123Files.map(f => f.id)).toContain(file2.id);
      expect(user456Files[0].id).toBe(file3.id);
    });

    it('should return empty array if user has no files', async () => {
      const files = await repository.findByUserId('nonexistent_user');
      expect(files).toEqual([]);
    });

    it('should skip invalid JSON files', async () => {
      const file = new UploadedFile(
        'user_123',
        'song.mp3',
        'abc-def-ghi.mp3',
        5242880,
        'audio/mpeg',
        'mp3'
      );

      await repository.create(file);

      // Create an invalid JSON file
      const userDir = path.join(testDataDir, 'files', 'user_123');
      await fs.writeFile(path.join(userDir, 'invalid.json'), 'invalid json', 'utf-8');

      const files = await repository.findByUserId('user_123');

      expect(files).toHaveLength(1);
      expect(files[0].id).toBe(file.id);
    });
  });

  describe('delete', () => {
    it('should delete a file by ID', async () => {
      const file = new UploadedFile(
        'user_123',
        'song.mp3',
        'abc-def-ghi.mp3',
        5242880,
        'audio/mpeg',
        'mp3'
      );

      await repository.create(file);
      await repository.delete(file.id);

      const found = await repository.findById(file.id);
      expect(found).toBeNull();
    });

    it('should throw error if file does not exist', async () => {
      await expect(repository.delete('nonexistent_id')).rejects.toThrow(
        "File with id 'nonexistent_id' not found"
      );
    });

    it('should remove file from disk', async () => {
      const file = new UploadedFile(
        'user_123',
        'song.mp3',
        'abc-def-ghi.mp3',
        5242880,
        'audio/mpeg',
        'mp3'
      );

      await repository.create(file);
      const filePath = path.join(testDataDir, 'files', 'user_123', `${file.id}.json`);

      // Verify file exists
      await fs.access(filePath);

      await repository.delete(file.id);

      // Verify file is deleted
      await expect(fs.access(filePath)).rejects.toThrow();
    });
  });

  describe('getUserStorageUsage', () => {
    it('should calculate total storage usage for a user', async () => {
      const file1 = new UploadedFile(
        'user_123',
        'song1.mp3',
        'abc-def-ghi.mp3',
        5242880, // 5MB
        'audio/mpeg',
        'mp3'
      );
      const file2 = new UploadedFile(
        'user_123',
        'song2.mp3',
        'xyz-uvw-rst.mp3',
        3145728, // 3MB
        'audio/mpeg',
        'mp3'
      );
      const file3 = new UploadedFile(
        'user_456',
        'song3.mp3',
        'lmn-opq-stu.mp3',
        2097152, // 2MB
        'audio/mpeg',
        'mp3'
      );

      await repository.create(file1);
      await repository.create(file2);
      await repository.create(file3);

      const user123Usage = await repository.getUserStorageUsage('user_123');
      const user456Usage = await repository.getUserStorageUsage('user_456');

      expect(user123Usage).toBe(8388608); // 5MB + 3MB
      expect(user456Usage).toBe(2097152); // 2MB
    });

    it('should return 0 for user with no files', async () => {
      const usage = await repository.getUserStorageUsage('nonexistent_user');
      expect(usage).toBe(0);
    });

    it('should update usage after file deletion', async () => {
      const file1 = new UploadedFile(
        'user_123',
        'song1.mp3',
        'abc-def-ghi.mp3',
        5242880,
        'audio/mpeg',
        'mp3'
      );
      const file2 = new UploadedFile(
        'user_123',
        'song2.mp3',
        'xyz-uvw-rst.mp3',
        3145728,
        'audio/mpeg',
        'mp3'
      );

      await repository.create(file1);
      await repository.create(file2);

      let usage = await repository.getUserStorageUsage('user_123');
      expect(usage).toBe(8388608);

      await repository.delete(file1.id);

      usage = await repository.getUserStorageUsage('user_123');
      expect(usage).toBe(3145728);
    });
  });
});
