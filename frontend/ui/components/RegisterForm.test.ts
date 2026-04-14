/**
 * RegisterForm - Unit tests
 * 
 * Tests:
 * - Component rendering
 * - Form validation (username and password)
 * - Password strength indicator
 * - Successful registration flow
 * - Error handling (username taken, weak password, network errors)
 * - Loading state management
 * - Session and state management integration
 * 
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RegisterForm } from './RegisterForm';
import { AuthApi } from '../../api/AuthApi';
import { SessionManager } from '../../app/SessionManager';
import { StateManager } from '../../app/StateManager';

describe('RegisterForm', () => {
  let container: HTMLElement;
  let authApi: AuthApi;
  let sessionManager: SessionManager;
  let stateManager: StateManager;
  let onSuccessMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Create container
    container = document.createElement('div');
    document.body.appendChild(container);

    // Create mocks
    authApi = {
      register: vi.fn(),
    } as unknown as AuthApi;

    sessionManager = {
      saveSession: vi.fn(),
    } as unknown as SessionManager;

    stateManager = {
      setUser: vi.fn(),
    } as unknown as StateManager;

    onSuccessMock = vi.fn();
  });

  afterEach(() => {
    // Clean up
    if (container && container.parentNode) {
      document.body.removeChild(container);
    }
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render registration form with all fields', () => {
      new RegisterForm(container, authApi, sessionManager, stateManager);

      expect(container.querySelector('#register-form')).toBeTruthy();
      expect(container.querySelector('#username')).toBeTruthy();
      expect(container.querySelector('#password')).toBeTruthy();
      expect(container.querySelector('button[type="submit"]')).toBeTruthy();
    });

    it('should display title and subtitle', () => {
      new RegisterForm(container, authApi, sessionManager, stateManager);

      expect(container.textContent).toContain('Join Waveline');
      expect(container.textContent).toContain('Create your account');
    });

    it('should display password requirements hint', () => {
      new RegisterForm(container, authApi, sessionManager, stateManager);

      expect(container.textContent).toContain('Minimum 8 characters');
      expect(container.textContent).toContain('uppercase, lowercase, and number');
    });

    it('should display link to login page', () => {
      new RegisterForm(container, authApi, sessionManager, stateManager);

      const loginLink = container.querySelector('#login-link');
      expect(loginLink).toBeTruthy();
      expect(loginLink?.textContent).toContain('Sign in here');
    });
  });

  describe('Username Validation', () => {
    it('should show error when username is empty', async () => {
      new RegisterForm(container, authApi, sessionManager, stateManager);

      const form = container.querySelector('#register-form') as HTMLFormElement;
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      
      form.dispatchEvent(submitEvent);
      
      // Wait for re-render
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(container.textContent).toContain('Username is required');
    });

    it('should show error when username is too short', async () => {
      new RegisterForm(container, authApi, sessionManager, stateManager);

      const usernameInput = container.querySelector('#username') as HTMLInputElement;
      usernameInput.value = 'ab';
      usernameInput.dispatchEvent(new Event('input', { bubbles: true }));

      const form = container.querySelector('#register-form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(container.textContent).toContain('at least 3 characters');
    });

    it('should show error when username is too long', async () => {
      new RegisterForm(container, authApi, sessionManager, stateManager);

      const usernameInput = container.querySelector('#username') as HTMLInputElement;
      usernameInput.value = 'a'.repeat(31);
      usernameInput.dispatchEvent(new Event('input', { bubbles: true }));

      const form = container.querySelector('#register-form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(container.textContent).toContain('at most 30 characters');
    });

    it('should show error when username contains invalid characters', async () => {
      new RegisterForm(container, authApi, sessionManager, stateManager);

      const usernameInput = container.querySelector('#username') as HTMLInputElement;
      usernameInput.value = 'user@name';
      usernameInput.dispatchEvent(new Event('input', { bubbles: true }));

      const form = container.querySelector('#register-form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(container.textContent).toContain('letters, numbers, and underscores');
    });

    it('should accept valid username', async () => {
      vi.mocked(authApi.register).mockResolvedValue({
        token: 'test-token',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        user: { id: '1', username: 'validuser' },
      });

      new RegisterForm(container, authApi, sessionManager, stateManager);

      const usernameInput = container.querySelector('#username') as HTMLInputElement;
      const passwordInput = container.querySelector('#password') as HTMLInputElement;
      
      usernameInput.value = 'validuser';
      usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      passwordInput.value = 'Password123';
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));

      const form = container.querySelector('#register-form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(authApi.register).toHaveBeenCalledWith('validuser', 'Password123');
    });
  });

  describe('Password Validation', () => {
    it('should show error when password is empty', async () => {
      new RegisterForm(container, authApi, sessionManager, stateManager);

      const usernameInput = container.querySelector('#username') as HTMLInputElement;
      usernameInput.value = 'testuser';
      usernameInput.dispatchEvent(new Event('input', { bubbles: true }));

      const form = container.querySelector('#register-form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(container.textContent).toContain('Password is required');
    });

    it('should show error when password is too short', async () => {
      new RegisterForm(container, authApi, sessionManager, stateManager);

      const usernameInput = container.querySelector('#username') as HTMLInputElement;
      const passwordInput = container.querySelector('#password') as HTMLInputElement;
      
      usernameInput.value = 'testuser';
      usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      passwordInput.value = 'Pass1';
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));

      const form = container.querySelector('#register-form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(container.textContent).toContain('at least 8 characters');
    });

    it('should show error when password lacks uppercase letter', async () => {
      new RegisterForm(container, authApi, sessionManager, stateManager);

      const usernameInput = container.querySelector('#username') as HTMLInputElement;
      const passwordInput = container.querySelector('#password') as HTMLInputElement;
      
      usernameInput.value = 'testuser';
      usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      passwordInput.value = 'password123';
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));

      const form = container.querySelector('#register-form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(container.textContent).toContain('uppercase letter');
    });

    it('should show error when password lacks lowercase letter', async () => {
      new RegisterForm(container, authApi, sessionManager, stateManager);

      const usernameInput = container.querySelector('#username') as HTMLInputElement;
      const passwordInput = container.querySelector('#password') as HTMLInputElement;
      
      usernameInput.value = 'testuser';
      usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      passwordInput.value = 'PASSWORD123';
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));

      const form = container.querySelector('#register-form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(container.textContent).toContain('lowercase letter');
    });

    it('should show error when password lacks number', async () => {
      new RegisterForm(container, authApi, sessionManager, stateManager);

      const usernameInput = container.querySelector('#username') as HTMLInputElement;
      const passwordInput = container.querySelector('#password') as HTMLInputElement;
      
      usernameInput.value = 'testuser';
      usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      passwordInput.value = 'PasswordABC';
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));

      const form = container.querySelector('#register-form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(container.textContent).toContain('at least one number');
    });
  });

  describe('Password Strength Indicator', () => {
    it('should show weak strength for simple password', async () => {
      new RegisterForm(container, authApi, sessionManager, stateManager);

      const passwordInput = container.querySelector('#password') as HTMLInputElement;
      // Password with only lowercase, short (< 8 chars) = weak (score: 1)
      passwordInput.value = 'abcdefg';
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));

      await new Promise(resolve => setTimeout(resolve, 50));

      const strengthElement = container.querySelector('.password-strength');
      expect(strengthElement).toBeTruthy();
      expect(container.querySelector('.password-strength-weak')).toBeTruthy();
      expect(container.textContent).toContain('Weak');
    });

    it('should show medium strength for moderate password', async () => {
      new RegisterForm(container, authApi, sessionManager, stateManager);

      const passwordInput = container.querySelector('#password') as HTMLInputElement;
      passwordInput.value = 'Password123';
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(container.querySelector('.password-strength-medium')).toBeTruthy();
      expect(container.textContent).toContain('Medium');
    });

    it('should show strong strength for complex password', async () => {
      new RegisterForm(container, authApi, sessionManager, stateManager);

      const passwordInput = container.querySelector('#password') as HTMLInputElement;
      passwordInput.value = 'MyStr0ng!Pass123';
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(container.querySelector('.password-strength-strong')).toBeTruthy();
      expect(container.textContent).toContain('Strong');
    });

    it('should not show strength indicator when password is empty', () => {
      new RegisterForm(container, authApi, sessionManager, stateManager);

      expect(container.querySelector('.password-strength')).toBeFalsy();
    });
  });

  describe('Successful Registration', () => {
    it('should call AuthApi.register with correct credentials', async () => {
      vi.mocked(authApi.register).mockResolvedValue({
        token: 'test-token',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        user: { id: '1', username: 'newuser' },
      });

      new RegisterForm(container, authApi, sessionManager, stateManager);

      const usernameInput = container.querySelector('#username') as HTMLInputElement;
      const passwordInput = container.querySelector('#password') as HTMLInputElement;
      
      usernameInput.value = 'newuser';
      usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      passwordInput.value = 'SecurePass123';
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));

      const form = container.querySelector('#register-form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(authApi.register).toHaveBeenCalledWith('newuser', 'SecurePass123');
    });

    it('should save session after successful registration', async () => {
      const mockResponse = {
        token: 'test-token',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        user: { id: '1', username: 'newuser' },
      };

      vi.mocked(authApi.register).mockResolvedValue(mockResponse);

      new RegisterForm(container, authApi, sessionManager, stateManager);

      const usernameInput = container.querySelector('#username') as HTMLInputElement;
      const passwordInput = container.querySelector('#password') as HTMLInputElement;
      
      usernameInput.value = 'newuser';
      usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      passwordInput.value = 'SecurePass123';
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));

      const form = container.querySelector('#register-form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(sessionManager.saveSession).toHaveBeenCalledWith(
        {
          token: 'test-token',
          userId: '1',
          username: 'newuser',
          expiresAt: mockResponse.expiresAt,
        },
        false
      );
    });

    it('should update state manager after successful registration', async () => {
      vi.mocked(authApi.register).mockResolvedValue({
        token: 'test-token',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        user: { id: '1', username: 'newuser' },
      });

      new RegisterForm(container, authApi, sessionManager, stateManager);

      const usernameInput = container.querySelector('#username') as HTMLInputElement;
      const passwordInput = container.querySelector('#password') as HTMLInputElement;
      
      usernameInput.value = 'newuser';
      usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      passwordInput.value = 'SecurePass123';
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));

      const form = container.querySelector('#register-form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(stateManager.setUser).toHaveBeenCalledWith({
        id: '1',
        username: 'newuser',
      });
    });

    it('should call onSuccess callback after successful registration', async () => {
      vi.mocked(authApi.register).mockResolvedValue({
        token: 'test-token',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        user: { id: '1', username: 'newuser' },
      });

      new RegisterForm(container, authApi, sessionManager, stateManager, onSuccessMock);

      const usernameInput = container.querySelector('#username') as HTMLInputElement;
      const passwordInput = container.querySelector('#password') as HTMLInputElement;
      
      usernameInput.value = 'newuser';
      usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      passwordInput.value = 'SecurePass123';
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));

      const form = container.querySelector('#register-form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(onSuccessMock).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should display error when username is already taken', async () => {
      vi.mocked(authApi.register).mockRejectedValue({
        statusCode: 409,
        message: 'Username already exists',
      });

      new RegisterForm(container, authApi, sessionManager, stateManager);

      const usernameInput = container.querySelector('#username') as HTMLInputElement;
      const passwordInput = container.querySelector('#password') as HTMLInputElement;
      
      usernameInput.value = 'existinguser';
      usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      passwordInput.value = 'SecurePass123';
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));

      const form = container.querySelector('#register-form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(container.textContent).toContain('already taken');
    });

    it('should display error for weak password from server', async () => {
      vi.mocked(authApi.register).mockRejectedValue({
        statusCode: 400,
        message: 'Password is too weak',
      });

      new RegisterForm(container, authApi, sessionManager, stateManager);

      const usernameInput = container.querySelector('#username') as HTMLInputElement;
      const passwordInput = container.querySelector('#password') as HTMLInputElement;
      
      usernameInput.value = 'newuser';
      usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      passwordInput.value = 'WeakPass1';
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));

      const form = container.querySelector('#register-form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(container.textContent).toContain('too weak');
    });

    it('should display network error', async () => {
      vi.mocked(authApi.register).mockRejectedValue({
        statusCode: 0,
        message: 'Network error',
      });

      new RegisterForm(container, authApi, sessionManager, stateManager);

      const usernameInput = container.querySelector('#username') as HTMLInputElement;
      const passwordInput = container.querySelector('#password') as HTMLInputElement;
      
      usernameInput.value = 'newuser';
      usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      passwordInput.value = 'SecurePass123';
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));

      const form = container.querySelector('#register-form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(container.textContent).toContain('Unable to connect to server');
    });

    it('should display generic error for unexpected errors', async () => {
      vi.mocked(authApi.register).mockRejectedValue(new Error('Unexpected error'));

      new RegisterForm(container, authApi, sessionManager, stateManager);

      const usernameInput = container.querySelector('#username') as HTMLInputElement;
      const passwordInput = container.querySelector('#password') as HTMLInputElement;
      
      usernameInput.value = 'newuser';
      usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      passwordInput.value = 'SecurePass123';
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));

      const form = container.querySelector('#register-form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(container.textContent).toContain('unexpected error');
    });
  });

  describe('Loading State', () => {
    it('should disable form inputs during submission', async () => {
      vi.mocked(authApi.register).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          token: 'test-token',
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
          user: { id: '1', username: 'newuser' },
        }), 100))
      );

      new RegisterForm(container, authApi, sessionManager, stateManager);

      const usernameInput = container.querySelector('#username') as HTMLInputElement;
      const passwordInput = container.querySelector('#password') as HTMLInputElement;
      
      usernameInput.value = 'newuser';
      usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      passwordInput.value = 'SecurePass123';
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));

      const form = container.querySelector('#register-form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      
      await new Promise(resolve => setTimeout(resolve, 10));

      const submitButton = container.querySelector('button[type="submit"]') as HTMLButtonElement;
      expect(submitButton.disabled).toBe(true);
      expect(submitButton.textContent).toContain('Creating account');
    });
  });

  describe('Error Clearing', () => {
    it('should clear username error when user types', async () => {
      new RegisterForm(container, authApi, sessionManager, stateManager);

      // Trigger validation error
      const form = container.querySelector('#register-form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(container.textContent).toContain('Username is required');

      // Type in username field
      const usernameInput = container.querySelector('#username') as HTMLInputElement;
      usernameInput.value = 'newuser';
      usernameInput.dispatchEvent(new Event('input', { bubbles: true }));

      await new Promise(resolve => setTimeout(resolve, 0));
      expect(container.textContent).not.toContain('Username is required');
    });

    it('should clear password error when user types', async () => {
      new RegisterForm(container, authApi, sessionManager, stateManager);

      const usernameInput = container.querySelector('#username') as HTMLInputElement;
      usernameInput.value = 'testuser';
      usernameInput.dispatchEvent(new Event('input', { bubbles: true }));

      // Trigger validation error
      const form = container.querySelector('#register-form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(container.textContent).toContain('Password is required');

      // Type in password field
      const passwordInput = container.querySelector('#password') as HTMLInputElement;
      passwordInput.value = 'P';
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));

      await new Promise(resolve => setTimeout(resolve, 0));
      expect(container.textContent).not.toContain('Password is required');
    });
  });
});
