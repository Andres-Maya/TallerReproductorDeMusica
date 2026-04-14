/**
 * RegisterForm - User registration form component
 * 
 * Features:
 * - Username and password input fields
 * - Client-side password validation (min 8 chars, uppercase, lowercase, number)
 * - Password strength indicator
 * - Inline error messages for validation and API errors
 * - Loading state with disabled submit button
 * - Calls AuthApi.register() on submit
 * - Handles success: saves session, updates state, redirects to playlists
 * - Handles errors: displays inline error messages (username taken, weak password)
 * 
 * Requirements: 2.10, 2.11, 5.8, 5.9
 */

import { AuthApi } from '../../api/AuthApi';
import { SessionManager } from '../../app/SessionManager';
import { StateManager } from '../../app/StateManager';

/**
 * RegisterForm component state
 */
interface RegisterFormState {
  username: string;
  password: string;
  isLoading: boolean;
  errors: {
    username?: string;
    password?: string;
    general?: string;
  };
  passwordStrength: 'weak' | 'medium' | 'strong' | null;
}

/**
 * RegisterForm - Handles user registration
 * 
 * This component renders a registration form with username and password fields.
 * It performs client-side validation including password strength checking and
 * communicates with the backend authentication API.
 * 
 * Requirements: 2.10, 2.11, 5.8, 5.9
 */
