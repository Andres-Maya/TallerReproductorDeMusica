/**
 * UploadedFile — domain entity for uploaded audio files.
 *
 * Represents metadata for uploaded or extracted audio files.
 * Tracks file information, user ownership, storage details, and extracted audio metadata.
 */

/**
 * AudioMetadata interface for ID3 tag metadata
 * 
 * Validates: Requirements 10.1, 10.2, 10.3, 10.4
 */
export interface AudioMetadata {
  title?: string;
  artist?: string;
  album?: string;
  year?: number;
  genre?: string;
}

/**
 * UploadedFile entity class
 * 
 * Validates: Requirements 3.5, 10.10
 */
export class UploadedFile {
  public readonly id: string;
  public readonly userId: string;
  public readonly originalName: string;
  public readonly storedName: string;
  public readonly size: number;
  public readonly mimeType: string;
  public readonly format: string;
  public readonly duration: number | null;
  public readonly metadata: AudioMetadata | null;
  public readonly uploadedAt: Date;

  constructor(
    userId: string,
    originalName: string,
    storedName: string,
    size: number,
    mimeType: string,
    format: string,
    duration?: number,
    metadata?: AudioMetadata,
    id?: string
  ) {
    this.id = id ?? UploadedFile.generateId();
    this.userId = userId;
    this.originalName = originalName;
    this.storedName = storedName;
    this.size = size;
    this.mimeType = mimeType;
    this.format = format;
    this.duration = duration ?? null;
    this.metadata = metadata ?? null;
    this.uploadedAt = new Date();
  }

  /**
   * Validates the entity's invariants.
   * Returns an array of error messages; empty means valid.
   */
  validate(): string[] {
    const errors: string[] = [];

    if (!this.userId) errors.push('userId is required');
    if (!this.originalName) errors.push('originalName is required');
    if (!this.storedName) errors.push('storedName is required');
    if (!this.mimeType) errors.push('mimeType is required');
    if (!this.format) errors.push('format is required');

    if (this.size <= 0) {
      errors.push('size must be a positive integer');
    }

    // Validate MIME type is in allowed list
    const allowedMimeTypes = [
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/mp4',
      'audio/flac'
    ];
    if (this.mimeType && !allowedMimeTypes.includes(this.mimeType)) {
      errors.push('mimeType must be one of: audio/mpeg, audio/wav, audio/ogg, audio/mp4, audio/flac');
    }

    // Validate format matches mimeType
    const mimeToFormat: Record<string, string> = {
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav',
      'audio/ogg': 'ogg',
      'audio/mp4': 'm4a',
      'audio/flac': 'flac'
    };
    if (this.mimeType && this.format && mimeToFormat[this.mimeType] !== this.format) {
      errors.push('format must match mimeType');
    }

    // Validate duration if present
    if (this.duration !== null && this.duration < 0) {
      errors.push('duration must be non-negative');
    }

    return errors;
  }

  isValid(): boolean {
    return this.validate().length === 0;
  }

  /** Serialize to a plain object (DTO) for JSON responses. */
  toJSON(): UploadedFileDTO {
    return {
      id: this.id,
      userId: this.userId,
      originalName: this.originalName,
      storedName: this.storedName,
      size: this.size,
      mimeType: this.mimeType,
      format: this.format,
      duration: this.duration,
      metadata: this.metadata,
      uploadedAt: this.uploadedAt.toISOString(),
    };
  }

  /** Reconstruct an UploadedFile from a DTO (e.g. after deserialization). */
  static fromDTO(dto: UploadedFileDTO): UploadedFile {
    const file = new UploadedFile(
      dto.userId,
      dto.originalName,
      dto.storedName,
      dto.size,
      dto.mimeType,
      dto.format,
      dto.duration ?? undefined,
      dto.metadata ?? undefined,
      dto.id
    );
    // Override uploadedAt with the stored value
    (file as any).uploadedAt = new Date(dto.uploadedAt);
    return file;
  }

  private static generateId(): string {
    return `file_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
}

/** Data Transfer Object — plain serializable shape */
export interface UploadedFileDTO {
  id: string;
  userId: string;
  originalName: string;
  storedName: string;
  size: number;
  mimeType: string;
  format: string;
  duration: number | null;
  metadata: AudioMetadata | null;
  uploadedAt: string;
}
