/**
 * LoginForm - User authentication form component
 * 
 * Features:
 * - Username and password input fields
 * - "Remember me" checkbox for extended sessions
 * - Client-side validation before submission
 * - Inline error messages for validation and API errors
 * - Loading state with disabled submit button
 * - Calls AuthApi.login() on submit
 * - Handles success: saves session, updates state, redirects to playlists
 * 
 * Requirements: 2.10, 2.11, 5.8, 5.9
 */

import { AuthApi } from '../../api/AuthApi';
import { SessionManager } from '../../app/SessionManager';
import { StateManager } from '../../app/StateManager';

/**
 * LoginForm component state
 */
interface LoginFormState {
  username: string;
  password: string;
  rememberMe: boolean;
  isLoading: boolean;
  errors: {
    username?: string;
    password?: string;
    general?: string;
  };
}

/**
 * LoginForm - Handles user authentication
 * 
 * This component renders a login form with username, password, and remember me
 * checkbox. It performs client-side validation and communicates with the backend
 * authentication API.
 * 
 * Requirements: 2.10, 2.11, 5.8, 5.9
 */
export class LoginForm {
  private container: HTMLElement;
  private authApi: AuthApi;
  private sessionManager: SessionManager;
  private stateManager: StateManager;
  private state: LoginFormState;
  private onSuccess?: () => void;

  constructor(
    container: HTMLElement,
    authApi: AuthApi,
    sessionManager: SessionManager,
    stateManager: StateManager,
    onSuccess?: () => void
  ) {
    this.container = container;
    this.authApi = authApi;
    this.sessionManager = sessionManager;
    this.stateManager = stateManager;
    this.onSuccess = onSuccess;

    // Initialize state
    this.state = {
      username: '',
      password: '',
      rememberMe: false,
      isLoading: false,
      errors: {},
    };

    this.render();
    this.attachEventListeners();
  }

  /**
   * Render the login form
   * 
   * Requirements: 2.10, 5.8
   */
  private render(): void {
    this.container.innerHTML = `
      <div class="login-form-container">
        <div class="login-form-card">
          <h2 class="login-form-title">Welcome to Waveline</h2>
          <p class="login-form-subtitle">Sign in to access your playlists</p>
          
          <form id="login-form" class="login-form" novalidate>
            ${this.state.errors.general ? `
              <div class="form-error-general">
                ${this.escapeHtml(this.state.errors.general)}
              </div>
            ` : ''}
            
            <div class="form-group">
              <label for="username" class="form-label">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                class="form-input ${this.state.errors.username ? 'form-input-error' : ''}"
                value="${this.escapeHtml(this.state.username)}"
                placeholder="Enter your username"
                autocomplete="username"
                ${this.state.isLoading ? 'disabled' : ''}
                required
              />
              ${this.state.errors.username ? `
                <div class="form-error">${this.escapeHtml(this.state.errors.username)}</div>
              ` : ''}
            </div>
            
            <div class="form-group">
              <label for="password" class="form-label">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                class="form-input ${this.state.errors.password ? 'form-input-error' : ''}"
                value="${this.escapeHtml(this.state.password)}"
                placeholder="Enter your password"
                autocomplete="current-password"
                ${this.state.isLoading ? 'disabled' : ''}
                required
              />
              ${this.state.errors.password ? `
                <div class="form-error">${this.escapeHtml(this.state.errors.password)}</div>
              ` : ''}
            </div>
            
            <div class="form-group-checkbox">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  id="rememberMe"
                  name="rememberMe"
                  class="form-checkbox"
                  ${this.state.rememberMe ? 'checked' : ''}
                  ${this.state.isLoading ? 'disabled' : ''}
                />
                <span>Remember me for 30 days</span>
              </label>
            </div>
            
            <button
              type="submit"
              class="form-submit-btn"
              ${this.state.isLoading ? 'disabled' : ''}
            >
              ${this.state.isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          
          <div class="login-form-footer">
            <p>Don't have an account? <a href="#" id="register-link">Register here</a></p>
          </div>
        </div>
      </div>
    `;

    this.addStyles();
  }

