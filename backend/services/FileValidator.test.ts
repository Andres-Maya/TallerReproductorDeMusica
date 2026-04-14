/**
 * Unit tests for FileValidator service
 */

import { FileValidator } from './FileValidator';

describe('FileValidator', () => {
  let validator: FileValidator;

  beforeEach(() => {
    validator = new FileValidator();
  });

  describe('validateFile', () => {
    describe('MIME type validation', () => {
      it('accepts valid MP3 MIME type', () => {
        const file = createMockFile({
          originalname: 'song.mp3',
          mimetype: 'audio/mpeg',
          size: 5 * 1024 * 1024,
          buffer: Buffer.from([0xFF, 0xFB, 0x00, 0x00])
        });

        const result = validator.validateFile(file);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('accepts valid WAV MIME type', () => {
        const file = createMockFile({
          originalname: 'song.wav',
          mimetype: 'audio/wav',
          size: 5 * 1024 * 1024,
          buffer: Buffer.from([0x52, 0x49, 0x46, 0x46])
        });

        const result = validator.validateFile(file);
        expect(result.isValid).toBe(true);
      });

      it('accepts valid OGG MIME type', () => {
        const file = createMockFile({
          originalname: 'song.ogg',
          mimetype: 'audio/ogg',
          size: 5 * 1024 * 1024,
          buffer: Buffer.from([0x4F, 0x67, 0x67, 0x53])
        });

        const result = validator.validateFile(file);
        expect(result.isValid).toBe(true);
      });

      it('accepts valid M4A MIME type', () => {
        const file = createMockFile({
          originalname: 'song.m4a',
          mimetype: 'audio/mp4',
          size: 5 * 1024 * 1024,
          buffer: Buffer.from([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70])
        });

        const result = validator.validateFile(file);
        expect(result.isValid).toBe(true);
      });

      it('accepts valid FLAC MIME type', () => {
        const file = createMockFile({
          originalname: 'song.flac',
          mimetype: 'audio/flac',
          size: 5 * 1024 * 1024,
          buffer: Buffer.from([0x66, 0x4C, 0x61, 0x43])
        });

        const result = validator.validateFile(file);
        expect(result.isValid).toBe(true);
      });

      it('rejects invalid MIME type', () => {
        const file = createMockFile({
          originalname: 'song.mp3',
          mimetype: 'video/mp4',
          size: 5 * 1024 * 1024
        });

        const result = validator.validateFile(file);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('Invalid MIME type'))).toBe(true);
      });
    });

    describe('file extension validation', () => {
      it('accepts .mp3 extension', () => {
        const file = createMockFile({
          originalname: 'song.mp3',
          mimetype: 'audio/mpeg',
          size: 5 * 1024 * 1024,
          buffer: Buffer.from([0xFF, 0xFB, 0x00, 0x00])
        });

        const result = validator.validateFile(file);
        expect(result.isValid).toBe(true);
      });

      it('accepts .MP3 extension (case insensitive)', () => {
        const file = createMockFile({
          originalname: 'song.MP3',
          mimetype: 'audio/mpeg',
          size: 5 * 1024 * 1024,
          buffer: Buffer.from([0xFF, 0xFB, 0x00, 0x00])
        });

        const result = validator.validateFile(file);
        expect(result.isValid).toBe(true);
      });

      it('rejects unsupported extension', () => {
        const file = createMockFile({
          originalname: 'song.txt',
          mimetype: 'audio/mpeg',
          size: 5 * 1024 * 1024
        });

        const result = validator.validateFile(file);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('File format not supported'))).toBe(true);
      });

      it('rejects executable disguised as audio', () => {
        const file = createMockFile({
          originalname: 'song.exe',
          mimetype: 'audio/mpeg',
          size: 5 * 1024 * 1024
        });

        const result = validator.validateFile(file);
        expect(result.isValid).toBe(false);
      });
    });

    describe('file size validation', () => {
      it('accepts file within size limit', () => {
        const file = createMockFile({
          originalname: 'song.mp3',
          mimetype: 'audio/mpeg',
          size: 25 * 1024 * 1024, // 25MB
          buffer: Buffer.from([0xFF, 0xFB, 0x00, 0x00])
        });

        const result = validator.validateFile(file);
        expect(result.isValid).toBe(true);
      });

      it('accepts file at exact size limit (50MB)', () => {
        const file = createMockFile({
          originalname: 'song.mp3',
          mimetype: 'audio/mpeg',
          size: 50 * 1024 * 1024,
          buffer: Buffer.from([0xFF, 0xFB, 0x00, 0x00])
        });

        const result = validator.validateFile(file);
        expect(result.isValid).toBe(true);
      });

      it('rejects file exceeding size limit', () => {
        const file = createMockFile({
          originalname: 'song.mp3',
          mimetype: 'audio/mpeg',
          size: 51 * 1024 * 1024 // 51MB
        });

        const result = validator.validateFile(file);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('File size exceeds limit'))).toBe(true);
      });

      it('rejects file with zero size', () => {
        const file = createMockFile({
          originalname: 'song.mp3',
          mimetype: 'audio/mpeg',
          size: 0
        });

        const result = validator.validateFile(file);
        expect(result.isValid).toBe(false);
      });
    });

    describe('file header validation (magic numbers)', () => {
      it('accepts MP3 with valid ID3 header', () => {
        const file = createMockFile({
          originalname: 'song.mp3',
          mimetype: 'audio/mpeg',
          size: 5 * 1024 * 1024,
          buffer: Buffer.from([0x49, 0x44, 0x33, 0x03, 0x00])
        });

        const result = validator.validateFile(file);
        expect(result.isValid).toBe(true);
      });

      it('accepts MP3 with valid frame sync header', () => {
        const file = createMockFile({
          originalname: 'song.mp3',
          mimetype: 'audio/mpeg',
          size: 5 * 1024 * 1024,
          buffer: Buffer.from([0xFF, 0xFB, 0x90, 0x00])
        });

        const result = validator.validateFile(file);
        expect(result.isValid).toBe(true);
      });

      it('accepts WAV with valid RIFF header', () => {
        const file = createMockFile({
          originalname: 'song.wav',
          mimetype: 'audio/wav',
          size: 5 * 1024 * 1024,
          buffer: Buffer.from([0x52, 0x49, 0x46, 0x46, 0x00, 0x00])
        });

        const result = validator.validateFile(file);
        expect(result.isValid).toBe(true);
      });

      it('rejects file with mismatched header', () => {
        const file = createMockFile({
          originalname: 'song.mp3',
          mimetype: 'audio/mpeg',
          size: 5 * 1024 * 1024,
          buffer: Buffer.from([0x52, 0x49, 0x46, 0x46]) // WAV header
        });

        const result = validator.validateFile(file);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          'File headers do not match the declared MIME type'
        );
      });
    });

    describe('combined validation', () => {
      it('reports multiple errors', () => {
        const file = createMockFile({
          originalname: 'song.txt',
          mimetype: 'video/mp4',
          size: 100 * 1024 * 1024
        });

        const result = validator.validateFile(file);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(1);
      });
    });
  });

  describe('validateYoutubeUrl', () => {
    it('accepts standard youtube.com watch URL', () => {
      const result = validator.validateYoutubeUrl(
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      );
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('accepts youtube.com without www', () => {
      const result = validator.validateYoutubeUrl(
        'https://youtube.com/watch?v=dQw4w9WgXcQ'
      );
      expect(result.isValid).toBe(true);
    });

    it('accepts youtu.be short URL', () => {
      const result = validator.validateYoutubeUrl(
        'https://youtu.be/dQw4w9WgXcQ'
      );
      expect(result.isValid).toBe(true);
    });

    it('accepts youtube.com embed URL', () => {
      const result = validator.validateYoutubeUrl(
        'https://www.youtube.com/embed/dQw4w9WgXcQ'
      );
      expect(result.isValid).toBe(true);
    });

    it('accepts http protocol', () => {
      const result = validator.validateYoutubeUrl(
        'http://www.youtube.com/watch?v=dQw4w9WgXcQ'
      );
      expect(result.isValid).toBe(true);
    });

    it('rejects non-YouTube URL', () => {
      const result = validator.validateYoutubeUrl(
        'https://www.example.com/video'
      );
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid YouTube URL'))).toBe(true);
    });

    it('rejects empty string', () => {
      const result = validator.validateYoutubeUrl('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('YouTube URL is required');
    });

    it('rejects null/undefined', () => {
      const result = validator.validateYoutubeUrl(null as any);
      expect(result.isValid).toBe(false);
    });

    it('rejects malformed URL', () => {
      const result = validator.validateYoutubeUrl('not a url');
      expect(result.isValid).toBe(false);
    });
  });

  describe('sanitizeFilename', () => {
    it('removes path traversal (..) characters', () => {
      const result = validator.sanitizeFilename('../../../etc/passwd');
      expect(result).not.toContain('..');
    });

    it('removes forward slashes', () => {
      const result = validator.sanitizeFilename('path/to/file.mp3');
      expect(result).not.toContain('/');
      expect(result).toBe('pathtofile.mp3');
    });

    it('removes backslashes', () => {
      const result = validator.sanitizeFilename('path\\to\\file.mp3');
      expect(result).not.toContain('\\');
      expect(result).toBe('pathtofile.mp3');
    });

    it('removes null bytes', () => {
      const result = validator.sanitizeFilename('file\0name.mp3');
      expect(result).not.toContain('\0');
      expect(result).toBe('filename.mp3');
    });

    it('removes special characters', () => {
      const result = validator.sanitizeFilename('file<>:"|?*.mp3');
      expect(result).toBe('file.mp3');
    });

    it('preserves valid filename', () => {
      const result = validator.sanitizeFilename('my-song_2024.mp3');
      expect(result).toBe('my-song_2024.mp3');
    });

    it('throws error for empty filename after sanitization', () => {
      expect(() => {
        validator.sanitizeFilename('///');
      }).toThrow('Filename is invalid after sanitization');
    });

    it('throws error for invalid input', () => {
      expect(() => {
        validator.sanitizeFilename(null as any);
      }).toThrow('Invalid filename');
    });

    it('handles complex path traversal attempts', () => {
      const result = validator.sanitizeFilename('..\\..\\..\\windows\\system32\\file.mp3');
      expect(result).not.toContain('..');
      expect(result).not.toContain('\\');
      expect(result).toBe('windowssystem32file.mp3');
    });
  });
});

/**
 * Helper function to create mock Express.Multer.File objects
 */
function createMockFile(options: {
  originalname: string;
  mimetype: string;
  size: number;
  buffer?: Buffer;
}): Express.Multer.File {
  return {
    fieldname: 'file',
    originalname: options.originalname,
    encoding: '7bit',
    mimetype: options.mimetype,
    size: options.size,
    buffer: options.buffer || Buffer.alloc(options.size),
    destination: '',
    filename: '',
    path: '',
    stream: null as any
  };
}
