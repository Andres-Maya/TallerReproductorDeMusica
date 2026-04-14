import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { AuthRequest } from '../middlewares/auth';

/**
 * Request body for user registration.
 */
interface RegisterRequest {
  username: string;
  password: string;
}

/**
 * Request body for user login.
 */
interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}

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
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/v1/auth/register
   * 
   * Create a new user account and return authentication token.
   * 
   * **Validates: Requirements 2.1, 2.2, 2.3**
   */
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, password } = req.body as RegisterRequest;

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
    } catch (error) {
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
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, password, rememberMe } = req.body as LoginRequest;

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
    } catch (error) {
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
  logout = async (req: AuthRequest, res: Response): Promise<void> => {
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
  me = async (req: AuthRequest, res: Response): Promise<void> => {
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
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  };
}
