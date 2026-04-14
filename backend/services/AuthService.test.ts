import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService, LoginCredentials, RegisterPayload } from './AuthService';
import { UserRepository } from '../persistence/UserRepository';
import { User } from '../domain/User';

/**
 * Mock UserRepository for testing AuthService in isolation.
 */
class MockUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();
  private usernameIndex: Map<string, string> = new Map();

  async create(user: User): Promise<User> {
    if (this.usernameIndex.has(user.username.toLowerCase())) {
      throw new Error(`Username '${user.username}' already exists`);
    }
    this.users.set(user.id, user);
    this.usernameIndex.set(user.username.toLowerCase(), user.id);
    return user;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const userId = this.usernameIndex.get(username.toLowerCase());
    if (!userId) return null;
    return this.users.get(userId) ?? null;
  }

  async update(user: User): Promise<User> {
    if (!this.users.has(user.id)) {
      throw new Error(`User with id '${user.id}' not found`);
    }
    this.users.set(user.id, user);
    return user;
  }

  async delete(id: string): Promise<void> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error(`User with id '${id}' not found`);
    }
    this.usernameIndex.delete(user.username.toLowerCase());
    this.users.delete(id);
  }

  async exists(username: string): Promise<boolean> {
    return this.usernameIndex.has(username.toLowerCase());
  }

  clear(): void {
    this.users.clear();
    this.usernameIndex.clear();
  }
}

describe('AuthService', () => {
  let authService: AuthService;
  let mockRepository: MockUserRepository;
  const testSecret = 'test-secret-key';

  beforeEach(() => {
    mockRepository = new MockUserRepository();
    authService = new AuthService(mockRepository, testSecret);
  });

  describe('register', () => {
    it('should create a new user and return an auth token', async () => {
      const payload: RegisterPayload = {
        username: 'testuser',
        password: 'Password123',
      };

      const result = await authService.register(payload);

      expect(result.token).toBeDefined();
      expect(result.userId).toBeDefined();
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('should throw error if username already exists', async () => {
      const payload: RegisterPayload = {
        username: 'duplicate',
        password: 'Password123',
      };

      await authService.register(payload);

      await expect(authService.register(payload)).rejects.toThrow(
        "Username 'duplicate' is already taken"
      );
    });

    it('should throw error for invalid username', async () => {
      const payload: RegisterPayload = {
        username: 'ab', // Too short
        password: 'Password123',
      };

      await expect(authService.register(payload)).rejects.toThrow();
    });

    it('should throw error for weak password', async () => {
      const payload: RegisterPayload = {
        username: 'testuser',
        password: 'weak', // No uppercase, no number, too short
      };

      await expect(authService.register(payload)).rejects.toThrow();
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      // Create a test user
      await authService.register({
        username: 'logintest',
        password: 'Password123',
      });
    });

    it('should authenticate valid credentials and return token', async () => {
      const credentials: LoginCredentials = {
        username: 'logintest',
        password: 'Password123',
      };

      const result = await authService.login(credentials);

      expect(result.token).toBeDefined();
      expect(result.userId).toBeDefined();
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it('should throw error for invalid username', async () => {
      const credentials: LoginCredentials = {
        username: 'nonexistent',
        password: 'Password123',
      };

      await expect(authService.login(credentials)).rejects.toThrow(
        'Invalid username or password'
      );
    });

    it('should throw error for invalid password', async () => {
      const credentials: LoginCredentials = {
        username: 'logintest',
        password: 'WrongPassword123',
      };

      await expect(authService.login(credentials)).rejects.toThrow(
        'Invalid username or password'
      );
    });

    it('should generate token with default expiration when rememberMe is false', async () => {
      const credentials: LoginCredentials = {
        username: 'logintest',
        password: 'Password123',
        rememberMe: false,
      };

      const result = await authService.login(credentials);
      const expiresIn = result.expiresAt.getTime() - Date.now();

      // Should expire in approximately 24 hours (with some tolerance)
      expect(expiresIn).toBeGreaterThan(23 * 60 * 60 * 1000);
      expect(expiresIn).toBeLessThan(25 * 60 * 60 * 1000);
    });

    it('should generate token with extended expiration when rememberMe is true', async () => {
      const credentials: LoginCredentials = {
        username: 'logintest',
        password: 'Password123',
        rememberMe: true,
      };

      const result = await authService.login(credentials);
      const expiresIn = result.expiresAt.getTime() - Date.now();

      // Should expire in approximately 30 days (with some tolerance)
      expect(expiresIn).toBeGreaterThan(29 * 24 * 60 * 60 * 1000);
      expect(expiresIn).toBeLessThan(31 * 24 * 60 * 60 * 1000);
    });
  });

  describe('validateToken', () => {
    let validToken: string;
    let userId: string;

    beforeEach(async () => {
      const result = await authService.register({
        username: 'tokentest',
        password: 'Password123',
      });
      validToken = result.token;
      userId = result.userId;
    });

    it('should validate and decode a valid token', async () => {
      const payload = await authService.validateToken(validToken);

      expect(payload.userId).toBe(userId);
      expect(payload.username).toBe('tokentest');
      expect(payload.iat).toBeDefined();
      expect(payload.exp).toBeDefined();
    });

    it('should throw error for invalid token', async () => {
      const invalidToken = 'invalid.token.string';

      await expect(authService.validateToken(invalidToken)).rejects.toThrow(
        'Invalid token'
      );
    });

    it('should throw error for malformed token', async () => {
      const malformedToken = 'not-a-jwt-token';

      await expect(authService.validateToken(malformedToken)).rejects.toThrow(
        'Invalid token'
      );
    });

    it('should throw error for token signed with different secret', async () => {
      const otherAuthService = new AuthService(mockRepository, 'different-secret');
      const otherToken = (await otherAuthService.register({
        username: 'otheruser',
        password: 'Password123',
      })).token;

      await expect(authService.validateToken(otherToken)).rejects.toThrow(
        'Invalid token'
      );
    });

    it('should throw error for expired token', async () => {
      // Create a token that expires immediately
      const jwt = await import('jsonwebtoken');
      const expiredToken = jwt.sign(
        { userId: 'user123', username: 'testuser' },
        testSecret,
        { expiresIn: '-1h' } // Already expired
      );

      await expect(authService.validateToken(expiredToken)).rejects.toThrow(
        'Token has expired'
      );
    });
  });

  describe('token payload structure', () => {
    it('should include userId, username, iat, and exp in token payload', async () => {
      const result = await authService.register({
        username: 'payloadtest',
        password: 'Password123',
      });

      const payload = await authService.validateToken(result.token);

      expect(payload).toHaveProperty('userId');
      expect(payload).toHaveProperty('username');
      expect(payload).toHaveProperty('iat');
      expect(payload).toHaveProperty('exp');
      expect(typeof payload.userId).toBe('string');
      expect(typeof payload.username).toBe('string');
      expect(typeof payload.iat).toBe('number');
      expect(typeof payload.exp).toBe('number');
    });
  });
});
