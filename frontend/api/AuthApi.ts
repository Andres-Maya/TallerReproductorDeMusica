/**
 * AuthApi - Authentication API client
 * 
 * Features:
 * - User registration
 * - User login with optional "remember me"
 * - User logout
 * - Get current user information
 * - Typed responses matching backend DTOs
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */

import { ApiClient } from './ApiClient';

/**
 * Authentication request/response types
 */
export interface RegisterRequest {
  username: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: {
    id: string;
    username: string;
  };
}

export interface UserInfo {
  id: string;
  username: string;
  createdAt: string;
}

/**
 * AuthApi - Handles authentication-related API calls
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */
export class AuthApi {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * Register a new user account
   * 
   * @param username - Username (3-30 characters, alphanumeric + underscore)
   * @param password - Password (min 8 characters)
   * @returns Authentication response with token and user info
   * 
   * Requirements: 2.1, 2.2
   */
  async register(username: string, password: string): Promise<AuthResponse> {
    const payload: RegisterRequest = {
      username,
      password,
    };

    return this.apiClient.post<AuthResponse>('/api/v1/auth/register', payload);
  }

  /**
   * Login with existing credentials
   * 
   * @param username - Username
   * @param password - Password
   * @param rememberMe - If true, extends session to 30 days; otherwise 24 hours
   * @returns Authentication response with token and user info
   * 
   * Requirements: 2.4
   */
  async login(
    username: string,
    password: string,
    rememberMe: boolean = false
  ): Promise<AuthResponse> {
    const payload: LoginRequest = {
      username,
      password,
      rememberMe,
    };

    return this.apiClient.post<AuthResponse>('/api/v1/auth/login', payload);
  }

  /**
   * Logout and invalidate current session
   * 
   * Requirements: 2.8
   */
  async logout(): Promise<void> {
    await this.apiClient.post<void>('/api/v1/auth/logout', {});
  }

  /**
   * Get current authenticated user information
   * 
   * @returns User information
   * 
   * Requirements: 2.4
   */
  async getCurrentUser(): Promise<UserInfo> {
    return this.apiClient.get<UserInfo>('/api/v1/auth/me');
  }
}
