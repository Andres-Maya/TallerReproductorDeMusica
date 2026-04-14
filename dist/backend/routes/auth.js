"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAuthRouter = buildAuthRouter;
const express_1 = require("express");
const AuthController_1 = require("../controllers/AuthController");
const AuthService_1 = require("../services/AuthService");
const UserRepository_1 = require("../persistence/UserRepository");
const auth_1 = require("../middlewares/auth");
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
function buildAuthRouter() {
    const router = (0, express_1.Router)();
    // Initialize dependencies
    const userRepository = new UserRepository_1.FileUserRepository();
    const authService = new AuthService_1.AuthService(userRepository);
    const authController = new AuthController_1.AuthController(authService);
    // Public routes (no authentication required)
    router.post('/register', authController.register);
    router.post('/login', authController.login);
    // Protected routes (authentication required)
    router.post('/logout', auth_1.requireAuth, authController.logout);
    router.get('/me', auth_1.requireAuth, authController.me);
    return router;
}
//# sourceMappingURL=auth.js.map