export class RegisterForm {
  private container: HTMLElement;
  private authApi: AuthApi;
  private sessionManager: SessionManager;
  private stateManager: StateManager;
  private state: RegisterFormState;
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
      isLoading: false,
      errors: {},
      passwordStrength: null,
    };

    this.render();
    this.attachEventListeners();
  }

  /**
   * Render the registration form
   * 
   * Requirements: 2.10, 5.8
   */
  private render(): void {
    this.container.innerHTML = `
      <div class="register-form-container">
        <div class="register-form-card">
          <h2 class="register-form-title">Join Waveline</h2>
          <p class="register-form-subtitle">Create your account to start building playlists</p>
          
          <form id="register-form" class="register-form" novalidate>
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
                placeholder="Choose a username"
                autocomplete="username"
                ${this.state.isLoading ? 'disabled' : ''}
                required
              />
              ${this.state.errors.username ? `
                <div class="form-error">${this.escapeHtml(this.state.errors.username)}</div>
              ` : ''}
              <div class="form-hint">3-30 characters, letters, numbers, and underscores only</div>
            </div>
            
            <div class="form-group">
              <label for="password" class="form-label">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                class="form-input ${this.state.errors.password ? 'form-input-error' : ''}"
                value="${this.escapeHtml(this.state.password)}"
                placeholder="Create a strong password"
                autocomplete="new-password"
                ${this.state.isLoading ? 'disabled' : ''}
                required
              />
              ${this.state.errors.password ? `
                <div class="form-error">${this.escapeHtml(this.state.errors.password)}</div>
              ` : ''}
              ${this.state.passwordStrength ? `
                <div class="password-strength">
                  <div class="password-strength-label">Password strength:</div>
                  <div class="password-strength-bar">
                    <div class="password-strength-fill password-strength-${this.state.passwordStrength}"></div>
                  </div>
                  <div class="password-strength-text password-strength-text-${this.state.passwordStrength}">
                    ${this.state.passwordStrength.charAt(0).toUpperCase() + this.state.passwordStrength.slice(1)}
                  </div>
                </div>
              ` : ''}
              <div class="form-hint">Minimum 8 characters with uppercase, lowercase, and number</div>
            </div>
            
            <button
              type="submit"
              class="form-submit-btn"
              ${this.state.isLoading ? 'disabled' : ''}
            >
              ${this.state.isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
          
          <div class="register-form-footer">
            <p>Already have an account? <a href="#" id="login-link">Sign in here</a></p>
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
    const form = this.container.querySelector('#register-form') as HTMLFormElement;
    const usernameInput = this.container.querySelector('#username') as HTMLInputElement;
    const passwordInput = this.container.querySelector('#password') as HTMLInputElement;

    if (!form || !usernameInput || !passwordInput) {
      console.error('RegisterForm: Required form elements not found');
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
      
      // Update password strength indicator
      this.updatePasswordStrength();
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
      // Call register API
      const response = await this.authApi.register(
        this.state.username,
        this.state.password
      );

      // Save session (default to rememberMe: false for registration)
      this.sessionManager.saveSession(
        {
          token: response.token,
          userId: response.user.id,
          username: response.user.username,
          expiresAt: response.expiresAt,
        },
        false
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
      this.handleRegisterError(error);
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
    const errors: RegisterFormState['errors'] = {};

    // Validate username
    if (!this.state.username.trim()) {
      errors.username = 'Username is required';
    } else if (this.state.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    } else if (this.state.username.length > 30) {
      errors.username = 'Username must be at most 30 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(this.state.username)) {
      errors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Validate password
    const passwordValidation = this.validatePassword(this.state.password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.error || 'Invalid password';
    }

    this.state.errors = errors;
    return Object.keys(errors).length === 0;
  }

  /**
   * Validate password strength
   * 
   * Requirements: 5.8
   * 
   * @param password - Password to validate
   * @returns Validation result with error message if invalid
   */
  private validatePassword(password: string): { isValid: boolean; error?: string } {
    if (!password) {
      return { isValid: false, error: 'Password is required' };
    }

    if (password.length < 8) {
      return { isValid: false, error: 'Password must be at least 8 characters' };
    }

    if (!/[A-Z]/.test(password)) {
      return { isValid: false, error: 'Password must contain at least one uppercase letter' };
    }

    if (!/[a-z]/.test(password)) {
      return { isValid: false, error: 'Password must contain at least one lowercase letter' };
    }

    if (!/[0-9]/.test(password)) {
      return { isValid: false, error: 'Password must contain at least one number' };
    }

    return { isValid: true };
  }

  /**
   * Calculate password strength
   * 
   * @param password - Password to evaluate
   * @returns Strength level: 'weak', 'medium', or 'strong'
   * 
   * @private
   */
  private calculatePasswordStrength(password: string): 'weak' | 'medium' | 'strong' | null {
    if (!password) {
      return null;
    }

    let score = 0;

    // Length check
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;

    // Character variety checks
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++; // Special characters

    // Determine strength
    if (score <= 2) return 'weak';
    if (score <= 4) return 'medium';
    return 'strong';
  }

  /**
   * Update password strength indicator
   * 
   * @private
   */
  private updatePasswordStrength(): void {
    const strength = this.calculatePasswordStrength(this.state.password);
    
    if (strength !== this.state.passwordStrength) {
      this.state.passwordStrength = strength;
      this.render();
      this.attachEventListeners();
    }
  }

  /**
   * Handle registration errors
   * 
   * @param error - Error from API call
   * 
   * Requirements: 5.9
   */
  private handleRegisterError(error: unknown): void {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const apiError = error as { statusCode: number; message: string };

      if (apiError.statusCode === 409) {
        // Username already taken
        this.state.errors.username = 'Username is already taken';
      } else if (apiError.statusCode === 400) {
        // Validation error (weak password or invalid username)
        if (apiError.message.toLowerCase().includes('password')) {
          this.state.errors.password = apiError.message;
        } else if (apiError.message.toLowerCase().includes('username')) {
          this.state.errors.username = apiError.message;
        } else {
          this.state.errors.general = apiError.message;
        }
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
  private clearFieldError(field: keyof RegisterFormState['errors']): void {
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
  private updateErrorDisplay(field: keyof RegisterFormState['errors']): void {
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
  private updateState(partial: Partial<RegisterFormState>): void {
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
   * Add inline styles for the registration form
   * 
   * @private
   */
  private addStyles(): void {
    // Check if styles are already added
    if (document.getElementById('register-form-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'register-form-styles';
    style.textContent = `
      .register-form-container {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 1rem;
      }

      .register-form-card {
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        padding: 2.5rem;
        width: 100%;
        max-width: 420px;
      }

      .register-form-title {
        margin: 0 0 0.5rem 0;
        font-size: 1.75rem;
        font-weight: 700;
        color: #1a202c;
        text-align: center;
      }

      .register-form-subtitle {
        margin: 0 0 2rem 0;
        font-size: 0.95rem;
        color: #718096;
        text-align: center;
      }

      .register-form {
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

      .form-hint {
        font-size: 0.8rem;
        color: #a0aec0;
        margin-top: -0.25rem;
      }

      .password-strength {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-top: 0.25rem;
      }

      .password-strength-label {
        font-size: 0.8rem;
        color: #4a5568;
        white-space: nowrap;
      }

      .password-strength-bar {
        flex: 1;
        height: 6px;
        background-color: #e2e8f0;
        border-radius: 3px;
        overflow: hidden;
      }

      .password-strength-fill {
        height: 100%;
        transition: all 0.3s ease;
        border-radius: 3px;
      }

      .password-strength-fill.password-strength-weak {
        width: 33%;
        background-color: #fc8181;
      }

      .password-strength-fill.password-strength-medium {
        width: 66%;
        background-color: #f6ad55;
      }

      .password-strength-fill.password-strength-strong {
        width: 100%;
        background-color: #68d391;
      }

      .password-strength-text {
        font-size: 0.8rem;
        font-weight: 600;
        white-space: nowrap;
      }

      .password-strength-text-weak {
        color: #e53e3e;
      }

      .password-strength-text-medium {
        color: #dd6b20;
      }

      .password-strength-text-strong {
        color: #38a169;
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

      .register-form-footer {
        margin-top: 1.5rem;
        text-align: center;
        font-size: 0.9rem;
        color: #718096;
      }

      .register-form-footer a {
        color: #667eea;
        text-decoration: none;
        font-weight: 600;
      }

      .register-form-footer a:hover {
        text-decoration: underline;
      }

      @media (max-width: 480px) {
        .register-form-card {
          padding: 2rem 1.5rem;
        }

        .register-form-title {
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
