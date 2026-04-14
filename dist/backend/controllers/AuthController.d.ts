import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { AuthRequest } from '../middlewares/auth';
/**
 * AuthController — handles HTTP requests for authentication endpoints.
 *
 * Endpoints:
 * - POST /api/v1/auth/register - Create new user account
 * - POST /api/v1/auth/login - Authenticate user and get token
 * - POST /api/v1/auth/logout - Invalidate current session
 * - GET /api/v1/auth/me - Get current user information
 *
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.8**
 */
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    /**
     * POST /api/v1/auth/register
     *
     * Create a new user account and return authentication token.
     *
     * **Validates: Requirements 2.1, 2.2, 2.3**
     */
    register: (req: Request, res: Response) => Promise<void>;
    /**
     * POST /api/v1/auth/login
     *
     * Authenticate user and return session token.
     * Supports optional "rememberMe" flag for extended sessions.
     *
     * **Validates: Requirements 2.4, 2.5, 2.8**
     */
    login: (req: Request, res: Response) => Promise<void>;
    /**
     * POST /api/v1/auth/logout
     *
     * Invalidate current session token.
     *
     * Note: With JWT tokens, logout is primarily client-side (delete token).
     * This endpoint provides a standard REST interface and could be extended
     * to maintain a token blacklist for enhanced security.
     *
     * **Validates: Requirements 2.8**
     */
    logout: (req: AuthRequest, res: Response) => Promise<void>;
    /**
     * GET /api/v1/auth/me
     *
     * Get current authenticated user information.
     * Requires valid authentication token.
     *
     * **Validates: Requirements 2.8**
     */
    me: (req: AuthRequest, res: Response) => Promise<void>;
}
//# sourceMappingURL=AuthController.d.ts.map