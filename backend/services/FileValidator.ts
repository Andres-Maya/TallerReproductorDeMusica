/**
 * FileValidator Service
 * 
 * Validates uploaded files and YouTube URLs for security and format compliance.
 * Implements validation for MIME types, file sizes, extensions, headers, and URL patterns.
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class FileValidator {
  // Allowed MIME types for audio files
  private readonly ALLOWED_MIME_TYPES = [
    'audio/mpeg',      // MP3
    'audio/wav',       // WAV
    'audio/ogg',       // OGG
    'audio/mp4',       // M4A
    'audio/x-m4a',     // M4A alternative
    'audio/flac'       // FLAC
  ];

  // Allowed file extensions
  private readonly ALLOWED_EXTENSIONS = [
    '.mp3',
    '.wav',
    '.ogg',
    '.m4a',
    '.flac'
  ];

  // Maximum file size: 50MB
  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024;

  // Magic numbers (file signatures) for audio formats
  private readonly MAGIC_NUMBERS: { [key: string]: Buffer[] } = {
    'audio/mpeg': [
      Buffer.from([0xFF, 0xFB]),  // MP3 frame sync
      Buffer.from([0xFF, 0xF3]),  // MP3 frame sync
      Buffer.from([0xFF, 0xF2]),  // MP3 frame sync
      Buffer.from([0x49, 0x44, 0x33])  // ID3 tag
    ],
    'audio/wav': [
      Buffer.from([0x52, 0x49, 0x46, 0x46])  // RIFF header
    ],
    'audio/ogg': [
      Buffer.from([0x4F, 0x67, 0x67, 0x53])  // OggS
    ],
    'audio/mp4': [
      Buffer.from([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70]),  // ftyp
      Buffer.from([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70])   // ftyp
    ],
    'audio/x-m4a': [
      Buffer.from([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70]),
      Buffer.from([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70])
    ],
    'audio/flac': [
      Buffer.from([0x66, 0x4C, 0x61, 0x43])  // fLaC
    ]
  };

  // YouTube URL patterns
  private readonly YOUTUBE_PATTERNS = [
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
    /^https?:\/\/(www\.)?youtu\.be\/[\w-]+/,
    /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/,
    /^https?:\/\/(www\.)?youtube\.com\/v\/[\w-]+/
  ];

  /**
   * Validates an uploaded file for format, size, MIME type, and security
   * @param file - Express.Multer.File object
   * @returns ValidationResult with isValid flag and error messages
   */
  validateFile(file: Express.Multer.File): ValidationResult {
    const errors: string[] = [];

    // Validate file extension
    if (!this.validateExtension(file.originalname)) {
      errors.push(
        `File format not supported. Allowed formats: ${this.ALLOWED_EXTENSIONS.join(', ')}`
      );
    }

    // Validate MIME type
    if (!this.validateMimeType(file)) {
      errors.push(
        `Invalid MIME type. Allowed types: ${this.ALLOWED_MIME_TYPES.join(', ')}`
      );
    }

    // Validate file size
    if (!this.validateFileSize(file.size)) {
      errors.push(
        `File size exceeds limit. Maximum allowed: ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`
      );
    }

    // Validate file header (magic numbers)
    if (file.buffer && !this.validateFileHeader(file.buffer, file.mimetype)) {
      errors.push('File headers do not match the declared MIME type');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates a YouTube URL
   * @param url - YouTube URL string
   * @returns ValidationResult with isValid flag and error messages
   */
  validateYoutubeUrl(url: string): ValidationResult {
    const errors: string[] = [];

    if (!url || typeof url !== 'string') {
      errors.push('YouTube URL is required');
      return { isValid: false, errors };
    }

    const isValid = this.YOUTUBE_PATTERNS.some(pattern => pattern.test(url));

    if (!isValid) {
      errors.push('Invalid YouTube URL. Must be a valid youtube.com or youtu.be URL');
    }

    return {
      isValid,
      errors
    };
  }

  /**
   * Validates MIME type against allowed list
   * @param file - Express.Multer.File object
   * @returns true if MIME type is allowed
   */
  private validateMimeType(file: Express.Multer.File): boolean {
    return this.ALLOWED_MIME_TYPES.includes(file.mimetype);
  }

  /**
   * Validates file extension against allowed list
   * @param filename - Original filename
   * @returns true if extension is allowed
   */
  private validateExtension(filename: string): boolean {
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return this.ALLOWED_EXTENSIONS.includes(extension);
  }

  /**
   * Validates file size against maximum limit
   * @param size - File size in bytes
   * @returns true if size is within limit
   */
  private validateFileSize(size: number): boolean {
    return size > 0 && size <= this.MAX_FILE_SIZE;
  }

  /**
   * Validates file header using magic numbers
   * @param buffer - File buffer
   * @param mimeType - Declared MIME type
   * @returns true if file header matches MIME type
   */
  private validateFileHeader(buffer: Buffer, mimeType: string): boolean {
    const magicNumbers = this.MAGIC_NUMBERS[mimeType];
    
    if (!magicNumbers) {
      return false;
    }

    // Check if any of the magic numbers match the file header
    return magicNumbers.some(magic => {
      if (buffer.length < magic.length) {
        return false;
      }
      
      // Compare the first bytes of the buffer with the magic number
      for (let i = 0; i < magic.length; i++) {
        if (buffer[i] !== magic[i]) {
          return false;
        }
      }
      
      return true;
    });
  }

  /**
   * Sanitizes filename to prevent path traversal attacks
   * @param filename - Original filename
   * @returns Sanitized filename
   */
  sanitizeFilename(filename: string): string {
    if (!filename || typeof filename !== 'string') {
      throw new Error('Invalid filename');
    }

    // Remove path traversal characters
    let sanitized = filename
      .replace(/\.\./g, '')  // Remove ..
      .replace(/\//g, '')    // Remove /
      .replace(/\\/g, '')    // Remove \
      .replace(/\0/g, '');   // Remove null bytes

    // Remove any remaining special characters that could be dangerous
    sanitized = sanitized.replace(/[<>:"|?*]/g, '');

    // Ensure filename is not empty after sanitization
    if (sanitized.length === 0) {
      throw new Error('Filename is invalid after sanitization');
    }

    return sanitized;
  }
}
