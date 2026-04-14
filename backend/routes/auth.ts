import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { AuthService } from '../services/AuthService';
import { FileUserRepository } from '../persistence/UserRepository';
import { requireAuth } from '../middlewares/auth';

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
export function buildAuthRouter(): Router {
  const router = Router();

  // Initialize dependencies
  const userRepository = new FileUserRepository();
  const authService = new AuthService(userRepository);
  const authController = new AuthController(authService);

  // Public routes (no authentication required)
  router.post('/register', authController.register);
  router.post('/login', authController.login);

  // Protected routes (authentication required)
  router.post('/logout', requireAuth, authController.logout);
  router.get('/me', requireAuth, authController.me);

  return router;
}
