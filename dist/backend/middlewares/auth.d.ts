import { Request, Response, NextFunction } from 'express';
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
export declare function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void;
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
export declare function optionalAuth(req: AuthRequest, res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.d.ts.map