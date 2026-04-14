import { User, UserDTO } from '../domain/User';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * UserRepository — persistence interface for User entities.
 * 
 * Defines the contract for storing and retrieving users.
 * Implementations can use different storage backends (files, databases, etc.)
 */
export interface UserRepository {
  /**
   * Create a new user in the repository.
   * @throws Error if username already exists
   */
  create(user: User): Promise<User>;

  /**
   * Find a user by their unique ID.
   * @returns User if found, null otherwise
   */
  findById(id: string): Promise<User | null>;

  /**
   * Find a user by their username.
   * @returns User if found, null otherwise
   */
  findByUsername(username: string): Promise<User | null>;

  /**
   * Update an existing user.
   * @throws Error if user doesn't exist
   */
  update(user: User): Promise<User>;

  /**
   * Delete a user by ID.
   * @throws Error if user doesn't exist
   */
  delete(id: string): Promise<void>;

  /**
   * Check if a username already exists.
   */
  exists(username: string): Promise<boolean>;
}

/**
 * FileUserRepository — file-based implementation of UserRepository.
 * 
 * Stores users as individual JSON files in data/users/{userId}.json
 * Maintains a username index in data/metadata/indexes.json for fast lookups
 */
export class FileUserRepository implements UserRepository {
  private readonly usersDir: string;
  private readonly metadataDir: string;
  private readonly indexPath: string;

  constructor(dataDir: string = 'data') {
    this.usersDir = path.join(dataDir, 'users');
    this.metadataDir = path.join(dataDir, 'metadata');
    this.indexPath = path.join(this.metadataDir, 'indexes.json');
    
    // Initialize directories on construction
    this.initializeDirectories();
  }

  /**
   * Ensure required directories exist.
   */
  private async initializeDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.usersDir, { recursive: true });
      await fs.mkdir(this.metadataDir, { recursive: true });
      
      // Initialize index file if it doesn't exist
      try {
        await fs.access(this.indexPath);
      } catch {
        await this.saveIndex({ usernameToId: {} });
      }
    } catch (error) {
      console.error('Failed to initialize directories:', error);
      throw new Error('Failed to initialize user repository');
    }
  }

  async create(user: User): Promise<User> {
    // Check if username already exists
    const exists = await this.exists(user.username);
    if (exists) {
      throw new Error(`Username '${user.username}' already exists`);
    }

    // Save user file
    const userPath = this.getUserPath(user.id);
    const dto = user.toJSON();
    await fs.writeFile(userPath, JSON.stringify(dto, null, 2), 'utf-8');

    // Update index
    await this.addToIndex(user.username, user.id);

    return user;
  }

  async findById(id: string): Promise<User | null> {
    try {
      const userPath = this.getUserPath(id);
      const content = await fs.readFile(userPath, 'utf-8');
      const dto: UserDTO = JSON.parse(content);
      return User.fromDTO(dto);
    } catch (error) {
      // File doesn't exist or is invalid
      return null;
    }
  }

  async findByUsername(username: string): Promise<User | null> {
    const index = await this.loadIndex();
    const userId = index.usernameToId[username.toLowerCase()];
    
    if (!userId) {
      return null;
    }

    return this.findById(userId);
  }

  async update(user: User): Promise<User> {
    // Verify user exists
    const existing = await this.findById(user.id);
    if (!existing) {
      throw new Error(`User with id '${user.id}' not found`);
    }

    // Check if username changed and if new username is available
    if (existing.username !== user.username) {
      const usernameExists = await this.exists(user.username);
      if (usernameExists) {
        throw new Error(`Username '${user.username}' already exists`);
      }
      
      // Update index: remove old username, add new one
      await this.removeFromIndex(existing.username);
      await this.addToIndex(user.username, user.id);
    }

    // Save updated user file
    const userPath = this.getUserPath(user.id);
    const dto = user.toJSON();
    await fs.writeFile(userPath, JSON.stringify(dto, null, 2), 'utf-8');

    return user;
  }

  async delete(id: string): Promise<void> {
    // Verify user exists
    const user = await this.findById(id);
    if (!user) {
      throw new Error(`User with id '${id}' not found`);
    }

    // Remove from index
    await this.removeFromIndex(user.username);

    // Delete user file
    const userPath = this.getUserPath(id);
    await fs.unlink(userPath);
  }

  async exists(username: string): Promise<boolean> {
    const index = await this.loadIndex();
    return username.toLowerCase() in index.usernameToId;
  }

  /**
   * Get the file path for a user by ID.
   */
  private getUserPath(userId: string): string {
    return path.join(this.usersDir, `${userId}.json`);
  }

  /**
   * Load the username index from disk.
   */
  private async loadIndex(): Promise<UsernameIndex> {
    try {
      const content = await fs.readFile(this.indexPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      // If index doesn't exist or is corrupted, return empty index
      return { usernameToId: {} };
    }
  }

  /**
   * Save the username index to disk.
   */
  private async saveIndex(index: UsernameIndex): Promise<void> {
    await fs.writeFile(this.indexPath, JSON.stringify(index, null, 2), 'utf-8');
  }

  /**
   * Add a username-to-ID mapping to the index.
   */
  private async addToIndex(username: string, userId: string): Promise<void> {
    const index = await this.loadIndex();
    index.usernameToId[username.toLowerCase()] = userId;
    await this.saveIndex(index);
  }

  /**
   * Remove a username from the index.
   */
  private async removeFromIndex(username: string): Promise<void> {
    const index = await this.loadIndex();
    delete index.usernameToId[username.toLowerCase()];
    await this.saveIndex(index);
  }
}

/**
 * UsernameIndex — structure for the username-to-ID index file.
 */
interface UsernameIndex {
  usernameToId: Record<string, string>;
}
