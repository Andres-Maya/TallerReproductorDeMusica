import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FileUserRepository } from './UserRepository';
import { User } from '../domain/User';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('FileUserRepository', () => {
  const testDataDir = path.join(__dirname, '../../../test-data');
  let repository: FileUserRepository;

  beforeEach(async () => {
    // Clean up test data directory before each test
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
    // Clean up test data directory after each test
    try {
      await fs.rm(testDataDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('create', () => {
    it('should create a new user and save to file', async () => {
      const user = await User.create('testuser', 'Password123');
      
      const created = await repository.create(user);
      
      expect(created.id).toBe(user.id);
      expect(created.username).toBe('testuser');
      
      // Verify file was created
      const userPath = path.join(testDataDir, 'users', `${user.id}.json`);
      const fileContent = await fs.readFile(userPath, 'utf-8');
      const dto = JSON.parse(fileContent);
      expect(dto.username).toBe('testuser');
    });

    it('should update the username index when creating a user', async () => {
      const user = await User.create('indextest', 'Password123');
      
      await repository.create(user);
      
      // Verify index was updated
      const indexPath = path.join(testDataDir, 'metadata', 'indexes.json');
      const indexContent = await fs.readFile(indexPath, 'utf-8');
      const index = JSON.parse(indexContent);
      expect(index.usernameToId['indextest']).toBe(user.id);
    });

    it('should throw error if username already exists', async () => {
      const user1 = await User.create('duplicate', 'Password123');
      const user2 = await User.create('duplicate', 'Password456');
      
      await repository.create(user1);
      
      await expect(repository.create(user2)).rejects.toThrow(
        "Username 'duplicate' already exists"
      );
    });

    it('should be case-insensitive for username uniqueness', async () => {
      const user1 = await User.create('TestUser', 'Password123');
      const user2 = await User.create('testuser', 'Password456');
      
      await repository.create(user1);
      
      await expect(repository.create(user2)).rejects.toThrow(
        "Username 'testuser' already exists"
      );
    });
  });

  describe('findById', () => {
    it('should find an existing user by ID', async () => {
      const user = await User.create('findme', 'Password123');
      await repository.create(user);
      
      const found = await repository.findById(user.id);
      
      expect(found).not.toBeNull();
      expect(found!.id).toBe(user.id);
      expect(found!.username).toBe('findme');
    });

    it('should return null for non-existent user ID', async () => {
      const found = await repository.findById('nonexistent_id');
      
      expect(found).toBeNull();
    });

    it('should return null for invalid user file', async () => {
      // Create a corrupted user file
      const usersDir = path.join(testDataDir, 'users');
      await fs.mkdir(usersDir, { recursive: true });
      await fs.writeFile(
        path.join(usersDir, 'corrupted.json'),
        'invalid json{',
        'utf-8'
      );
      
      const found = await repository.findById('corrupted');
      
      expect(found).toBeNull();
    });
  });

  describe('findByUsername', () => {
    it('should find an existing user by username', async () => {
      const user = await User.create('searchme', 'Password123');
      await repository.create(user);
      
      const found = await repository.findByUsername('searchme');
      
      expect(found).not.toBeNull();
      expect(found!.username).toBe('searchme');
      expect(found!.id).toBe(user.id);
    });

    it('should be case-insensitive when finding by username', async () => {
      const user = await User.create('CaseSensitive', 'Password123');
      await repository.create(user);
      
      const found = await repository.findByUsername('casesensitive');
      
      expect(found).not.toBeNull();
      expect(found!.username).toBe('CaseSensitive');
    });

    it('should return null for non-existent username', async () => {
      const found = await repository.findByUsername('nonexistent');
      
      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    it('should update an existing user', async () => {
      const user = await User.create('updateme', 'Password123');
      await repository.create(user);
      
      // Update password
      await user.updatePassword('NewPassword456');
      const updated = await repository.update(user);
      
      expect(updated.id).toBe(user.id);
      
      // Verify password was updated
      const found = await repository.findById(user.id);
      const isValid = await found!.validatePassword('NewPassword456');
      expect(isValid).toBe(true);
    });

    it('should throw error when updating non-existent user', async () => {
      const user = await User.create('ghost', 'Password123');
      
      await expect(repository.update(user)).rejects.toThrow(
        `User with id '${user.id}' not found`
      );
    });

    it('should update index when username changes', async () => {
      const user = await User.create('oldname', 'Password123');
      await repository.create(user);
      
      // Create new user with updated username (simulating username change)
      const updatedUser = new User('newname', user.toJSON().passwordHash, user.id, user.createdAt);
      await repository.update(updatedUser);
      
      // Old username should not be found
      const foundOld = await repository.findByUsername('oldname');
      expect(foundOld).toBeNull();
      
      // New username should be found
      const foundNew = await repository.findByUsername('newname');
      expect(foundNew).not.toBeNull();
      expect(foundNew!.id).toBe(user.id);
    });

    it('should throw error if new username already exists', async () => {
      const user1 = await User.create('user1', 'Password123');
      const user2 = await User.create('user2', 'Password456');
      await repository.create(user1);
      await repository.create(user2);
      
      // Try to change user2's username to user1
      const updatedUser2 = new User('user1', user2.toJSON().passwordHash, user2.id, user2.createdAt);
      
      await expect(repository.update(updatedUser2)).rejects.toThrow(
        "Username 'user1' already exists"
      );
    });
  });

  describe('delete', () => {
    it('should delete an existing user', async () => {
      const user = await User.create('deleteme', 'Password123');
      await repository.create(user);
      
      await repository.delete(user.id);
      
      // User should not be found
      const found = await repository.findById(user.id);
      expect(found).toBeNull();
      
      // Username should not be in index
      const foundByUsername = await repository.findByUsername('deleteme');
      expect(foundByUsername).toBeNull();
    });

    it('should throw error when deleting non-existent user', async () => {
      await expect(repository.delete('nonexistent')).rejects.toThrow(
        "User with id 'nonexistent' not found"
      );
    });

    it('should remove user file from disk', async () => {
      const user = await User.create('removeme', 'Password123');
      await repository.create(user);
      
      const userPath = path.join(testDataDir, 'users', `${user.id}.json`);
      
      // Verify file exists
      await fs.access(userPath);
      
      await repository.delete(user.id);
      
      // Verify file was deleted
      await expect(fs.access(userPath)).rejects.toThrow();
    });
  });

  describe('exists', () => {
    it('should return true for existing username', async () => {
      const user = await User.create('exists', 'Password123');
      await repository.create(user);
      
      const exists = await repository.exists('exists');
      
      expect(exists).toBe(true);
    });

    it('should return false for non-existent username', async () => {
      const exists = await repository.exists('nonexistent');
      
      expect(exists).toBe(false);
    });

    it('should be case-insensitive', async () => {
      const user = await User.create('CaseTest', 'Password123');
      await repository.create(user);
      
      const exists = await repository.exists('casetest');
      
      expect(exists).toBe(true);
    });
  });

  describe('concurrent operations', () => {
    it('should handle multiple users created concurrently', async () => {
      const users = await Promise.all([
        User.create('user1', 'Password123'),
        User.create('user2', 'Password456'),
        User.create('user3', 'Password789'),
      ]);
      
      // Create all users concurrently
      await Promise.all(users.map(user => repository.create(user)));
      
      // Verify all users exist
      for (const user of users) {
        const found = await repository.findById(user.id);
        expect(found).not.toBeNull();
        expect(found!.username).toBe(user.username);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle usernames with special characters', async () => {
      const user = await User.create('user_123', 'Password123');
      await repository.create(user);
      
      const found = await repository.findByUsername('user_123');
      
      expect(found).not.toBeNull();
      expect(found!.username).toBe('user_123');
    });

    it('should handle very long user IDs', async () => {
      const longId = 'user_' + 'a'.repeat(100);
      const user = new User('longiduser', 'hashedpassword', longId);
      await repository.create(user);
      
      const found = await repository.findById(longId);
      
      expect(found).not.toBeNull();
      expect(found!.id).toBe(longId);
    });
  });
});