  /**
   * Attach event listeners to form elements
   * 
   * @private
   */
  private attachEventListeners(): void {
    const form = this.container.querySelector('#login-form') as HTMLFormElement;
    const usernameInput = this.container.querySelector('#username') as HTMLInputElement;
    const passwordInput = this.container.querySelector('#password') as HTMLInputElement;
    const rememberMeCheckbox = this.container.querySelector('#rememberMe') as HTMLInputElement;

    if (!form || !usernameInput || !passwordInput || !rememberMeCheckbox) {
      console.error('LoginForm: Required form elements not found');
      return;
    }

    // Form submission
    form.addEventListener('submit', (e) => this.handleSubmit(e));

    // Clear errors on input change
    usernameInput.addEventListener('input', () => {
      this.state.username = usernameInput.value;
      this.clearFieldError('username');
      this.clearFieldError('general');
    });

    passwordInput.addEventListener('input', () => {
      this.state.password = passwordInput.value;
      this.clearFieldError('password');
      this.clearFieldError('general');
    });

    rememberMeCheckbox.addEventListener('change', () => {
      this.state.rememberMe = rememberMeCheckbox.checked;
    });
  }

  /**
   * Handle form submission
   * 
   * @param event - Form submit event
   * 
   * Requirements: 2.10, 2.11, 5.8, 5.9
   */
  private async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();

    // Clear previous errors
    this.state.errors = {};

    // Validate form
    if (!this.validateForm()) {
      this.render();
      this.attachEventListeners();
      return;
    }

    // Set loading state
    this.updateState({ isLoading: true });

