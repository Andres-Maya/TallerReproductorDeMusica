import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

/**
 * Token payload structure embedded in JWT tokens.
 */
export interface TokenPayload {
  userId: string;
  username: string;
  iat: number;
  exp: number;
}

/**
 * Extended Express Request with optional user payload.
 */
export interface AuthRequest extends Request {
  user?: TokenPayload;
}

/**
 * Extract JWT token from Authorization header.
 * Supports "Bearer <token>" format.
 * 
 * @param req - Express request object
 * @returns JWT token string or null if not found
 */
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return null;
  }
  
  // Support "Bearer <token>" format
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }
  
  // Support raw token (no "Bearer" prefix)
  return authHeader;
}

/**
 * Validate and decode a JWT token.
 * 
 * @param token - JWT token string
 * @returns Decoded token payload or null if invalid
 */
function validateToken(token: string): TokenPayload | null {
  try {
    const jwtSecret = process.env.JWT_SECRET ?? 'default-secret-change-in-production';
    const decoded = jwt.verify(token, jwtSecret) as TokenPayload;
    
    // Verify the token has required fields
    if (!decoded.userId || !decoded.username) {
      return null;
    }
    
    return decoded;
  } catch (error) {
    // Token is invalid, expired, or malformed
    return null;
  }
}

/**
 * requireAuth — Middleware that validates JWT from Authorization header.
 * 
 * This middleware:
 * - Extracts JWT token from Authorization header
 * - Validates the token signature and expiration
 * - Attaches decoded token payload to req.user
 * - Returns 401 Unauthorized for invalid/missing tokens
 * 
 * **Validates: Requirements 2.9, 9.3, 9.4**
 * 
 * @example
 * router.get('/playlists', requireAuth, playlistController.list);
 */
export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const token = extractToken(req);
  
  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Authentication required. Please provide a valid token.',
    });
    return;
  }
  
  const payload = validateToken(token);
  
  if (!payload) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token.',
    });
    return;
  }
  
  // Attach decoded token payload to request
  req.user = payload;
  next();
}

/**
 * optionalAuth — Middleware for endpoints that work with/without authentication.
 * 
 * This middleware:
 * - Extracts JWT token from Authorization header if present
 * - Validates the token if provided
 * - Attaches decoded token payload to req.user if valid
 * - Continues to next middleware regardless of token validity
 * - Does NOT return 401 for missing/invalid tokens
 * 
 * Use this for endpoints that provide enhanced functionality for authenticated
 * users but still work for anonymous users.
 * 
 * **Validates: Requirements 2.9, 9.3**
 * 
 * @example
 * router.get('/songs', optionalAuth, songController.list);
 */
export function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const token = extractToken(req);
  
  if (!token) {
    // No token provided, continue without user
    next();
    return;
  }
  
  const payload = validateToken(token);
  
  if (payload) {
    // Valid token, attach user to request
    req.user = payload;
  }
  
  // Continue regardless of token validity
  next();
}
