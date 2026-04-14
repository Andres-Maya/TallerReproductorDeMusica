import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FileFileRepository } from './FileRepository';
import { UploadedFile } from '../domain/UploadedFile';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Integration tests for FileRepository
 * 
 * These tests verify the repository works correctly with the actual file system.
 * They test the complete flow of creating, reading, updating, and deleting file metadata.
 */
describe('FileRepository Integration Tests', () => {
  const testDataDir = path.join(__dirname, '../../test-data-file-repo-integration');
  let repository: FileFileRepository;

  beforeEach(async () => {
    // Clean up test directory before each test
    try {
      await fs.rm(testDataDir, { recursive: true, force: true });
    } catch {
      // Directory doesn't exist, ignore
    }
    
    repository = new FileFileRepository(testDataDir);
    
    // Wait for directory initialization
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

  it('should persist and retrieve file metadata correctly', async () => {
    // Create a file with full metadata
    const file = new UploadedFile(
      'user_integration_test',
      'test-song.mp3',
      'unique-stored-name.mp3',
      10485760, // 10MB
      'audio/mpeg',
      'mp3',
      300,
      {
        title: 'Integration Test Song',
        artist: 'Test Artist',
        album: 'Test Album',
        year: 2024,
        genre: 'Test Genre'
      }
    );

    // Create the file
    await repository.create(file);

    // Retrieve it by ID
    const retrieved = await repository.findById(file.id);

    // Verify all fields match
    expect(retrieved).not.toBeNull();
    expect(retrieved!.id).toBe(file.id);
    expect(retrieved!.userId).toBe('user_integration_test');
    expect(retrieved!.originalName).toBe('test-song.mp3');
    expect(retrieved!.storedName).toBe('unique-stored-name.mp3');
    expect(retrieved!.size).toBe(10485760);
    expect(retrieved!.mimeType).toBe('audio/mpeg');
    expect(retrieved!.format).toBe('mp3');
    expect(retrieved!.duration).toBe(300);
    expect(retrieved!.metadata).toEqual({
      title: 'Integration Test Song',
      artist: 'Test Artist',
      album: 'Test Album',
      year: 2024,
      genre: 'Test Genre'
    });
  });

  it('should handle multiple users with multiple files', async () => {
    // Create files for user 1
    const user1File1 = new UploadedFile(
      'user_1',
      'song1.mp3',
      'stored1.mp3',
      5242880,
      'audio/mpeg',
      'mp3'
    );
    const user1File2 = new UploadedFile(
      'user_1',
      'song2.wav',
      'stored2.wav',
      10485760,
      'audio/wav',
      'wav'
    );

    // Create files for user 2
    const user2File1 = new UploadedFile(
      'user_2',
      'track1.ogg',
      'stored3.ogg',
      3145728,
      'audio/ogg',
      'ogg'
    );

    await repository.create(user1File1);
    await repository.create(user1File2);
    await repository.create(user2File1);

    // Verify user 1 files
    const user1Files = await repository.findByUserId('user_1');
    expect(user1Files).toHaveLength(2);
    expect(user1Files.map(f => f.originalName).sort()).toEqual(['song1.mp3', 'song2.wav']);

    // Verify user 2 files
    const user2Files = await repository.findByUserId('user_2');
    expect(user2Files).toHaveLength(1);
    expect(user2Files[0].originalName).toBe('track1.ogg');

    // Verify storage usage
    const user1Usage = await repository.getUserStorageUsage('user_1');
    const user2Usage = await repository.getUserStorageUsage('user_2');
    expect(user1Usage).toBe(15728640); // 5MB + 10MB
    expect(user2Usage).toBe(3145728); // 3MB
  });

  it('should maintain data integrity after deletion', async () => {
    // Create multiple files
    const file1 = new UploadedFile(
      'user_test',
      'file1.mp3',
      'stored1.mp3',
      5242880,
      'audio/mpeg',
      'mp3'
    );
    const file2 = new UploadedFile(
      'user_test',
      'file2.mp3',
      'stored2.mp3',
      3145728,
      'audio/mpeg',
      'mp3'
    );
    const file3 = new UploadedFile(
      'user_test',
      'file3.mp3',
      'stored3.mp3',
      2097152,
      'audio/mpeg',
      'mp3'
    );

    await repository.create(file1);
    await repository.create(file2);
    await repository.create(file3);

    // Verify all files exist
    let files = await repository.findByUserId('user_test');
    expect(files).toHaveLength(3);

    // Delete one file
    await repository.delete(file2.id);

    // Verify file is deleted
    const deletedFile = await repository.findById(file2.id);
    expect(deletedFile).toBeNull();

    // Verify other files still exist
    files = await repository.findByUserId('user_test');
    expect(files).toHaveLength(2);
    expect(files.map(f => f.id).sort()).toEqual([file1.id, file3.id].sort());

    // Verify storage usage updated
    const usage = await repository.getUserStorageUsage('user_test');
    expect(usage).toBe(7340032); // 5MB + 2MB (file2 deleted)
  });

  it('should handle files with minimal metadata', async () => {
    // Create a file with only required fields
    const file = new UploadedFile(
      'user_minimal',
      'minimal.mp3',
      'stored-minimal.mp3',
      1048576, // 1MB
      'audio/mpeg',
      'mp3'
      // No duration or metadata
    );

    await repository.create(file);

    const retrieved = await repository.findById(file.id);

    expect(retrieved).not.toBeNull();
    expect(retrieved!.duration).toBeNull();
    expect(retrieved!.metadata).toBeNull();
  });

  it('should handle different audio formats', async () => {
    const formats = [
      { mime: 'audio/mpeg', format: 'mp3', name: 'song.mp3' },
      { mime: 'audio/wav', format: 'wav', name: 'song.wav' },
      { mime: 'audio/ogg', format: 'ogg', name: 'song.ogg' },
      { mime: 'audio/mp4', format: 'm4a', name: 'song.m4a' },
      { mime: 'audio/flac', format: 'flac', name: 'song.flac' }
    ];

    for (const fmt of formats) {
      const file = new UploadedFile(
        'user_formats',
        fmt.name,
        `stored-${fmt.format}`,
        5242880,
        fmt.mime,
        fmt.format
      );

      await repository.create(file);

      const retrieved = await repository.findById(file.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.mimeType).toBe(fmt.mime);
      expect(retrieved!.format).toBe(fmt.format);
    }

    const allFiles = await repository.findByUserId('user_formats');
    expect(allFiles).toHaveLength(5);
  });
});
