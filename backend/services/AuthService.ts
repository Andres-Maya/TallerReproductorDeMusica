import * as jwt from 'jsonwebtoken';
import { User } from '../domain/User';
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
export class AuthService {
  private readonly jwtSecret: string;
  private readonly defaultTokenExpiration = '24h';
  private readonly rememberMeExpiration = '30d';

  constructor(
    private readonly userRepository: UserRepository,
    jwtSecret?: string
  ) {
    // Use provided secret or fall back to environment variable or default
    this.jwtSecret = jwtSecret ?? process.env.JWT_SECRET ?? 'default-secret-change-in-production';
    
    if (this.jwtSecret === 'default-secret-change-in-production') {
      console.warn('WARNING: Using default JWT secret. Set JWT_SECRET environment variable in production!');
    }
  }

  /**
   * Register a new user account.
   * 
   * @param payload - Username and password for the new account
   * @returns Authentication token for the newly created user
   * @throws Error if username already exists or validation fails
   * 
   * **Validates: Requirement 2.1, 2.2, 2.3**
   */
  async register(payload: RegisterPayload): Promise<AuthToken> {
    // Check if username already exists
    const exists = await this.userRepository.exists(payload.username);
    if (exists) {
      throw new Error(`Username '${payload.username}' is already taken`);
    }

    // Create user (validates password strength and hashes password)
    const user = await User.create(payload.username, payload.password);

    // Persist user
    await this.userRepository.create(user);

    // Generate token with default expiration (24h)
    const token = this.generateToken(user.id, user.username, this.defaultTokenExpiration);
    const expiresAt = this.getExpirationDate(this.defaultTokenExpiration);

    return {
      token,
      expiresAt,
      userId: user.id,
    };
  }

  /**
   * Authenticate a user and generate a session token.
   * 
   * @param credentials - Username, password, and optional rememberMe flag
   * @returns Authentication token for the authenticated user
   * @throws Error if credentials are invalid
   * 
   * **Validates: Requirement 2.4, 2.5, 8.6, 8.7**
   */
  async login(credentials: LoginCredentials): Promise<AuthToken> {
    // Find user by username
    const user = await this.userRepository.findByUsername(credentials.username);
    if (!user) {
      throw new Error('Invalid username or password');
    }

    // Validate password
    const isValid = await user.validatePassword(credentials.password);
    if (!isValid) {
      throw new Error('Invalid username or password');
    }

    // Determine token expiration based on rememberMe flag
    const expiresIn = credentials.rememberMe 
      ? this.rememberMeExpiration  // 30 days
      : this.defaultTokenExpiration; // 24 hours

    // Generate token
    const token = this.generateToken(user.id, user.username, expiresIn);
    const expiresAt = this.getExpirationDate(expiresIn);

    return {
      token,
      expiresAt,
      userId: user.id,
    };
  }

  /**
   * Validate and decode a JWT token.
   * 
   * @param token - JWT token string to validate
   * @returns Decoded token payload with user information
   * @throws Error if token is invalid, expired, or malformed
   * 
   * **Validates: Requirement 2.4**
   */
  async validateToken(token: string): Promise<TokenPayload> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as TokenPayload;
      
      // Verify the token has required fields
      if (!decoded.userId || !decoded.username) {
        throw new Error('Invalid token payload');
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token has expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      } else {
        throw error;
      }
    }
  }

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
  private generateToken(userId: string, username: string, expiresIn: string): string {
    const payload = {
      userId,
      username,
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
    });
  }

  /**
   * Calculate the expiration date for a given duration string.
   * 
   * @param expiresIn - Duration string (e.g., '24h', '30d')
   * @returns Date object representing the expiration time
   */
  private getExpirationDate(expiresIn: string): Date {
    const now = Date.now();
    const match = expiresIn.match(/^(\d+)([hdwmy])$/);
    
    if (!match) {
      throw new Error(`Invalid expiration format: ${expiresIn}`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    let milliseconds = 0;
    switch (unit) {
      case 'h':
        milliseconds = value * 60 * 60 * 1000;
        break;
      case 'd':
        milliseconds = value * 24 * 60 * 60 * 1000;
        break;
      case 'w':
        milliseconds = value * 7 * 24 * 60 * 60 * 1000;
        break;
      case 'm':
        milliseconds = value * 30 * 24 * 60 * 60 * 1000;
        break;
      case 'y':
        milliseconds = value * 365 * 24 * 60 * 60 * 1000;
        break;
      default:
        throw new Error(`Unsupported time unit: ${unit}`);
    }

    return new Date(now + milliseconds);
  }
}
