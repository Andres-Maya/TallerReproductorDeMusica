"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
/**
 * User — core domain entity for authentication.
 *
 * Represents a user account with secure password handling.
 * Passwords are hashed using bcrypt before storage.
 */
class User {
    constructor(username, passwordHash, id, createdAt) {
        this.id = id ?? User.generateId();
        this.username = username.trim();
        this.passwordHash = passwordHash;
        this.createdAt = createdAt ?? new Date();
    }
    /**
     * Validates a plain password against the stored hash.
     */
    async validatePassword(plainPassword) {
        return bcrypt_1.default.compare(plainPassword, this.passwordHash);
    }
    /**
     * Updates the user's password with a new hashed value.
     */
    async updatePassword(newPassword) {
        const errors = User.validatePasswordStrength(newPassword);
        if (errors.length > 0) {
            throw new Error(`Password validation failed: ${errors.join(', ')}`);
        }
        this.passwordHash = await bcrypt_1.default.hash(newPassword, 12);
    }
    /**
     * Validates username format.
     */
    static validateUsername(username) {
        const errors = [];
        const trimmed = username.trim();
        if (!trimmed) {
            errors.push('username is required');
        }
        else if (trimmed.length < 3 || trimmed.length > 30) {
            errors.push('username must be between 3 and 30 characters');
        }
        else if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
            errors.push('username must contain only letters, numbers, and underscores');
        }
        return errors;
    }
    /**
     * Validates password strength requirements.
     */
    static validatePasswordStrength(password) {
        const errors = [];
        if (!password) {
            errors.push('password is required');
        }
        else {
            if (password.length < 8) {
                errors.push('password must be at least 8 characters');
            }
            if (!/[A-Z]/.test(password)) {
                errors.push('password must contain at least one uppercase letter');
            }
            if (!/[a-z]/.test(password)) {
                errors.push('password must contain at least one lowercase letter');
            }
            if (!/[0-9]/.test(password)) {
                errors.push('password must contain at least one number');
            }
        }
        return errors;
    }
    /**
     * Validates the entity's invariants.
     * Returns an array of error messages; empty means valid.
     */
    validate() {
        const errors = [];
        errors.push(...User.validateUsername(this.username));
        if (!this.passwordHash) {
            errors.push('passwordHash is required');
        }
        return errors;
    }
    isValid() {
        return this.validate().length === 0;
    }
    /**
     * Serialize to a plain object (DTO) for JSON responses.
     * Note: passwordHash is included for persistence but should be
     * filtered out in API responses.
     */
    toJSON() {
        return {
            id: this.id,
            username: this.username,
            passwordHash: this.passwordHash,
            createdAt: this.createdAt.toISOString(),
        };
    }
    /**
     * Reconstruct a User from a DTO (e.g. after deserialization).
     */
    static fromDTO(dto) {
        const createdAt = new Date(dto.createdAt);
        return new User(dto.username, dto.passwordHash, dto.id, createdAt);
    }
    /**
     * Create a new User with a plain password.
     * Validates password strength and hashes it before creating the entity.
     */
    static async create(username, plainPassword) {
        // Validate username
        const usernameErrors = User.validateUsername(username);
        if (usernameErrors.length > 0) {
            throw new Error(`Username validation failed: ${usernameErrors.join(', ')}`);
        }
        // Validate password strength
        const passwordErrors = User.validatePasswordStrength(plainPassword);
        if (passwordErrors.length > 0) {
            throw new Error(`Password validation failed: ${passwordErrors.join(', ')}`);
        }
        // Hash password with 12 salt rounds
        const passwordHash = await bcrypt_1.default.hash(plainPassword, 12);
        return new User(username, passwordHash);
    }
    static generateId() {
        return `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    }
}
exports.User = User;
//# sourceMappingURL=User.js.map