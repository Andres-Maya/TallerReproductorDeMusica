import { User } from '../domain/User';
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
export declare class FileUserRepository implements UserRepository {
    private readonly usersDir;
    private readonly metadataDir;
    private readonly indexPath;
    constructor(dataDir?: string);
    /**
     * Ensure required directories exist.
     */
    private initializeDirectories;
    create(user: User): Promise<User>;
    findById(id: string): Promise<User | null>;
    findByUsername(username: string): Promise<User | null>;
    update(user: User): Promise<User>;
    delete(id: string): Promise<void>;
    exists(username: string): Promise<boolean>;
    /**
     * Get the file path for a user by ID.
     */
    private getUserPath;
    /**
     * Load the username index from disk.
     */
    private loadIndex;
    /**
     * Save the username index to disk.
     */
    private saveIndex;
    /**
     * Add a username-to-ID mapping to the index.
     */
    private addToIndex;
    /**
     * Remove a username from the index.
     */
    private removeFromIndex;
}
//# sourceMappingURL=UserRepository.d.ts.map