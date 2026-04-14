/**
 * SessionManager - Manages user session persistence across page reloads
 * 
 * Features:
 * - Stores session data in localStorage with base64 encoding
 * - Validates session expiration
 * - Supports rememberMe flag (24h default, 30d with rememberMe)
 * - Provides clean API for session lifecycle management
 * 
 * Requirements: 2.7, 8.1, 8.2, 8.3, 8.4, 8.8
 */

export interface SessionData {
  token: string;
  userId: string;
  username: string;
  expiresAt: string;
}

export class SessionManager {
  private static readonly STORAGE_KEY = 'waveline_session';
  private static readonly DEFAULT_EXPIRATION_HOURS = 24;
  private static readonly REMEMBER_ME_EXPIRATION_DAYS = 30;

  /**
   * Save session data to localStorage with base64 encoding
   * 
   * @param data - Session data to store
   * @param rememberMe - If true, extends session to 30 days; otherwise 24 hours
   * 
   * Requirements: 2.7, 8.1, 8.8
   */
  saveSession(data: SessionData, rememberMe: boolean): void {
    // Calculate expiration time based on rememberMe flag
    const expirationMs = rememberMe
      ? SessionManager.REMEMBER_ME_EXPIRATION_DAYS * 24 * 60 * 60 * 1000
      : SessionManager.DEFAULT_EXPIRATION_HOURS * 60 * 60 * 1000;
    
    const expiresAt = new Date(Date.now() + expirationMs).toISOString();

    // Create session data with calculated expiration
    const sessionData: SessionData = {
      ...data,
      expiresAt,
    };

    // Encode session data to base64 for basic obfuscation
    const encoded = this.encodeSession(sessionData);

    // Store in localStorage
    try {
      localStorage.setItem(SessionManager.STORAGE_KEY, encoded);
    } catch (error) {
      console.error('Failed to save session to localStorage:', error);
      throw new Error('Unable to save session. Please check your browser settings.');
    }
  }

  /**
   * Load session data from localStorage with validation
   * 
   * Returns null if:
   * - No session exists
   * - Session data is invalid
   * - Session has expired
   * 
   * Requirements: 8.2, 8.3
   */
  loadSession(): SessionData | null {
    try {
      const encoded = localStorage.getItem(SessionManager.STORAGE_KEY);
      
      if (!encoded) {
        return null;
      }

      // Decode session data from base64
      const sessionData = this.decodeSession(encoded);

      // Validate session structure
      if (!this.isValidSessionData(sessionData)) {
        console.warn('Invalid session data structure, clearing session');
        this.clearSession();
        return null;
      }

      // Check if session has expired
      if (!this.isSessionValidInternal(sessionData)) {
        console.info('Session has expired, clearing session');
        this.clearSession();
        return null;
      }

      return sessionData;
    } catch (error) {
      console.error('Failed to load session from localStorage:', error);
      this.clearSession();
      return null;
    }
  }

  /**
   * Clear session data from localStorage
   * 
   * Requirements: 8.8
   */
  clearSession(): void {
    try {
      localStorage.removeItem(SessionManager.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear session from localStorage:', error);
    }
  }

  /**
   * Check if the current session is valid (not expired)
   * 
   * Requirements: 8.3
   */
  isSessionValid(): boolean {
    const session = this.loadSession();
    return session !== null && this.isSessionValidInternal(session);
  }

  /**
   * Get the authentication token from the current session
   * 
   * Returns null if no valid session exists
   */
  getToken(): string | null {
    const session = this.loadSession();
    return session ? session.token : null;
  }

  /**
   * Encode session data to base64
   * 
   * @private
   */
  private encodeSession(data: SessionData): string {
    const json = JSON.stringify(data);
    return btoa(json);
  }

  /**
   * Decode session data from base64
   * 
   * @private
   */
  private decodeSession(encoded: string): SessionData {
    const json = atob(encoded);
    return JSON.parse(json);
  }

  /**
   * Validate that session data has all required fields
   * 
   * @private
   */
  private isValidSessionData(data: unknown): data is SessionData {
    if (!data || typeof data !== 'object') {
      return false;
    }

    const session = data as Record<string, unknown>;

    return (
      typeof session.token === 'string' &&
      typeof session.userId === 'string' &&
      typeof session.username === 'string' &&
      typeof session.expiresAt === 'string'
    );
  }

  /**
   * Check if session data has expired
   * 
   * @private
   */
  private isSessionValidInternal(data: SessionData): boolean {
    const expiresAt = new Date(data.expiresAt);
    const now = new Date();
    return expiresAt > now;
  }
}
