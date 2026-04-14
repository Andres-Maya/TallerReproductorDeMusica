/**
 * User — core domain entity for authentication.
 *
 * Represents a user account with secure password handling.
 * Passwords are hashed using bcrypt before storage.
 */
export declare class User {
    readonly id: string;
    readonly username: string;
    private passwordHash;
    readonly createdAt: Date;
    constructor(username: string, passwordHash: string, id?: string, createdAt?: Date);
    /**
     * Validates a plain password against the stored hash.
     */
    validatePassword(plainPassword: string): Promise<boolean>;
    /**
     * Updates the user's password with a new hashed value.
     */
    updatePassword(newPassword: string): Promise<void>;
    /**
     * Validates username format.
     */
    private static validateUsername;
    /**
     * Validates password strength requirements.
     */
    private static validatePasswordStrength;
    /**
     * Validates the entity's invariants.
     * Returns an array of error messages; empty means valid.
     */
    validate(): string[];
    isValid(): boolean;
    /**
     * Serialize to a plain object (DTO) for JSON responses.
     * Note: passwordHash is included for persistence but should be
     * filtered out in API responses.
     */
    toJSON(): UserDTO;
    /**
     * Reconstruct a User from a DTO (e.g. after deserialization).
     */
    static fromDTO(dto: UserDTO): User;
    /**
     * Create a new User with a plain password.
     * Validates password strength and hashes it before creating the entity.
     */
    static create(username: string, plainPassword: string): Promise<User>;
    private static generateId;
}
/** Data Transfer Object — plain serializable shape */
export interface UserDTO {
    id: string;
    username: string;
    passwordHash: string;
    createdAt: string;
}
/** Payload accepted when registering a new user */
export interface RegisterPayload {
    username: string;
    password: string;
}
//# sourceMappingURL=User.d.ts.map