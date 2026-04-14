import { UserRepository } from '../persistence/UserRepository';
/**
 * Token payload structure embedded in JWT tokens.
 */
export interface TokenPayload {
    userId: string;
    username: string;
    iat: number;
    exp: number;
}
/**
 * Credentials required for user login.
 */
export interface LoginCredentials {
    username: string;
    password: string;
    rememberMe?: boolean;
}
/**
 * Payload for user registration.
 */
export interface RegisterPayload {
    username: string;
    password: string;
}
/**
 * Authentication token response.
 */
export interface AuthToken {
    token: string;
    expiresAt: Date;
    userId: string;
}
/**
 * AuthService — handles user authentication and JWT token management.
 *
 * Responsibilities:
 * - User registration with username uniqueness validation
 * - User login with credential verification
 * - JWT token generation with configurable expiration
 * - JWT token validation and verification
 *
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 8.6, 8.7**
 */
export declare class AuthService {
    private readonly userRepository;
    private readonly jwtSecret;
    private readonly defaultTokenExpiration;
    private readonly rememberMeExpiration;
    constructor(userRepository: UserRepository, jwtSecret?: string);
    /**
     * Register a new user account.
     *
     * @param payload - Username and password for the new account
     * @returns Authentication token for the newly created user
     * @throws Error if username already exists or validation fails
     *
     * **Validates: Requirement 2.1, 2.2, 2.3**
     */
    register(payload: RegisterPayload): Promise<AuthToken>;
    /**
     * Authenticate a user and generate a session token.
     *
     * @param credentials - Username, password, and optional rememberMe flag
     * @returns Authentication token for the authenticated user
     * @throws Error if credentials are invalid
     *
     * **Validates: Requirement 2.4, 2.5, 8.6, 8.7**
     */
    login(credentials: LoginCredentials): Promise<AuthToken>;
    /**
     * Validate and decode a JWT token.
     *
     * @param token - JWT token string to validate
     * @returns Decoded token payload with user information
     * @throws Error if token is invalid, expired, or malformed
     *
     * **Validates: Requirement 2.4**
     */
    validateToken(token: string): Promise<TokenPayload>;
    /**
     * Generate a JWT token for a user.
     *
     * @param userId - Unique user identifier
     * @param username - Username for the token payload
     * @param expiresIn - Token expiration time (e.g., '24h', '30d')
     * @returns Signed JWT token string
     *
     * **Validates: Requirement 8.6, 8.7**
     */
    private generateToken;
    /**
     * Calculate the expiration date for a given duration string.
     *
     * @param expiresIn - Duration string (e.g., '24h', '30d')
     * @returns Date object representing the expiration time
     */
    private getExpirationDate;
}
//# sourceMappingURL=AuthService.d.ts.map