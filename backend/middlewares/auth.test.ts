import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { requireAuth, optionalAuth, AuthRequest, TokenPayload } from './auth';

describe('Authentication Middleware', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;

  const validToken = jwt.sign(
    { userId: 'user123', username: 'testuser' },
    process.env.JWT_SECRET ?? 'default-secret-change-in-production',
    { expiresIn: '1h' }
  );

  const expiredToken = jwt.sign(
    { userId: 'user123', username: 'testuser' },
    process.env.JWT_SECRET ?? 'default-secret-change-in-production',
    { expiresIn: '-1h' } // Already expired
  );

  const invalidToken = 'invalid.jwt.token';

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    
    mockReq = {
      headers: {},
    };
    
    mockRes = {
      status: statusMock,
      json: jsonMock,
    };
    
    mockNext = vi.fn();
  });

  describe('requireAuth', () => {
    it('should attach user to request when valid Bearer token is provided', () => {
      mockReq.headers = {
        authorization: `Bearer ${validToken}`,
      };

      requireAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockReq.user).toBeDefined();
      expect(mockReq.user?.userId).toBe('user123');
      expect(mockReq.user?.username).toBe('testuser');
      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should attach user to request when valid token without Bearer prefix is provided', () => {
      mockReq.headers = {
        authorization: validToken,
      };

      requireAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockReq.user).toBeDefined();
      expect(mockReq.user?.userId).toBe('user123');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 when no Authorization header is provided', () => {
      mockReq.headers = {};

      requireAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required. Please provide a valid token.',
      });
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockReq.user).toBeUndefined();
    });

    it('should return 401 when invalid token is provided', () => {
      mockReq.headers = {
        authorization: `Bearer ${invalidToken}`,
      };

      requireAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid or expired token.',
      });
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockReq.user).toBeUndefined();
    });

    it('should return 401 when expired token is provided', () => {
      mockReq.headers = {
        authorization: `Bearer ${expiredToken}`,
      };

      requireAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid or expired token.',
      });
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockReq.user).toBeUndefined();
    });

    it('should return 401 when token has missing userId', () => {
      const tokenWithoutUserId = jwt.sign(
        { username: 'testuser' }, // Missing userId
        process.env.JWT_SECRET ?? 'default-secret-change-in-production',
        { expiresIn: '1h' }
      );

      mockReq.headers = {
        authorization: `Bearer ${tokenWithoutUserId}`,
      };

      requireAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when token has missing username', () => {
      const tokenWithoutUsername = jwt.sign(
        { userId: 'user123' }, // Missing username
        process.env.JWT_SECRET ?? 'default-secret-change-in-production',
        { expiresIn: '1h' }
      );

      mockReq.headers = {
        authorization: `Bearer ${tokenWithoutUsername}`,
      };

      requireAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    it('should attach user to request when valid Bearer token is provided', () => {
      mockReq.headers = {
        authorization: `Bearer ${validToken}`,
      };

      optionalAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockReq.user).toBeDefined();
      expect(mockReq.user?.userId).toBe('user123');
      expect(mockReq.user?.username).toBe('testuser');
      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should continue without user when no Authorization header is provided', () => {
      mockReq.headers = {};

      optionalAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should continue without user when invalid token is provided', () => {
      mockReq.headers = {
        authorization: `Bearer ${invalidToken}`,
      };

      optionalAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should continue without user when expired token is provided', () => {
      mockReq.headers = {
        authorization: `Bearer ${expiredToken}`,
      };

      optionalAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should continue without user when token has missing fields', () => {
      const incompleteToken = jwt.sign(
        { username: 'testuser' }, // Missing userId
        process.env.JWT_SECRET ?? 'default-secret-change-in-production',
        { expiresIn: '1h' }
      );

      mockReq.headers = {
        authorization: `Bearer ${incompleteToken}`,
      };

      optionalAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should attach user when valid token without Bearer prefix is provided', () => {
      mockReq.headers = {
        authorization: validToken,
      };

      optionalAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockReq.user).toBeDefined();
      expect(mockReq.user?.userId).toBe('user123');
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
