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
exports.FileUserRepository = void 0;
const User_1 = require("../domain/User");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
/**
 * FileUserRepository — file-based implementation of UserRepository.
 *
 * Stores users as individual JSON files in data/users/{userId}.json
 * Maintains a username index in data/metadata/indexes.json for fast lookups
 */
class FileUserRepository {
    constructor(dataDir = 'data') {
        this.usersDir = path.join(dataDir, 'users');
        this.metadataDir = path.join(dataDir, 'metadata');
        this.indexPath = path.join(this.metadataDir, 'indexes.json');
        // Initialize directories on construction
        this.initializeDirectories();
    }
    /**
     * Ensure required directories exist.
     */
    async initializeDirectories() {
        try {
            await fs.mkdir(this.usersDir, { recursive: true });
            await fs.mkdir(this.metadataDir, { recursive: true });
            // Initialize index file if it doesn't exist
            try {
                await fs.access(this.indexPath);
            }
            catch {
                await this.saveIndex({ usernameToId: {} });
            }
        }
        catch (error) {
            console.error('Failed to initialize directories:', error);
            throw new Error('Failed to initialize user repository');
        }
    }
    async create(user) {
        // Check if username already exists
        const exists = await this.exists(user.username);
        if (exists) {
            throw new Error(`Username '${user.username}' already exists`);
        }
        // Save user file
        const userPath = this.getUserPath(user.id);
        const dto = user.toJSON();
        await fs.writeFile(userPath, JSON.stringify(dto, null, 2), 'utf-8');
        // Update index
        await this.addToIndex(user.username, user.id);
        return user;
    }
    async findById(id) {
        try {
            const userPath = this.getUserPath(id);
            const content = await fs.readFile(userPath, 'utf-8');
            const dto = JSON.parse(content);
            return User_1.User.fromDTO(dto);
        }
        catch (error) {
            // File doesn't exist or is invalid
            return null;
        }
    }
    async findByUsername(username) {
        const index = await this.loadIndex();
        const userId = index.usernameToId[username.toLowerCase()];
        if (!userId) {
            return null;
        }
        return this.findById(userId);
    }
    async update(user) {
        // Verify user exists
        const existing = await this.findById(user.id);
        if (!existing) {
            throw new Error(`User with id '${user.id}' not found`);
        }
        // Check if username changed and if new username is available
        if (existing.username !== user.username) {
            const usernameExists = await this.exists(user.username);
            if (usernameExists) {
                throw new Error(`Username '${user.username}' already exists`);
            }
            // Update index: remove old username, add new one
            await this.removeFromIndex(existing.username);
            await this.addToIndex(user.username, user.id);
        }
        // Save updated user file
        const userPath = this.getUserPath(user.id);
        const dto = user.toJSON();
        await fs.writeFile(userPath, JSON.stringify(dto, null, 2), 'utf-8');
        return user;
    }
    async delete(id) {
        // Verify user exists
        const user = await this.findById(id);
        if (!user) {
            throw new Error(`User with id '${id}' not found`);
        }
        // Remove from index
        await this.removeFromIndex(user.username);
        // Delete user file
        const userPath = this.getUserPath(id);
        await fs.unlink(userPath);
    }
    async exists(username) {
        const index = await this.loadIndex();
        return username.toLowerCase() in index.usernameToId;
    }
    /**
     * Get the file path for a user by ID.
     */
    getUserPath(userId) {
        return path.join(this.usersDir, `${userId}.json`);
    }
    /**
     * Load the username index from disk.
     */
    async loadIndex() {
        try {
            const content = await fs.readFile(this.indexPath, 'utf-8');
            return JSON.parse(content);
        }
        catch {
            // If index doesn't exist or is corrupted, return empty index
            return { usernameToId: {} };
        }
    }
    /**
     * Save the username index to disk.
     */
    async saveIndex(index) {
        await fs.writeFile(this.indexPath, JSON.stringify(index, null, 2), 'utf-8');
    }
    /**
     * Add a username-to-ID mapping to the index.
     */
    async addToIndex(username, userId) {
        const index = await this.loadIndex();
        index.usernameToId[username.toLowerCase()] = userId;
        await this.saveIndex(index);
    }
    /**
     * Remove a username from the index.
     */
    async removeFromIndex(username) {
        const index = await this.loadIndex();
        delete index.usernameToId[username.toLowerCase()];
        await this.saveIndex(index);
    }
}
exports.FileUserRepository = FileUserRepository;
//# sourceMappingURL=UserRepository.js.map