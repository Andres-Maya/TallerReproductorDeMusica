import { Router } from 'express';
/**
 * buildAuthRouter — creates Express router for authentication endpoints.
 *
 * Routes:
 * - POST /auth/register - Create new user account
 * - POST /auth/login - Authenticate user and get token
 * - POST /auth/logout - Invalidate current session (requires auth)
 * - GET /auth/me - Get current user information (requires auth)
 *
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.8**
 */
export declare function buildAuthRouter(): Router;
//# sourceMappingURL=auth.d.ts.map