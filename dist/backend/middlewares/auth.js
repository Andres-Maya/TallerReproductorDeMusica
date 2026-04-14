"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.optionalAuth = optionalAuth;
const jwt = __importStar(require("jsonwebtoken"));
/**
 * Extract JWT token from Authorization header.
 * Supports "Bearer <token>" format.
 *
 * @param req - Express request object
 * @returns JWT token string or null if not found
 */
function extractToken(req) {
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
function validateToken(token) {
    try {
        const jwtSecret = process.env.JWT_SECRET ?? 'default-secret-change-in-production';
        const decoded = jwt.verify(token, jwtSecret);
        // Verify the token has required fields
        if (!decoded.userId || !decoded.username) {
            return null;
        }
        return decoded;
    }
    catch (error) {
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
function requireAuth(req, res, next) {
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
function optionalAuth(req, res, next) {
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
//# sourceMappingURL=auth.js.map