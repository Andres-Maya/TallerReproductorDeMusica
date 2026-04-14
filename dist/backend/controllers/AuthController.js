"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
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
class AuthController {
    constructor(authService) {
        this.authService = authService;
        /**
         * POST /api/v1/auth/register
         *
         * Create a new user account and return authentication token.
         *
         * **Validates: Requirements 2.1, 2.2, 2.3**
         */
        this.register = async (req, res) => {
            try {
                const { username, password } = req.body;
                // Validate request body
                if (!username || !password) {
                    res.status(400).json({
                        success: false,
                        error: 'Username and password are required',
                    });
                    return;
                }
                // Register user
                const authToken = await this.authService.register({ username, password });
                // Return success response
                res.status(201).json({
                    success: true,
                    token: authToken.token,
                    expiresAt: authToken.expiresAt.toISOString(),
                    user: {
                        id: authToken.userId,
                        username,
                    },
                });
            }
            catch (error) {
                // Handle username already exists error
                if (error instanceof Error && error.message.includes('already taken')) {
                    res.status(409).json({
                        success: false,
                        error: error.message,
                    });
                    return;
                }
                // Handle validation errors (e.g., weak password)
                if (error instanceof Error) {
                    res.status(400).json({
                        success: false,
                        error: error.message,
                    });
                    return;
                }
                // Handle unexpected errors
                res.status(500).json({
                    success: false,
                    error: 'Internal server error',
                });
            }
        };
        /**
         * POST /api/v1/auth/login
         *
         * Authenticate user and return session token.
         * Supports optional "rememberMe" flag for extended sessions.
         *
         * **Validates: Requirements 2.4, 2.5, 2.8**
         */
        this.login = async (req, res) => {
            try {
                const { username, password, rememberMe } = req.body;
                // Validate request body
                if (!username || !password) {
                    res.status(400).json({
                        success: false,
                        error: 'Username and password are required',
                    });
                    return;
                }
                // Authenticate user
                const authToken = await this.authService.login({
                    username,
                    password,
                    rememberMe: rememberMe ?? false,
                });
                // Return success response
                res.status(200).json({
                    success: true,
                    token: authToken.token,
                    expiresAt: authToken.expiresAt.toISOString(),
                    user: {
                        id: authToken.userId,
                        username,
                    },
                });
            }
            catch (error) {
                // Handle invalid credentials
                if (error instanceof Error && error.message.includes('Invalid username or password')) {
                    res.status(401).json({
                        success: false,
                        error: 'Invalid username or password',
                    });
                    return;
                }
                // Handle unexpected errors
                res.status(500).json({
                    success: false,
                    error: 'Internal server error',
                });
            }
        };
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
        this.logout = async (req, res) => {
            // With stateless JWT, logout is handled client-side by deleting the token
            // This endpoint confirms the logout action and could be extended to:
            // - Add token to blacklist
            // - Log logout events
            // - Clear server-side session data if using session storage
            res.status(204).send();
        };
        /**
         * GET /api/v1/auth/me
         *
         * Get current authenticated user information.
         * Requires valid authentication token.
         *
         * **Validates: Requirements 2.8**
         */
        this.me = async (req, res) => {
            try {
                // User payload is attached by requireAuth middleware
                if (!req.user) {
                    res.status(401).json({
                        success: false,
                        error: 'Authentication required',
                    });
                    return;
                }
                // Return user information from token payload
                res.status(200).json({
                    success: true,
                    user: {
                        id: req.user.userId,
                        username: req.user.username,
                    },
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: 'Internal server error',
                });
            }
        };
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=AuthController.js.map