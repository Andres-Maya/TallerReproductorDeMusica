/**
 * LoginForm - Unit Tests
 * 
 * Tests for the LoginForm component covering:
 * - Component rendering
 * - Form validation
 * - Successful login flow
 * - Error handling
 * - State management integration
 * 
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LoginForm } from './LoginForm';
import { AuthApi } from '../../api/AuthApi';
import { SessionManager } from '../../app/SessionManager';
import { StateManager } from '../../app/StateManager';
import { ApiClient } from '../../api/ApiClient';

describe('LoginForm', () => {
  let container: HTMLElement;
  let authApi: AuthApi;
  let sessionManager: SessionManager;
  let stateManager: StateManager;
  let apiClient: ApiClient;

  beforeEach(() => {
    // Create container
    container = document.createElement('div');
    document.body.appendChild(container);

    // Create instances
    apiClient = new ApiClient('http://localhost:3000');
    authApi = new AuthApi(apiClient);
    sessionManager = new SessionManager();
    stateManager = new StateManager();
  });

  afterEach(() => {
    // Clean up
    if (container && container.parentNode) {
      document.body.removeChild(container);
    }
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render login form with all required fields', () => {
      new LoginForm(container, authApi, sessionManager, stateManager);

      expect(container.querySelector('#username')).toBeTruthy();
      expect(container.querySelector('#password')).toBeTruthy();
      expect(container.querySelector('#rememberMe')).toBeTruthy();
      expect(container.querySelector('button[type="submit"]')).toBeTruthy();
    });

    it('should render form title and subtitle', () => {
      new LoginForm(container, authApi, sessionManager, stateManager);

      const title = container.querySelector('.login-form-title');
      const subtitle = container.querySelector('.login-form-subtitle');

      expect(title?.textContent).toContain('Welcome to Waveline');
      expect(subtitle?.textContent).toContain('Sign in to access your playlists');
    });

    it('should render register link', () => {
      new LoginForm(container, authApi, sessionManager, stateManager);

      const registerLink = container.querySelector('#register-link');
      expect(registerLink).toBeTruthy();
      expect(registerLink?.textContent).toContain('Register here');
    });
  });

  describe('Validation', () => {
    it('should show error when username is empty', async () => {
      new LoginForm(container, authApi, sessionManager, stateManager);

      const form = container.querySelector('#login-form') as HTMLFormElement;
      const passwordInput = container.querySelector('#password') as HTMLInputElement;

      // Set password but leave username empty
      passwordInput.value = 'password123';

      // Submit form
      form.dispatchEvent(new Event('submit'));

      // Wait for validation
      await new Promise(resolve => setTimeout(resolve, 10));

      const usernameError = container.querySelector('.form-error');
      expect(usernameError?.textContent).toContain('Username is required');
    });

    it('should show error when password is empty', async () => {
      new LoginForm(container, authApi, sessionManager, stateManager);

      const form = container.querySelector('#login-form') as HTMLFormElement;
      const usernameInput = container.querySelector('#username') as HTMLInputElement;

      // Set username but leave password empty
      usernameInput.value = 'testuser';

      // Submit form
      form.dispatchEvent(new Event('submit'));

      // Wait for validation
      await new Promise(resolve => setTimeout(resolve, 10));

      const errors = container.querySelectorAll('.form-error');
      const errorTexts = Array.from(errors).map(e => e.textContent);
      expect(errorTexts.some(text => text?.includes('Password is required'))).toBe(true);
    });

    it('should clear field errors on input change', async () => {
      new LoginForm(container, authApi, sessionManager, stateManager);

      const form = container.querySelector('#login-form') as HTMLFormElement;
      const usernameInput = container.querySelector('#username') as HTMLInputElement;

      // Submit form to trigger validation errors
      form.dispatchEvent(new Event('submit'));
      await new Promise(resolve => setTimeout(resolve, 10));

      // Verify username error exists
      let usernameErrorDiv = container.querySelector('#username ~ .form-error');
      expect(usernameErrorDiv).toBeTruthy();
      expect(usernameErrorDiv?.textContent).toContain('Username is required');

      // Type in username field
      usernameInput.value = 'testuser';
      usernameInput.dispatchEvent(new Event('input'));

      // Wait for error to clear
      await new Promise(resolve => setTimeout(resolve, 10));

      // Username error should be cleared (but password error may still exist)
      usernameErrorDiv = container.querySelector('#username ~ .form-error');
      expect(usernameErrorDiv).toBeFalsy();
    });
  });

  describe('Login Flow', () => {
    it('should call AuthApi.login with correct credentials', async () => {
      const loginSpy = vi.spyOn(authApi, 'login').mockResolvedValue({
        token: 'test-token',
        expiresAt: '2024-12-31T23:59:59Z',
        user: {
          id: 'user-123',
          username: 'testuser',
        },
      });

      new LoginForm(container, authApi, sessionManager, stateManager);

      const form = container.querySelector('#login-form') as HTMLFormElement;
      const usernameInput = container.querySelector('#username') as HTMLInputElement;
      const passwordInput = container.querySelector('#password') as HTMLInputElement;

      // Fill in form
      usernameInput.value = 'testuser';
      passwordInput.value = 'password123';

      // Trigger input events to update internal state
      usernameInput.dispatchEvent(new Event('input'));
      passwordInput.dispatchEvent(new Event('input'));

      // Submit form
      form.dispatchEvent(new Event('submit'));

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(loginSpy).toHaveBeenCalledWith('testuser', 'password123', false);
    });

    it('should save session after successful login', async () => {
      vi.spyOn(authApi, 'login').mockResolvedValue({
        token: 'test-token',
        expiresAt: '2024-12-31T23:59:59Z',
        user: {
          id: 'user-123',
          username: 'testuser',
        },
      });

      const saveSessionSpy = vi.spyOn(sessionManager, 'saveSession');

      new LoginForm(container, authApi, sessionManager, stateManager);

      const form = container.querySelector('#login-form') as HTMLFormElement;
      const usernameInput = container.querySelector('#username') as HTMLInputElement;
      const passwordInput = container.querySelector('#password') as HTMLInputElement;

      usernameInput.value = 'testuser';
      passwordInput.value = 'password123';
      usernameInput.dispatchEvent(new Event('input'));
      passwordInput.dispatchEvent(new Event('input'));

      form.dispatchEvent(new Event('submit'));
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(saveSessionSpy).toHaveBeenCalledWith(
        {
          token: 'test-token',
          userId: 'user-123',
          username: 'testuser',
          expiresAt: '2024-12-31T23:59:59Z',
        },
        false
      );
    });

    it('should update state manager after successful login', async () => {
      vi.spyOn(authApi, 'login').mockResolvedValue({
        token: 'test-token',
        expiresAt: '2024-12-31T23:59:59Z',
        user: {
          id: 'user-123',
          username: 'testuser',
        },
      });

      const setUserSpy = vi.spyOn(stateManager, 'setUser');

      new LoginForm(container, authApi, sessionManager, stateManager);

      const form = container.querySelector('#login-form') as HTMLFormElement;
      const usernameInput = container.querySelector('#username') as HTMLInputElement;
      const passwordInput = container.querySelector('#password') as HTMLInputElement;

      usernameInput.value = 'testuser';
      passwordInput.value = 'password123';
      usernameInput.dispatchEvent(new Event('input'));
      passwordInput.dispatchEvent(new Event('input'));

      form.dispatchEvent(new Event('submit'));
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(setUserSpy).toHaveBeenCalledWith({
        id: 'user-123',
        username: 'testuser',
      });
    });

    it('should call onSuccess callback after successful login', async () => {
      vi.spyOn(authApi, 'login').mockResolvedValue({
        token: 'test-token',
        expiresAt: '2024-12-31T23:59:59Z',
        user: {
          id: 'user-123',
          username: 'testuser',
        },
      });

      const onSuccessSpy = vi.fn();

      new LoginForm(container, authApi, sessionManager, stateManager, onSuccessSpy);

      const form = container.querySelector('#login-form') as HTMLFormElement;
      const usernameInput = container.querySelector('#username') as HTMLInputElement;
      const passwordInput = container.querySelector('#password') as HTMLInputElement;

      usernameInput.value = 'testuser';
      passwordInput.value = 'password123';
      usernameInput.dispatchEvent(new Event('input'));
      passwordInput.dispatchEvent(new Event('input'));

      form.dispatchEvent(new Event('submit'));
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(onSuccessSpy).toHaveBeenCalled();
    });

    it('should handle rememberMe checkbox', async () => {
      const loginSpy = vi.spyOn(authApi, 'login').mockResolvedValue({
        token: 'test-token',
        expiresAt: '2024-12-31T23:59:59Z',
        user: {
          id: 'user-123',
          username: 'testuser',
        },
      });

      new LoginForm(container, authApi, sessionManager, stateManager);

      const form = container.querySelector('#login-form') as HTMLFormElement;
      const usernameInput = container.querySelector('#username') as HTMLInputElement;
      const passwordInput = container.querySelector('#password') as HTMLInputElement;
      const rememberMeCheckbox = container.querySelector('#rememberMe') as HTMLInputElement;

      usernameInput.value = 'testuser';
      passwordInput.value = 'password123';
      rememberMeCheckbox.checked = true;

      usernameInput.dispatchEvent(new Event('input'));
      passwordInput.dispatchEvent(new Event('input'));
      rememberMeCheckbox.dispatchEvent(new Event('change'));

      form.dispatchEvent(new Event('submit'));
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(loginSpy).toHaveBeenCalledWith('testuser', 'password123', true);
    });
  });

  describe('Error Handling', () => {
    it('should display error message on invalid credentials', async () => {
      vi.spyOn(authApi, 'login').mockRejectedValue({
        statusCode: 401,
        message: 'Invalid credentials',
      });

      new LoginForm(container, authApi, sessionManager, stateManager);

      const form = container.querySelector('#login-form') as HTMLFormElement;
      const usernameInput = container.querySelector('#username') as HTMLInputElement;
      const passwordInput = container.querySelector('#password') as HTMLInputElement;

      usernameInput.value = 'testuser';
      passwordInput.value = 'wrongpassword';
      usernameInput.dispatchEvent(new Event('input'));
      passwordInput.dispatchEvent(new Event('input'));

      form.dispatchEvent(new Event('submit'));
      await new Promise(resolve => setTimeout(resolve, 50));

      const errorMessage = container.querySelector('.form-error-general');
      expect(errorMessage?.textContent).toContain('Invalid username or password');
    });

    it('should display connection error on network failure', async () => {
      vi.spyOn(authApi, 'login').mockRejectedValue({
        statusCode: 0,
        message: 'Network error',
      });

      new LoginForm(container, authApi, sessionManager, stateManager);

      const form = container.querySelector('#login-form') as HTMLFormElement;
      const usernameInput = container.querySelector('#username') as HTMLInputElement;
      const passwordInput = container.querySelector('#password') as HTMLInputElement;

      usernameInput.value = 'testuser';
      passwordInput.value = 'password123';
      usernameInput.dispatchEvent(new Event('input'));
      passwordInput.dispatchEvent(new Event('input'));

      form.dispatchEvent(new Event('submit'));
      await new Promise(resolve => setTimeout(resolve, 50));

      const errorMessage = container.querySelector('.form-error-general');
      expect(errorMessage?.textContent).toContain('Unable to connect to server');
    });

    it('should disable form inputs while loading', async () => {
      // Create a promise that we can control
      let resolveLogin: (value: any) => void;
      const loginPromise = new Promise((resolve) => {
        resolveLogin = resolve;
      });

      vi.spyOn(authApi, 'login').mockReturnValue(loginPromise as any);

      new LoginForm(container, authApi, sessionManager, stateManager);

      const form = container.querySelector('#login-form') as HTMLFormElement;
      const usernameInput = container.querySelector('#username') as HTMLInputElement;
      const passwordInput = container.querySelector('#password') as HTMLInputElement;
      const submitButton = container.querySelector('button[type="submit"]') as HTMLButtonElement;

      usernameInput.value = 'testuser';
      passwordInput.value = 'password123';
      usernameInput.dispatchEvent(new Event('input'));
      passwordInput.dispatchEvent(new Event('input'));

      form.dispatchEvent(new Event('submit'));
      await new Promise(resolve => setTimeout(resolve, 10));

      // Check that inputs are disabled during loading
      const disabledUsername = container.querySelector('#username') as HTMLInputElement;
      const disabledPassword = container.querySelector('#password') as HTMLInputElement;
      const disabledButton = container.querySelector('button[type="submit"]') as HTMLButtonElement;

      expect(disabledUsername.disabled).toBe(true);
      expect(disabledPassword.disabled).toBe(true);
      expect(disabledButton.disabled).toBe(true);
      expect(disabledButton.textContent).toContain('Signing in...');

      // Resolve the login
      resolveLogin!({
        token: 'test-token',
        expiresAt: '2024-12-31T23:59:59Z',
        user: { id: 'user-123', username: 'testuser' },
      });
    });
  });

  describe('XSS Protection', () => {
    it('should escape HTML in error messages', async () => {
      vi.spyOn(authApi, 'login').mockRejectedValue({
        statusCode: 400,
        message: '<script>alert("xss")</script>',
      });

      new LoginForm(container, authApi, sessionManager, stateManager);

      const form = container.querySelector('#login-form') as HTMLFormElement;
      const usernameInput = container.querySelector('#username') as HTMLInputElement;
      const passwordInput = container.querySelector('#password') as HTMLInputElement;

      usernameInput.value = 'testuser';
      passwordInput.value = 'password123';
      usernameInput.dispatchEvent(new Event('input'));
      passwordInput.dispatchEvent(new Event('input'));

      form.dispatchEvent(new Event('submit'));
      await new Promise(resolve => setTimeout(resolve, 50));

      const errorMessage = container.querySelector('.form-error-general');
      expect(errorMessage?.innerHTML).not.toContain('<script>');
      expect(errorMessage?.textContent).toContain('<script>alert("xss")</script>');
    });
  });
});