    try {
      // Call login API
      const response = await this.authApi.login(
        this.state.username,
        this.state.password,
        this.state.rememberMe
      );

      // Save session
      this.sessionManager.saveSession(
        {
          token: response.token,
          userId: response.user.id,
          username: response.user.username,
          expiresAt: response.expiresAt,
        },
        this.state.rememberMe
      );

      // Update state manager
      this.stateManager.setUser({
        id: response.user.id,
        username: response.user.username,
      });

      // Call success callback (redirect to playlists)
      if (this.onSuccess) {
        this.onSuccess();
      }
    } catch (error: unknown) {
      // Handle API errors
      this.handleLoginError(error);
    } finally {
      this.updateState({ isLoading: false });
    }
  }

  /**
   * Validate form inputs
   * 
   * @returns True if form is valid, false otherwise
   * 
   * Requirements: 5.8
   */
  private validateForm(): boolean {
    const errors: LoginFormState['errors'] = {};

    // Validate username
    if (!this.state.username.trim()) {
      errors.username = 'Username is required';
    }

    // Validate password
    if (!this.state.password) {
      errors.password = 'Password is required';
    }

    this.state.errors = errors;
    return Object.keys(errors).length === 0;
  }

  /**
   * Handle login errors
   * 
   * @param error - Error from API call
   * 
   * Requirements: 5.9
   */
  private handleLoginError(error: unknown): void {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const apiError = error as { statusCode: number; message: string };

      if (apiError.statusCode === 401) {
        this.state.errors.general = 'Invalid username or password';
      } else if (apiError.statusCode === 0) {
        this.state.errors.general = 'Unable to connect to server. Please try again.';
      } else {
        this.state.errors.general = apiError.message || 'An error occurred. Please try again.';
      }
    } else {
      this.state.errors.general = 'An unexpected error occurred. Please try again.';
    }

    this.render();
    this.attachEventListeners();
  }

  /**
   * Clear error for a specific field
   * 
   * @param field - Field name to clear error for
   * 
   * @private
   */
  private clearFieldError(field: keyof LoginFormState['errors']): void {
    if (this.state.errors[field]) {
      delete this.state.errors[field];
      this.updateErrorDisplay(field);
    }
  }

  /**
   * Update error display for a specific field without full re-render
   * 
   * @param field - Field name to update
   * 
   * @private
   */
  private updateErrorDisplay(field: keyof LoginFormState['errors']): void {
    const errorElement = this.container.querySelector(
      field === 'general' ? '.form-error-general' : `#${field} + .form-error, #${field}.form-input-error`
    );

    if (errorElement) {
      if (field === 'general') {
        errorElement.remove();
      } else {
        const inputElement = this.container.querySelector(`#${field}`) as HTMLInputElement;
        if (inputElement) {
          inputElement.classList.remove('form-input-error');
        }
        const errorDiv = this.container.querySelector(`#${field} ~ .form-error`);
        if (errorDiv) {
          errorDiv.remove();
        }
      }
    }
  }

  /**
   * Update component state and re-render
   * 
   * @param partial - Partial state to update
   * 
   * @private
   */
  private updateState(partial: Partial<LoginFormState>): void {
    this.state = { ...this.state, ...partial };
    this.render();
    this.attachEventListeners();
  }

  /**
   * Escape HTML to prevent XSS attacks
   * 
   * @param text - Text to escape
   * @returns HTML-escaped text
   * 
   * @private
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Add inline styles for the login form
   * 
   * @private
   */
  private addStyles(): void {
    // Check if styles are already added
    if (document.getElementById('login-form-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'login-form-styles';
    style.textContent = `
      .login-form-container {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 1rem;
      }

      .login-form-card {
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        padding: 2.5rem;
        width: 100%;
        max-width: 420px;
      }

      .login-form-title {
        margin: 0 0 0.5rem 0;
        font-size: 1.75rem;
        font-weight: 700;
        color: #1a202c;
        text-align: center;
      }

      .login-form-subtitle {
        margin: 0 0 2rem 0;
        font-size: 0.95rem;
        color: #718096;
        text-align: center;
      }

      .login-form {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }

      .form-error-general {
        padding: 0.75rem 1rem;
        background-color: #fee;
        border: 1px solid #fcc;
        border-radius: 6px;
        color: #c33;
        font-size: 0.9rem;
        line-height: 1.4;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .form-label {
        font-size: 0.9rem;
        font-weight: 600;
        color: #2d3748;
      }

      .form-input {
        padding: 0.75rem 1rem;
        font-size: 1rem;
        border: 2px solid #e2e8f0;
        border-radius: 6px;
        transition: all 0.2s;
        outline: none;
      }

      .form-input:focus {
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }

      .form-input:disabled {
        background-color: #f7fafc;
        cursor: not-allowed;
        opacity: 0.6;
      }

      .form-input-error {
        border-color: #fc8181;
      }

      .form-input-error:focus {
        border-color: #f56565;
        box-shadow: 0 0 0 3px rgba(245, 101, 101, 0.1);
      }

      .form-error {
        font-size: 0.85rem;
        color: #e53e3e;
        margin-top: -0.25rem;
      }

      .form-group-checkbox {
        display: flex;
        align-items: center;
      }

      .checkbox-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9rem;
        color: #4a5568;
        cursor: pointer;
        user-select: none;
      }

      .form-checkbox {
        width: 1.1rem;
        height: 1.1rem;
        cursor: pointer;
      }

      .form-checkbox:disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }

      .form-submit-btn {
        padding: 0.875rem 1.5rem;
        font-size: 1rem;
        font-weight: 600;
        color: white;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        margin-top: 0.5rem;
      }

      .form-submit-btn:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }

      .form-submit-btn:active:not(:disabled) {
        transform: translateY(0);
      }

      .form-submit-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
      }

      .login-form-footer {
        margin-top: 1.5rem;
        text-align: center;
        font-size: 0.9rem;
        color: #718096;
      }

      .login-form-footer a {
        color: #667eea;
        text-decoration: none;
        font-weight: 600;
      }

      .login-form-footer a:hover {
        text-decoration: underline;
      }

      @media (max-width: 480px) {
        .login-form-card {
          padding: 2rem 1.5rem;
        }

        .login-form-title {
          font-size: 1.5rem;
        }
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Destroy the component and clean up
   */
  destroy(): void {
    this.container.innerHTML = '';
  }
}
