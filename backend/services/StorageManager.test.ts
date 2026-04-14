import { describe, it, expect, beforeEach } from 'vitest';
import { StorageManager } from './StorageManager';
import { StorageAdapter } from '../persistence/storage/StorageAdapter';
import { FileRepository } from '../persistence/FileRepository';
import { UploadedFile, AudioMetadata } from '../domain/UploadedFile';

/**
 * Mock StorageAdapter for testing
 */
class MockStorageAdapter implements StorageAdapter {
  private storage: Map<string, Buffer> = new Map();
  public saveCalls: Array<{ file: Buffer; filename: string; userId: string }> = [];
  public deleteCalls: Array<{ filename: string; userId: string }> = [];

  async save(file: Buffer, filename: string, userId: string): Promise<string> {
    this.saveCalls.push({ file, filename, userId });
    const key = `${userId}/${filename}`;
    this.storage.set(key, file);
    return key;
  }

  async get(filename: string, userId: string): Promise<Buffer> {
    const key = `${userId}/${filename}`;
    const file = this.storage.get(key);
    if (!file) {
      throw new Error('File not found in storage');
    }
    return file;
  }

  async delete(filename: string, userId: string): Promise<void> {
    this.deleteCalls.push({ filename, userId });
    const key = `${userId}/${filename}`;
    this.storage.delete(key);
  }

  async exists(filename: string, userId: string): Promise<boolean> {
    const key = `${userId}/${filename}`;
    return this.storage.has(key);
  }

  async getUrl(filename: string, userId: string): Promise<string> {
    return `/api/v1/files/${filename}`;
  }

  reset() {
    this.storage.clear();
    this.saveCalls = [];
    this.deleteCalls = [];
  }
}

/**
 * Mock FileRepository for testing
 */
class MockFileRepository implements FileRepository {
  private files: Map<string, UploadedFile> = new Map();

  async create(file: UploadedFile): Promise<UploadedFile> {
    this.files.set(file.id, file);
    return file;
  }

  async findById(id: string): Promise<UploadedFile | null> {
    return this.files.get(id) ?? null;
  }

  async findByUserId(userId: string): Promise<UploadedFile[]> {
    return Array.from(this.files.values()).filter(f => f.userId === userId);
  }

  async delete(id: string): Promise<void> {
    const file = this.files.get(id);
    if (!file) {
      throw new Error(`File with id '${id}' not found`);
    }
    this.files.delete(id);
  }

  async getUserStorageUsage(userId: string): Promise<number> {
    const userFiles = await this.findByUserId(userId);
    return userFiles.reduce((total, file) => total + file.size, 0);
  }

  reset() {
    this.files.clear();
  }
}

