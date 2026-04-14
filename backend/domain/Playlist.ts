/**
 * Playlist — aggregate root that groups songs under a named list.
 *
 * Enhanced with multi-user support: each playlist is owned by a specific user.
 * Owns its own state and exposes only controlled mutations
 * (Encapsulation + Single Responsibility).
 */
export class Playlist {
  public readonly id: string;
  public readonly userId: string;
  public name: string;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(name: string, userId: string, id?: string, createdAt?: Date, updatedAt?: Date) {
    this.id = id ?? Playlist.generateId();
    this.userId = userId;
    this.name = name.trim();
    this.createdAt = createdAt ?? new Date();
    this.updatedAt = updatedAt ?? new Date();
  }

  rename(newName: string): void {
    this.name = newName.trim();
    this.updatedAt = new Date();
  }

  /**
   * Validates the entity's invariants.
   * Returns an array of error messages; empty means valid.
   */
  validate(): string[] {
    const errors: string[] = [];
    
    if (!this.name) {
      errors.push('name is required');
    } else if (this.name.length > 100) {
      errors.push('name must not exceed 100 characters');
    }
    
    if (!this.userId) {
      errors.push('userId is required');
    }
    
    return errors;
  }

  isValid(): boolean {
    return this.validate().length === 0;
  }

  /**
   * Serialize to a plain object (DTO) for JSON responses.
   */
  toJSON(): PlaylistDTO {
    return {
      id: this.id,
      userId: this.userId,
      name: this.name,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  /**
   * Reconstruct a Playlist from a DTO (e.g. after deserialization).
   */
  static fromDTO(dto: PlaylistDTO): Playlist {
    const createdAt = new Date(dto.createdAt);
    const updatedAt = new Date(dto.updatedAt);
    return new Playlist(dto.name, dto.userId, dto.id, createdAt, updatedAt);
  }

  /**
   * Create a new Playlist with validation.
   */
  static create(name: string, userId: string): Playlist {
    const playlist = new Playlist(name, userId);
    const errors = playlist.validate();
    if (errors.length > 0) {
      throw new Error(`Playlist validation failed: ${errors.join(', ')}`);
    }
    return playlist;
  }

  private static generateId(): string {
    return `pl_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
}

/** Data Transfer Object — plain serializable shape */
export interface PlaylistDTO {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/** Payload accepted when creating a new playlist */
export interface CreatePlaylistPayload {
  name: string;
}
