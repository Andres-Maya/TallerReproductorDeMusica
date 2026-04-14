/**
 * Playlist — aggregate root that groups songs under a named list.
 *
 * Owns its own state and exposes only controlled mutations
 * (Encapsulation + Single Responsibility).
 */
export class Playlist {
  public readonly id: string;
  public name: string;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(name: string, id?: string) {
    this.id        = id ?? Playlist.generateId();
    this.name      = name.trim();
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  rename(newName: string): void {
    this.name      = newName.trim();
    this.updatedAt = new Date();
  }

  validate(): string[] {
    const errors: string[] = [];
    if (!this.name) errors.push('name is required');
    return errors;
  }

  isValid(): boolean {
    return this.validate().length === 0;
  }

  toJSON() {
    return {
      id:        this.id,
      name:      this.name,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  private static generateId(): string {
    return `pl_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
}

export interface CreatePlaylistPayload {
  name: string;
}
