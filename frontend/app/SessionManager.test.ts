/**
 * Unit tests for SessionManager
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SessionManager, SessionData } from './SessionManager';

describe('SessionManager', () => {
  let sessionManager: SessionManager;
  let localStorageMock: Record<string, string>;

  beforeEach(() => {
    // Mock localStorage
    localStorageMock = {};
    
    global.localStorage = {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
      length: 0,
      key: vi.fn(() => null),
    } as Storage;

    sessionManager = new SessionManager();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('saveSession', () => {
    it('should save session data to localStorage with base64 encoding', () => {
      const sessionData: SessionData = {
        token: 'test-token-123',
        userId: 'user-456',
        username: 'testuser',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      sessionManager.saveSession(sessionData, false);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'waveline_session',
        expect.any(String)
      );

      // Verify data is base64 encoded
      const storedValue = localStorageMock['waveline_session'];
      expect(storedValue).toBeTruthy();
      
      // Decode and verify
      const decoded = JSON.parse(atob(storedValue));
      expect(decoded.token).toBe(sessionData.token);
      expect(decoded.userId).toBe(sessionData.userId);
      expect(decoded.username).toBe(sessionData.username);
    });

    it('should set expiration to 24 hours when rememberMe is false', () => {
      const sessionData: SessionData = {
        token: 'test-token',
        userId: 'user-id',
        username: 'testuser',
        expiresAt: new Date().toISOString(),
      };

      const beforeSave = Date.now();
      sessionManager.saveSession(sessionData, false);
      const afterSave = Date.now();

      const storedValue = localStorageMock['waveline_session'];
      const decoded = JSON.parse(atob(storedValue));
      const expiresAt = new Date(decoded.expiresAt).getTime();

      // Should expire in approximately 24 hours
      const expectedExpiration = beforeSave + 24 * 60 * 60 * 1000;
      expect(expiresAt).toBeGreaterThanOrEqual(expectedExpiration);
      expect(expiresAt).toBeLessThanOrEqual(afterSave + 24 * 60 * 60 * 1000);
    });

    it('should set expiration to 30 days when rememberMe is true', () => {
      const sessionData: SessionData = {
        token: 'test-token',
        userId: 'user-id',
        username: 'testuser',
        expiresAt: new Date().toISOString(),
      };

      const beforeSave = Date.now();
      sessionManager.saveSession(sessionData, true);
      const afterSave = Date.now();

      const storedValue = localStorageMock['waveline_session'];
      const decoded = JSON.parse(atob(storedValue));
      const expiresAt = new Date(decoded.expiresAt).getTime();

      // Should expire in approximately 30 days
      const expectedExpiration = beforeSave + 30 * 24 * 60 * 60 * 1000;
      expect(expiresAt).toBeGreaterThanOrEqual(expectedExpiration);
      expect(expiresAt).toBeLessThanOrEqual(afterSave + 30 * 24 * 60 * 60 * 1000);
    });
  });

  describe('loadSession', () => {
    it('should load and decode valid session data', () => {
      const sessionData: SessionData = {
        token: 'test-token-123',
        userId: 'user-456',
        username: 'testuser',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      // Manually encode and store
      const encoded = btoa(JSON.stringify(sessionData));
      localStorageMock['waveline_session'] = encoded;

      const loaded = sessionManager.loadSession();

      expect(loaded).toEqual(sessionData);
    });

    it('should return null when no session exists', () => {
      const loaded = sessionManager.loadSession();
      expect(loaded).toBeNull();
    });

    it('should return null and clear session when data is invalid', () => {
      // Store invalid base64 data
      localStorageMock['waveline_session'] = 'invalid-base64!!!';

      const loaded = sessionManager.loadSession();

      expect(loaded).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith('waveline_session');
    });

    it('should return null and clear session when session structure is invalid', () => {
      const invalidData = { token: 'test', userId: 'user' }; // Missing fields
      const encoded = btoa(JSON.stringify(invalidData));
      localStorageMock['waveline_session'] = encoded;

      const loaded = sessionManager.loadSession();

      expect(loaded).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith('waveline_session');
    });

    it('should return null and clear session when session has expired', () => {
      const expiredSession: SessionData = {
        token: 'test-token',
        userId: 'user-id',
        username: 'testuser',
        expiresAt: new Date(Date.now() - 1000).toISOString(), // Expired 1 second ago
      };

      const encoded = btoa(JSON.stringify(expiredSession));
      localStorageMock['waveline_session'] = encoded;

      const loaded = sessionManager.loadSession();

      expect(loaded).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith('waveline_session');
    });
  });

  describe('clearSession', () => {
    it('should remove session data from localStorage', () => {
      localStorageMock['waveline_session'] = 'some-data';

      sessionManager.clearSession();

      expect(localStorage.removeItem).toHaveBeenCalledWith('waveline_session');
      expect(localStorageMock['waveline_session']).toBeUndefined();
    });
  });

  describe('isSessionValid', () => {
    it('should return true when valid session exists', () => {
      const sessionData: SessionData = {
        token: 'test-token',
        userId: 'user-id',
        username: 'testuser',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      const encoded = btoa(JSON.stringify(sessionData));
      localStorageMock['waveline_session'] = encoded;

      expect(sessionManager.isSessionValid()).toBe(true);
    });

    it('should return false when no session exists', () => {
      expect(sessionManager.isSessionValid()).toBe(false);
    });

    it('should return false when session has expired', () => {
      const expiredSession: SessionData = {
        token: 'test-token',
        userId: 'user-id',
        username: 'testuser',
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      };

      const encoded = btoa(JSON.stringify(expiredSession));
      localStorageMock['waveline_session'] = encoded;

      expect(sessionManager.isSessionValid()).toBe(false);
    });
  });

  describe('getToken', () => {
    it('should return token from valid session', () => {
      const sessionData: SessionData = {
        token: 'test-token-123',
        userId: 'user-id',
        username: 'testuser',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      const encoded = btoa(JSON.stringify(sessionData));
      localStorageMock['waveline_session'] = encoded;

      expect(sessionManager.getToken()).toBe('test-token-123');
    });

    it('should return null when no session exists', () => {
      expect(sessionManager.getToken()).toBeNull();
    });

    it('should return null when session has expired', () => {
      const expiredSession: SessionData = {
        token: 'test-token',
        userId: 'user-id',
        username: 'testuser',
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      };

      const encoded = btoa(JSON.stringify(expiredSession));
      localStorageMock['waveline_session'] = encoded;

      expect(sessionManager.getToken()).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle localStorage errors gracefully when saving', () => {
      // Mock localStorage.setItem to throw an error
      vi.mocked(localStorage.setItem).mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      const sessionData: SessionData = {
        token: 'test-token',
        userId: 'user-id',
        username: 'testuser',
        expiresAt: new Date().toISOString(),
      };

      expect(() => sessionManager.saveSession(sessionData, false)).toThrow(
        'Unable to save session'
      );
    });

    it('should handle malformed JSON in localStorage', () => {
      // Store valid base64 but invalid JSON
      localStorageMock['waveline_session'] = btoa('not valid json{');

      const loaded = sessionManager.loadSession();

      expect(loaded).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalled();
    });

    it('should handle session data with missing fields', () => {
      const incompleteData = {
        token: 'test-token',
        userId: 'user-id',
        // Missing username and expiresAt
      };

      const encoded = btoa(JSON.stringify(incompleteData));
      localStorageMock['waveline_session'] = encoded;

      const loaded = sessionManager.loadSession();

      expect(loaded).toBeNull();
    });
  });
});