describe('StorageManager', () => {
  let storageManager: StorageManager;
  let mockAdapter: MockStorageAdapter;
  let mockRepository: MockFileRepository;

  beforeEach(() => {
    mockAdapter = new MockStorageAdapter();
    mockRepository = new MockFileRepository();
    storageManager = new StorageManager(mockAdapter, mockRepository);
  });

  describe('saveFile', () => {
    it('should save file and persist metadata', async () => {
      const fileBuffer = Buffer.from('test audio data');
      const originalName = 'test-song.mp3';
      const userId = 'user_123';
      const metadata = {
        size: 1024,
        mimeType: 'audio/mpeg',
        format: 'mp3',
        duration: 180,
        audioMetadata: {
          title: 'Test Song',
          artist: 'Test Artist',
        },
      };

      const result = await storageManager.saveFile(
        fileBuffer,
        originalName,
        userId,
        metadata
      );

      expect(result).toBeInstanceOf(UploadedFile);
      expect(result.userId).toBe(userId);
      expect(result.originalName).toBe(originalName);
      expect(result.size).toBe(metadata.size);
      expect(result.mimeType).toBe(metadata.mimeType);
      expect(result.format).toBe(metadata.format);
      expect(result.duration).toBe(metadata.duration);
      expect(result.metadata).toEqual(metadata.audioMetadata);

      expect(mockAdapter.saveCalls.length).toBe(1);
      expect(mockAdapter.saveCalls[0].file).toBe(fileBuffer);
      expect(mockAdapter.saveCalls[0].userId).toBe(userId);
      expect(mockAdapter.saveCalls[0].filename).toMatch(/\.mp3$/);

      const savedFile = await mockRepository.findById(result.id);
      expect(savedFile).toBeDefined();
      expect(savedFile?.id).toBe(result.id);
    });

    it('should generate unique filenames', async () => {
      const fileBuffer = Buffer.from('test');
      const userId = 'user_123';
      const metadata = {
        size: 1024,
        mimeType: 'audio/mpeg',
        format: 'mp3',
      };

      const result1 = await storageManager.saveFile(
        fileBuffer,
        'song.mp3',
        userId,
        metadata
      );
      const result2 = await storageManager.saveFile(
        fileBuffer,
        'song.mp3',
        userId,
        metadata
      );

      expect(result1.storedName).not.toBe(result2.storedName);
      expect(result1.storedName).toMatch(/\.mp3$/);
      expect(result2.storedName).toMatch(/\.mp3$/);
    });

    it('should cleanup file if validation fails', async () => {
      const fileBuffer = Buffer.from('test');
      const userId = 'user_123';
      const invalidMetadata = {
        size: -1, // Invalid size
        mimeType: 'audio/mpeg',
        format: 'mp3',
      };

      await expect(
        storageManager.saveFile(fileBuffer, 'song.mp3', userId, invalidMetadata)
      ).rejects.toThrow('File validation failed');

      expect(mockAdapter.deleteCalls.length).toBe(1);
    });

    it('should reject invalid MIME type', async () => {
      const fileBuffer = Buffer.from('test');
      const userId = 'user_123';
      const invalidMetadata = {
        size: 1024,
        mimeType: 'video/mp4', // Invalid MIME type
        format: 'mp4',
      };

      await expect(
        storageManager.saveFile(fileBuffer, 'video.mp4', userId, invalidMetadata)
      ).rejects.toThrow('File validation failed');
    });
  });

  describe('getFile', () => {
    it('should retrieve file for owner', async () => {
      const fileId = 'file_123';
      const userId = 'user_123';
      const fileBuffer = Buffer.from('audio data');

      const mockFile = new UploadedFile(
        userId,
        'song.mp3',
        'stored-name.mp3',
        1024,
        'audio/mpeg',
        'mp3'
      );
      (mockFile as any).id = fileId;

      await mockRepository.create(mockFile);
      await mockAdapter.save(fileBuffer, 'stored-name.mp3', userId);

      const result = await storageManager.getFile(fileId, userId);

      expect(result).toEqual(fileBuffer);
    });

    it('should deny access if user does not own file', async () => {
      const fileId = 'file_123';
      const ownerId = 'user_123';
      const requesterId = 'user_456';

      const mockFile = new UploadedFile(
        ownerId,
        'song.mp3',
        'stored-name.mp3',
        1024,
        'audio/mpeg',
        'mp3'
      );
      (mockFile as any).id = fileId;

      await mockRepository.create(mockFile);

      await expect(
        storageManager.getFile(fileId, requesterId)
      ).rejects.toThrow('Access denied: You do not own this file');
    });

    it('should throw error if file not found', async () => {
      const fileId = 'nonexistent';
      const userId = 'user_123';

      await expect(
        storageManager.getFile(fileId, userId)
      ).rejects.toThrow(`File with id '${fileId}' not found`);
    });
  });

  describe('deleteFile', () => {
    it('should delete file and metadata for owner', async () => {
      const fileId = 'file_123';
      const userId = 'user_123';

      const mockFile = new UploadedFile(
        userId,
        'song.mp3',
        'stored-name.mp3',
        1024,
        'audio/mpeg',
        'mp3'
      );
      (mockFile as any).id = fileId;

      await mockRepository.create(mockFile);
      await mockAdapter.save(Buffer.from('test'), 'stored-name.mp3', userId);

      await storageManager.deleteFile(fileId, userId);

      expect(mockAdapter.deleteCalls.length).toBe(1);
      expect(mockAdapter.deleteCalls[0].filename).toBe('stored-name.mp3');
      expect(mockAdapter.deleteCalls[0].userId).toBe(userId);

      const deletedFile = await mockRepository.findById(fileId);
      expect(deletedFile).toBeNull();
    });

    it('should deny deletion if user does not own file', async () => {
      const fileId = 'file_123';
      const ownerId = 'user_123';
      const requesterId = 'user_456';

      const mockFile = new UploadedFile(
        ownerId,
        'song.mp3',
        'stored-name.mp3',
        1024,
        'audio/mpeg',
        'mp3'
      );
      (mockFile as any).id = fileId;

      await mockRepository.create(mockFile);

      await expect(
        storageManager.deleteFile(fileId, requesterId)
      ).rejects.toThrow('Access denied: You do not own this file');

      expect(mockAdapter.deleteCalls.length).toBe(0);
    });

    it('should throw error if file not found', async () => {
      const fileId = 'nonexistent';
      const userId = 'user_123';

      await expect(
        storageManager.deleteFile(fileId, userId)
      ).rejects.toThrow(`File with id '${fileId}' not found`);
    });
  });

  describe('getFileUrl', () => {
    it('should return URL for owner', async () => {
      const fileId = 'file_123';
      const userId = 'user_123';

      const mockFile = new UploadedFile(
        userId,
        'song.mp3',
        'stored-name.mp3',
        1024,
        'audio/mpeg',
        'mp3'
      );
      (mockFile as any).id = fileId;

      await mockRepository.create(mockFile);

      const result = await storageManager.getFileUrl(fileId, userId);

      expect(result).toBe('/api/v1/files/stored-name.mp3');
    });

    it('should deny URL access if user does not own file', async () => {
      const fileId = 'file_123';
      const ownerId = 'user_123';
      const requesterId = 'user_456';

      const mockFile = new UploadedFile(
        ownerId,
        'song.mp3',
        'stored-name.mp3',
        1024,
        'audio/mpeg',
        'mp3'
      );
      (mockFile as any).id = fileId;

      await mockRepository.create(mockFile);

      await expect(
        storageManager.getFileUrl(fileId, requesterId)
      ).rejects.toThrow('Access denied: You do not own this file');
    });
  });

  describe('getUserStorageUsage', () => {
    it('should return total storage usage for user', async () => {
      const userId = 'user_123';

      // Create multiple files for the user
      const file1 = new UploadedFile(userId, 'song1.mp3', 'stored1.mp3', 5242880, 'audio/mpeg', 'mp3');
      const file2 = new UploadedFile(userId, 'song2.mp3', 'stored2.mp3', 3145728, 'audio/mpeg', 'mp3');
      const file3 = new UploadedFile(userId, 'song3.mp3', 'stored3.mp3', 2097152, 'audio/mpeg', 'mp3');

      await mockRepository.create(file1);
      await mockRepository.create(file2);
      await mockRepository.create(file3);

      const result = await storageManager.getUserStorageUsage(userId);

      const expectedUsage = 5242880 + 3145728 + 2097152;
      expect(result).toBe(expectedUsage);
    });

    it('should return 0 for user with no files', async () => {
      const userId = 'user_new';

      const result = await storageManager.getUserStorageUsage(userId);

      expect(result).toBe(0);
    });
  });
});
