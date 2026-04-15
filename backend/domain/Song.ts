/**
 * Song — core domain entity.
 *
 * Represents an immutable-style value object that carries all
 * data related to a single audio track.  Business rules and
 * validation logic live here (Encapsulation principle).
 */

export type SongSourceType = 'url' | 'upload' | 'youtube';

export class Song {
  public readonly id: string;
  public readonly title: string;
  public readonly artist: string;
  public readonly audioUrl: string;
  public readonly sourceType: SongSourceType;
  public readonly fileId: string | null;
  public readonly createdAt: Date;

  constructor(
    title: string,
    artist: string,
    audioUrl: string,
    sourceType: SongSourceType = 'url',
    fileId: string | null = null,
    id?: string
  ) {
    this.id        = id ?? Song.generateId();
    this.title     = title.trim();
    this.artist    = artist.trim();
    this.audioUrl  = audioUrl.trim();
    this.sourceType = sourceType;
    this.fileId    = fileId;
    this.createdAt = new Date();
  }

  /** Human-readable label: "Title — Artist" */
  get displayLabel(): string {
    return `${this.title} — ${this.artist}`;
  }

  /**
   * Validates the entity's invariants.
   * Returns an array of error messages; empty means valid.
   */
  validate(): string[] {
    const errors: string[] = [];
    if (!this.title)    errors.push('title is required');
    if (!this.artist)   errors.push('artist is required');
    if (!this.audioUrl) errors.push('audioUrl is required');

    try {
      new URL(this.audioUrl);
    } catch {
      if (this.audioUrl) errors.push('audioUrl must be a valid URL');
    }

    // Validate sourceType
    const validSourceTypes: SongSourceType[] = ['url', 'upload', 'youtube'];
    if (!validSourceTypes.includes(this.sourceType)) {
      errors.push('sourceType must be one of: url, upload, youtube');
    }

    // Validate fileId consistency
    if (this.sourceType === 'upload' && !this.fileId) {
      errors.push('fileId is required for upload source type');
    }
    if (this.sourceType === 'url' && this.fileId !== null) {
      errors.push('fileId must be null for url source type');
    }
    if (this.sourceType === 'youtube' && this.fileId !== null) {
      errors.push('fileId must be null for youtube source type');
    }

    return errors;
  }

  isValid(): boolean {
    return this.validate().length === 0;
  }

  /** Check if this song is from an uploaded file */
  isUploadedFile(): boolean {
    return this.sourceType === 'upload';
  }

  /** Serialize to a plain object (DTO) for JSON responses. */
  toJSON(): SongDTO {
    return {
      id:        this.id,
      title:     this.title,
      artist:    this.artist,
      audioUrl:  this.audioUrl,
      sourceType: this.sourceType,
      fileId:    this.fileId,
      createdAt: this.createdAt.toISOString(),
    };
  }

  /** Reconstruct a Song from a DTO (e.g. after deserialization). */
  static fromDTO(dto: SongDTO): Song {
    return new Song(
      dto.title,
      dto.artist,
      dto.audioUrl,
      dto.sourceType || 'url',
      dto.fileId || null,
      dto.id
    );
  }

  private static generateId(): string {
    return `song_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
}

/** Data Transfer Object — plain serializable shape */
export interface SongDTO {
  id:        string;
  title:     string;
  artist:    string;
  audioUrl:  string;
  sourceType: SongSourceType;
  fileId:    string | null;
  createdAt: string;
}

/** Payload accepted when creating a new song */
export interface CreateSongPayload {
  title:    string;
  artist:   string;
  audioUrl: string;
  sourceType?: 'url' | 'upload' | 'youtube';
  fileId?: string | null;
}
