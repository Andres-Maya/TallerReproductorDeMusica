import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FileUserRepository } from './UserRepository';
import { User } from '../domain/User';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Integration tests for UserRepository.
 * 
 * These tests verify the complete workflow including:
 * - File system operations
 * - Index management
 * - Data persistence and retrieval
 */
describe('UserRepository Integration Tests', () => {
  const testDataDir = path.join(__dirname, '../../../test-data-integration');
  let repository: FileUserRepository;

  beforeEach(async () => {
    // Clean up test data directory
    try {
      await fs.rm(testDataDir, { recursive: true, force: true });
    } catch {
      // Directory might not exist
    }
    
    repository = new FileUserRepository(testDataDir);
    // Give time for directory initialization
    await new Promise(resolve => setTimeout(resolve, 50));
  });

  afterEach(async () => {
    // Clean up test data directory
    try {
      await fs.rm(testDataDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should complete full user lifecycle: create, read, update, delete', async () => {
    // Create user
    const user = await User.create('lifecycle_user', 'Password123');
    const created = await repository.create(user);
    expect(created.username).toBe('lifecycle_user');

    // Read by ID
    const foundById = await repository.findById(user.id);
    expect(foundById).not.toBeNull();
    expect(foundById!.username).toBe('lifecycle_user');

    // Read by username
    const foundByUsername = await repository.findByUsername('lifecycle_user');
    expect(foundByUsername).not.toBeNull();
    expect(foundByUsername!.id).toBe(user.id);

    // Update password
    await user.updatePassword('NewPassword456');
    await repository.update(user);
    const updated = await repository.findById(user.id);
    const isValidOld = await updated!.validatePassword('Password123');
    const isValidNew = await updated!.validatePassword('NewPassword456');
    expect(isValidOld).toBe(false);
    expect(isValidNew).toBe(true);

    // Delete
    await repository.delete(user.id);
    const deleted = await repository.findById(user.id);
    expect(deleted).toBeNull();
  });

  it('should maintain index consistency across operations', async () => {
    // Create multiple users
    const user1 = await User.create('user1', 'Password123');
    const user2 = await User.create('user2', 'Password456');
    const user3 = await User.create('user3', 'Password789');

    await repository.create(user1);
    await repository.create(user2);
    await repository.create(user3);

    // Verify all users are in index
    expect(await repository.exists('user1')).toBe(true);
    expect(await repository.exists('user2')).toBe(true);
    expect(await repository.exists('user3')).toBe(true);

    // Delete user2
    await repository.delete(user2.id);

    // Verify index updated correctly
    expect(await repository.exists('user1')).toBe(true);
    expect(await repository.exists('user2')).toBe(false);
    expect(await repository.exists('user3')).toBe(true);

    // Verify remaining users can still be found
    const found1 = await repository.findByUsername('user1');
    const found3 = await repository.findByUsername('user3');
    expect(found1).not.toBeNull();
    expect(found3).not.toBeNull();
  });

  it('should persist data across repository instances', async () => {
    // Create user with first repository instance
    const user = await User.create('persistent_user', 'Password123');
    await repository.create(user);

    // Create new repository instance pointing to same data directory
    const newRepository = new FileUserRepository(testDataDir);
    await new Promise(resolve => setTimeout(resolve, 50));

    // Verify user can be found with new instance
    const found = await newRepository.findById(user.id);
    expect(found).not.toBeNull();
    expect(found!.username).toBe('persistent_user');

    // Verify password validation works
    const isValid = await found!.validatePassword('Password123');
    expect(isValid).toBe(true);
  });

  it('should handle authentication workflow', async () => {
    // Register new user
    const username = 'auth_test_user';
    const password = 'SecurePass123';
    const user = await User.create(username, password);
    await repository.create(user);

    // Simulate login: find by username and validate password
    const foundUser = await repository.findByUsername(username);
    expect(foundUser).not.toBeNull();

    const isValidPassword = await foundUser!.validatePassword(password);
    expect(isValidPassword).toBe(true);

    const isInvalidPassword = await foundUser!.validatePassword('WrongPassword');
    expect(isInvalidPassword).toBe(false);
  });

  it('should verify directory structure is created correctly', async () => {
    const user = await User.create('structure_test', 'Password123');
    await repository.create(user);

    // Verify users directory exists
    const usersDir = path.join(testDataDir, 'users');
    const usersDirStats = await fs.stat(usersDir);
    expect(usersDirStats.isDirectory()).toBe(true);

    // Verify metadata directory exists
    const metadataDir = path.join(testDataDir, 'metadata');
    const metadataDirStats = await fs.stat(metadataDir);
    expect(metadataDirStats.isDirectory()).toBe(true);

    // Verify user file exists
    const userFile = path.join(usersDir, `${user.id}.json`);
    const userFileStats = await fs.stat(userFile);
    expect(userFileStats.isFile()).toBe(true);

    // Verify index file exists
    const indexFile = path.join(metadataDir, 'indexes.json');
    const indexFileStats = await fs.stat(indexFile);
    expect(indexFileStats.isFile()).toBe(true);
  });
});
