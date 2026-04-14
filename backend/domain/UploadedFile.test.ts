import { describe, it, expect } from 'vitest';
import { UploadedFile, AudioMetadata, UploadedFileDTO } from './UploadedFile';

describe('UploadedFile', () => {
  describe('constructor', () => {
    it('creates a valid UploadedFile with all required fields', () => {
      const file = new UploadedFile(
        'user_123',
        'my-song.mp3',
        'abc123-def456.mp3',
        5242880,
        'audio/mpeg',
        'mp3'
      );

      expect(file.id).toMatch(/^file_\d+_[a-z0-9]+$/);
      expect(file.userId).toBe('user_123');
      expect(file.originalName).toBe('my-song.mp3');
      expect(file.storedName).toBe('abc123-def456.mp3');
      expect(file.size).toBe(5242880);
      expect(file.mimeType).toBe('audio/mpeg');
      expect(file.format).toBe('mp3');
      expect(file.duration).toBeNull();
      expect(file.metadata).toBeNull();
      expect(file.uploadedAt).toBeInstanceOf(Date);
    });

    it('creates a valid UploadedFile with optional duration and metadata', () => {
      const metadata: AudioMetadata = {
        title: 'Test Song',
        artist: 'Test Artist',
        album: 'Test Album',
        year: 2024,
        genre: 'Rock'
      };

      const file = new UploadedFile(
        'user_123',
        'my-song.mp3',
        'abc123-def456.mp3',
        5242880,
        'audio/mpeg',
        'mp3',
        245,
        metadata
      );

      expect(file.duration).toBe(245);
      expect(file.metadata).toEqual(metadata);
    });

    it('accepts custom id when provided', () => {
      const file = new UploadedFile(
        'user_123',
        'my-song.mp3',
        'abc123-def456.mp3',
        5242880,
        'audio/mpeg',
        'mp3',
        undefined,
        undefined,
        'custom_file_id'
      );

      expect(file.id).toBe('custom_file_id');
    });
  });

  describe('validate', () => {
    it('returns empty array for valid file', () => {
      const file = new UploadedFile(
        'user_123',
        'my-song.mp3',
        'abc123-def456.mp3',
        5242880,
        'audio/mpeg',
        'mp3'
      );

      const errors = file.validate();
      expect(errors).toEqual([]);
    });

    it('validates userId is required', () => {
      const file = new UploadedFile(
        '',
        'my-song.mp3',
        'abc123-def456.mp3',
        5242880,
        'audio/mpeg',
        'mp3'
      );

      const errors = file.validate();
      expect(errors).toContain('userId is required');
    });

    it('validates originalName is required', () => {
      const file = new UploadedFile(
        'user_123',
        '',
        'abc123-def456.mp3',
        5242880,
        'audio/mpeg',
        'mp3'
      );

      const errors = file.validate();
      expect(errors).toContain('originalName is required');
    });

    it('validates storedName is required', () => {
      const file = new UploadedFile(
        'user_123',
        'my-song.mp3',
        '',
        5242880,
        'audio/mpeg',
        'mp3'
      );

      const errors = file.validate();
      expect(errors).toContain('storedName is required');
    });

    it('validates mimeType is required', () => {
      const file = new UploadedFile(
        'user_123',
        'my-song.mp3',
        'abc123-def456.mp3',
        5242880,
        '',
        'mp3'
      );

      const errors = file.validate();
      expect(errors).toContain('mimeType is required');
    });

    it('validates format is required', () => {
      const file = new UploadedFile(
        'user_123',
        'my-song.mp3',
        'abc123-def456.mp3',
        5242880,
        'audio/mpeg',
        ''
      );

      const errors = file.validate();
      expect(errors).toContain('format is required');
    });

    it('validates size must be positive', () => {
      const file = new UploadedFile(
        'user_123',
        'my-song.mp3',
        'abc123-def456.mp3',
        0,
        'audio/mpeg',
        'mp3'
      );

      const errors = file.validate();
      expect(errors).toContain('size must be a positive integer');
    });

    it('validates mimeType is in allowed list', () => {
      const file = new UploadedFile(
        'user_123',
        'my-song.mp3',
        'abc123-def456.mp3',
        5242880,
        'audio/invalid',
        'mp3'
      );

      const errors = file.validate();
      expect(errors).toContain('mimeType must be one of: audio/mpeg, audio/wav, audio/ogg, audio/mp4, audio/flac');
    });

    it('validates format matches mimeType for MP3', () => {
      const file = new UploadedFile(
        'user_123',
        'my-song.mp3',
        'abc123-def456.mp3',
        5242880,
        'audio/mpeg',
        'wav'
      );

      const errors = file.validate();
      expect(errors).toContain('format must match mimeType');
    });

    it('validates format matches mimeType for WAV', () => {
      const file = new UploadedFile(
        'user_123',
        'my-song.wav',
        'abc123-def456.wav',
        5242880,
        'audio/wav',
        'mp3'
      );

      const errors = file.validate();
      expect(errors).toContain('format must match mimeType');
    });

    it('validates format matches mimeType for OGG', () => {
      const file = new UploadedFile(
        'user_123',
        'my-song.ogg',
        'abc123-def456.ogg',
        5242880,
        'audio/ogg',
        'ogg'
      );

      const errors = file.validate();
      expect(errors).toEqual([]);
    });

    it('validates format matches mimeType for M4A', () => {
      const file = new UploadedFile(
        'user_123',
        'my-song.m4a',
        'abc123-def456.m4a',
        5242880,
        'audio/mp4',
        'm4a'
      );

      const errors = file.validate();
      expect(errors).toEqual([]);
    });

    it('validates format matches mimeType for FLAC', () => {
      const file = new UploadedFile(
        'user_123',
        'my-song.flac',
        'abc123-def456.flac',
        5242880,
        'audio/flac',
        'flac'
      );

      const errors = file.validate();
      expect(errors).toEqual([]);
    });

    it('validates duration must be non-negative', () => {
      const file = new UploadedFile(
        'user_123',
        'my-song.mp3',
        'abc123-def456.mp3',
        5242880,
        'audio/mpeg',
        'mp3',
        -10
      );

      const errors = file.validate();
      expect(errors).toContain('duration must be non-negative');
    });

    it('allows null duration', () => {
      const file = new UploadedFile(
        'user_123',
        'my-song.mp3',
        'abc123-def456.mp3',
        5242880,
        'audio/mpeg',
        'mp3'
      );

      const errors = file.validate();
      expect(errors).toEqual([]);
      expect(file.duration).toBeNull();
    });

    it('allows zero duration', () => {
      const file = new UploadedFile(
        'user_123',
        'my-song.mp3',
        'abc123-def456.mp3',
        5242880,
        'audio/mpeg',
        'mp3',
        0
      );

      const errors = file.validate();
      expect(errors).toEqual([]);
    });
  });

  describe('isValid', () => {
    it('returns true for valid file', () => {
      const file = new UploadedFile(
        'user_123',
        'my-song.mp3',
        'abc123-def456.mp3',
        5242880,
        'audio/mpeg',
        'mp3'
      );

      expect(file.isValid()).toBe(true);
    });

    it('returns false for invalid file', () => {
      const file = new UploadedFile(
        '',
        'my-song.mp3',
        'abc123-def456.mp3',
        5242880,
        'audio/mpeg',
        'mp3'
      );

      expect(file.isValid()).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('serializes to DTO format', () => {
      const metadata: AudioMetadata = {
        title: 'Test Song',
        artist: 'Test Artist',
        album: 'Test Album',
        year: 2024,
        genre: 'Rock'
      };

      const file = new UploadedFile(
        'user_123',
        'my-song.mp3',
        'abc123-def456.mp3',
        5242880,
        'audio/mpeg',
        'mp3',
        245,
        metadata,
        'file_123'
      );

      const dto = file.toJSON();

      expect(dto).toEqual({
        id: 'file_123',
        userId: 'user_123',
        originalName: 'my-song.mp3',
        storedName: 'abc123-def456.mp3',
        size: 5242880,
        mimeType: 'audio/mpeg',
        format: 'mp3',
        duration: 245,
        metadata: metadata,
        uploadedAt: file.uploadedAt.toISOString()
      });
    });

    it('serializes with null duration and metadata', () => {
      const file = new UploadedFile(
        'user_123',
        'my-song.mp3',
        'abc123-def456.mp3',
        5242880,
        'audio/mpeg',
        'mp3'
      );

      const dto = file.toJSON();

      expect(dto.duration).toBeNull();
      expect(dto.metadata).toBeNull();
    });
  });

  describe('fromDTO', () => {
    it('reconstructs UploadedFile from DTO', () => {
      const dto: UploadedFileDTO = {
        id: 'file_123',
        userId: 'user_123',
        originalName: 'my-song.mp3',
        storedName: 'abc123-def456.mp3',
        size: 5242880,
        mimeType: 'audio/mpeg',
        format: 'mp3',
        duration: 245,
        metadata: {
          title: 'Test Song',
          artist: 'Test Artist'
        },
        uploadedAt: '2024-01-02T10:30:00.000Z'
      };

      const file = UploadedFile.fromDTO(dto);

      expect(file.id).toBe('file_123');
      expect(file.userId).toBe('user_123');
      expect(file.originalName).toBe('my-song.mp3');
      expect(file.storedName).toBe('abc123-def456.mp3');
      expect(file.size).toBe(5242880);
      expect(file.mimeType).toBe('audio/mpeg');
      expect(file.format).toBe('mp3');
      expect(file.duration).toBe(245);
      expect(file.metadata).toEqual({
        title: 'Test Song',
        artist: 'Test Artist'
      });
      expect(file.uploadedAt).toEqual(new Date('2024-01-02T10:30:00.000Z'));
    });

    it('reconstructs UploadedFile with null duration and metadata', () => {
      const dto: UploadedFileDTO = {
        id: 'file_123',
        userId: 'user_123',
        originalName: 'my-song.mp3',
        storedName: 'abc123-def456.mp3',
        size: 5242880,
        mimeType: 'audio/mpeg',
        format: 'mp3',
        duration: null,
        metadata: null,
        uploadedAt: '2024-01-02T10:30:00.000Z'
      };

      const file = UploadedFile.fromDTO(dto);

      expect(file.duration).toBeNull();
      expect(file.metadata).toBeNull();
    });

    it('round-trips through toJSON and fromDTO', () => {
      const original = new UploadedFile(
        'user_123',
        'my-song.mp3',
        'abc123-def456.mp3',
        5242880,
        'audio/mpeg',
        'mp3',
        245,
        { title: 'Test Song', artist: 'Test Artist' },
        'file_123'
      );

      const dto = original.toJSON();
      const reconstructed = UploadedFile.fromDTO(dto);

      expect(reconstructed.id).toBe(original.id);
      expect(reconstructed.userId).toBe(original.userId);
      expect(reconstructed.originalName).toBe(original.originalName);
      expect(reconstructed.storedName).toBe(original.storedName);
      expect(reconstructed.size).toBe(original.size);
      expect(reconstructed.mimeType).toBe(original.mimeType);
      expect(reconstructed.format).toBe(original.format);
      expect(reconstructed.duration).toBe(original.duration);
      expect(reconstructed.metadata).toEqual(original.metadata);
      expect(reconstructed.uploadedAt.getTime()).toBe(original.uploadedAt.getTime());
    });
  });

  describe('AudioMetadata interface', () => {
    it('supports all ID3 tag fields', () => {
      const metadata: AudioMetadata = {
        title: 'Bohemian Rhapsody',
        artist: 'Queen',
        album: 'A Night at the Opera',
        year: 1975,
        genre: 'Rock'
      };

      const file = new UploadedFile(
        'user_123',
        'bohemian-rhapsody.mp3',
        'abc123.mp3',
        8388608,
        'audio/mpeg',
        'mp3',
        354,
        metadata
      );

      expect(file.metadata?.title).toBe('Bohemian Rhapsody');
      expect(file.metadata?.artist).toBe('Queen');
      expect(file.metadata?.album).toBe('A Night at the Opera');
      expect(file.metadata?.year).toBe(1975);
      expect(file.metadata?.genre).toBe('Rock');
    });

    it('supports partial metadata', () => {
      const metadata: AudioMetadata = {
        title: 'Unknown Track',
        artist: 'Unknown Artist'
      };

      const file = new UploadedFile(
        'user_123',
        'unknown.mp3',
        'abc123.mp3',
        5242880,
        'audio/mpeg',
        'mp3',
        180,
        metadata
      );

      expect(file.metadata?.title).toBe('Unknown Track');
      expect(file.metadata?.artist).toBe('Unknown Artist');
      expect(file.metadata?.album).toBeUndefined();
      expect(file.metadata?.year).toBeUndefined();
      expect(file.metadata?.genre).toBeUndefined();
    });
  });
});
