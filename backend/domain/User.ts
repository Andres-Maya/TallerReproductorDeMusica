import bcrypt from 'bcrypt';

/**
 * User — core domain entity for authentication.
 *
 * Represents a user account with secure password handling.
 * Passwords are hashed using bcrypt before storage.
 */
export class User {
  public readonly id: string;
  public readonly username: string;
  private passwordHash: string;
  public readonly createdAt: Date;

  constructor(username: string, passwordHash: string, id?: string, createdAt?: Date) {
    this.id = id ?? User.generateId();
    this.username = username.trim();
    this.passwordHash = passwordHash;
    this.createdAt = createdAt ?? new Date();
  }

  /**
   * Validates a plain password against the stored hash.
   */
  async validatePassword(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this.passwordHash);
  }

  /**
   * Updates the user's password with a new hashed value.
   */
  async updatePassword(newPassword: string): Promise<void> {
    const errors = User.validatePasswordStrength(newPassword);
    if (errors.length > 0) {
      throw new Error(`Password validation failed: ${errors.join(', ')}`);
    }
    this.passwordHash = await bcrypt.hash(newPassword, 12);
  }

  /**
   * Validates username format.
   */
  private static validateUsername(username: string): string[] {
    const errors: string[] = [];
    const trimmed = username.trim();
    
    if (!trimmed) {
      errors.push('username is required');
    } else if (trimmed.length < 3 || trimmed.length > 30) {
      errors.push('username must be between 3 and 30 characters');
    } else if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      errors.push('username must contain only letters, numbers, and underscores');
    }
    
    return errors;
  }

  /**
   * Validates password strength requirements.
   */
  private static validatePasswordStrength(password: string): string[] {
    const errors: string[] = [];
    
    if (!password) {
      errors.push('password is required');
    } else {
      if (password.length < 8) {
        errors.push('password must be at least 8 characters');
      }
      if (!/[A-Z]/.test(password)) {
        errors.push('password must contain at least one uppercase letter');
      }
      if (!/[a-z]/.test(password)) {
        errors.push('password must contain at least one lowercase letter');
      }
      if (!/[0-9]/.test(password)) {
        errors.push('password must contain at least one number');
      }
    }
    
    return errors;
  }

  /**
   * Validates the entity's invariants.
   * Returns an array of error messages; empty means valid.
   */
  validate(): string[] {
    const errors: string[] = [];
    errors.push(...User.validateUsername(this.username));
    
    if (!this.passwordHash) {
      errors.push('passwordHash is required');
    }
    
    return errors;
  }

  isValid(): boolean {
    return this.validate().length === 0;
  }

  /**
   * Serialize to a plain object (DTO) for JSON responses.
   * Note: passwordHash is included for persistence but should be
   * filtered out in API responses.
   */
  toJSON(): UserDTO {
    return {
      id: this.id,
      username: this.username,
      passwordHash: this.passwordHash,
      createdAt: this.createdAt.toISOString(),
    };
  }

  /**
   * Reconstruct a User from a DTO (e.g. after deserialization).
   */
  static fromDTO(dto: UserDTO): User {
    const createdAt = new Date(dto.createdAt);
    return new User(dto.username, dto.passwordHash, dto.id, createdAt);
  }

  /**
   * Create a new User with a plain password.
   * Validates password strength and hashes it before creating the entity.
   */
  static async create(username: string, plainPassword: string): Promise<User> {
    // Validate username
    const usernameErrors = User.validateUsername(username);
    if (usernameErrors.length > 0) {
      throw new Error(`Username validation failed: ${usernameErrors.join(', ')}`);
    }

    // Validate password strength
    const passwordErrors = User.validatePasswordStrength(plainPassword);
    if (passwordErrors.length > 0) {
      throw new Error(`Password validation failed: ${passwordErrors.join(', ')}`);
    }

    // Hash password with 12 salt rounds
    const passwordHash = await bcrypt.hash(plainPassword, 12);
    
    return new User(username, passwordHash);
  }

  private static generateId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
}

/** Data Transfer Object — plain serializable shape */
export interface UserDTO {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
}

/** Payload accepted when registering a new user */
export interface RegisterPayload {
  username: string;
  password: string;
}
