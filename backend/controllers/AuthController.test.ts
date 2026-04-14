import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response } from 'express';
import { AuthController } from './AuthController';
import { AuthService } from '../services/AuthService';
import { AuthRequest } from '../middlewares/auth';

// Mock AuthService
vi.mock('../services/AuthService');

describe('AuthController', () => {
  let authController: AuthController;
  let mockAuthService: AuthService;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockAuthRequest: Partial<AuthRequest>;

  beforeEach(() => {
    // Create mock AuthService
    mockAuthService = {
      register: vi.fn(),
      login: vi.fn(),
      validateToken: vi.fn(),
    } as any;

    authController = new AuthController(mockAuthService);

    // Create mock request and response
    mockRequest = {
      body: {},
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };

    mockAuthRequest = {
      body: {},
      user: undefined,
    };
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerData = {
        username: 'testuser',
        password: 'SecurePass123',
      };

      const authToken = {
        token: 'mock-jwt-token',
        expiresAt: new Date('2024-12-31T23:59:59Z'),
        userId: 'user-123',
      };

      mockRequest.body = registerData;
      vi.mocked(mockAuthService.register).mockResolvedValue(authToken);

      await authController.register(mockRequest as Request, mockResponse as Response);

      expect(mockAuthService.register).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'SecurePass123',
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        token: 'mock-jwt-token',
        expiresAt: '2024-12-31T23:59:59.000Z',
        user: {
          id: 'user-123',
          username: 'testuser',
        },
      });
    });

    it('should return 400 when username is missing', async () => {
      mockRequest.body = { password: 'SecurePass123' };

      await authController.register(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Username and password are required',
      });
    });

    it('should return 400 when password is missing', async () => {
      mockRequest.body = { username: 'testuser' };

      await authController.register(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Username and password are required',
      });
    });

    it('should return 409 when username already exists', async () => {
      mockRequest.body = {
        username: 'existinguser',
        password: 'SecurePass123',
      };

      vi.mocked(mockAuthService.register).mockRejectedValue(
        new Error("Username 'existinguser' is already taken")
      );

      await authController.register(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: "Username 'existinguser' is already taken",
      });
    });

    it('should return 400 for validation errors', async () => {
      mockRequest.body = {
        username: 'testuser',
        password: 'weak',
      };

      vi.mocked(mockAuthService.register).mockRejectedValue(
        new Error('Password must be at least 8 characters')
      );

      await authController.register(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Password must be at least 8 characters',
      });
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const loginData = {
        username: 'testuser',
        password: 'SecurePass123',
        rememberMe: false,
      };

      const authToken = {
        token: 'mock-jwt-token',
        expiresAt: new Date('2024-12-31T23:59:59Z'),
        userId: 'user-123',
      };

      mockRequest.body = loginData;
      vi.mocked(mockAuthService.login).mockResolvedValue(authToken);

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(mockAuthService.login).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'SecurePass123',
        rememberMe: false,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        token: 'mock-jwt-token',
        expiresAt: '2024-12-31T23:59:59.000Z',
        user: {
          id: 'user-123',
          username: 'testuser',
        },
      });
    });

    it('should login with rememberMe flag', async () => {
      const loginData = {
        username: 'testuser',
        password: 'SecurePass123',
        rememberMe: true,
      };

      const authToken = {
        token: 'mock-jwt-token',
        expiresAt: new Date('2025-01-30T23:59:59Z'),
        userId: 'user-123',
      };

      mockRequest.body = loginData;
      vi.mocked(mockAuthService.login).mockResolvedValue(authToken);

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(mockAuthService.login).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'SecurePass123',
        rememberMe: true,
      });
    });

    it('should return 400 when credentials are missing', async () => {
      mockRequest.body = { username: 'testuser' };

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Username and password are required',
      });
    });

    it('should return 401 for invalid credentials', async () => {
      mockRequest.body = {
        username: 'testuser',
        password: 'wrongpassword',
      };

      vi.mocked(mockAuthService.login).mockRejectedValue(
        new Error('Invalid username or password')
      );

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid username or password',
      });
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      await authController.logout(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
    });
  });

  describe('me', () => {
    it('should return current user information', async () => {
      mockAuthRequest.user = {
        userId: 'user-123',
        username: 'testuser',
        iat: 1234567890,
        exp: 1234567890,
      };

      await authController.me(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        user: {
          id: 'user-123',
          username: 'testuser',
        },
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      mockAuthRequest.user = undefined;

      await authController.me(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required',
      });
    });
  });
});
