/**
 * Toast - User feedback notification component
 * 
 * Features:
 * - Display temporary notification messages
 * - Support for different toast types: success, error, warning, info
 * - Auto-dismiss with configurable duration (default 5 seconds)
 * - CSS animations for smooth show/hide transitions
 * - Support for multiple toasts displayed simultaneously
 * - Manual dismissal by clicking on the toast
 * 
 * Requirements: 5.1, 5.2, 5.5
 */

/**
 * Toast notification types
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Toast - Displays temporary notification messages
 * 
 * This component provides user feedback through temporary notification messages
 * that appear at the top of the screen with smooth animations.
 * 
 * Requirements: 5.1, 5.2, 5.5
 */
export class Toast {
  private static container: HTMLElement | null = null;
  private static isInitialized = false;

  /**
   * Initialize the toast container
   * 
   * Creates a container element and appends it to the document body.
   * This method should be called once during application initialization.
   * 
   * Requirements: 5.1
   */
  static init(): void {
    if (this.isInitialized) {
      return;
    }

    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    document.body.appendChild(this.container);
    
    this.addStyles();
    this.isInitialized = true;
  }

  /**
   * Display a toast notification
   * 
   * @param message - The message to display
   * @param type - The type of toast (success, error, warning, info)
   * @param duration - Duration in milliseconds before auto-dismiss (default 5000ms)
   * 
   * Requirements: 5.1, 5.2, 5.5
   */
  static show(message: string, type: ToastType = 'info', duration = 5000): void {
    if (!this.container) {
      console.warn('Toast not initialized. Call Toast.init() first.');
      return;
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Create message content
    const messageSpan = document.createElement('span');
    messageSpan.className = 'toast-message';
    messageSpan.textContent = message;
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.className = 'toast-close';
    closeButton.innerHTML = '&times;';
    closeButton.setAttribute('aria-label', 'Close notification');
    
    // Append elements
    toast.appendChild(messageSpan);
    toast.appendChild(closeButton);
    
    // Add to container
    this.container.appendChild(toast);
    
    // Animate in (trigger reflow to ensure animation plays)
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Set up manual dismissal
    const dismiss = () => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    };
    
    closeButton.addEventListener('click', dismiss);
    toast.addEventListener('click', dismiss);
    
    // Auto dismiss after duration
    if (duration > 0) {
      setTimeout(dismiss, duration);
    }
  }

  /**
   * Display an error toast
   * 
   * @param message - The error message to display
   * 
   * Requirements: 5.2
   */
  static error(message: string): void {
    this.show(message, 'error');
  }

  /**
   * Display a success toast
   * 
   * @param message - The success message to display
   * 
   * Requirements: 5.2
   */
  static success(message: string): void {
    this.show(message, 'success');
  }

  /**
   * Display a warning toast
   * 
   * @param message - The warning message to display
   * 
   * Requirements: 5.2
   */
  static warning(message: string): void {
    this.show(message, 'warning');
  }

  /**
   * Display an info toast
   * 
   * @param message - The info message to display
   * 
   * Requirements: 5.2
   */
  static info(message: string): void {
    this.show(message, 'info');
  }

  /**
   * Add inline styles for the toast component
   * 
   * @private
   */
  private static addStyles(): void {
    // Check if styles are already added
    if (document.getElementById('toast-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      .toast-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
      }

      .toast {
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-width: 300px;
        max-width: 500px;
        padding: 16px 20px;
        background-color: #333;
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        opacity: 0;
        transform: translateX(400px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: auto;
        cursor: pointer;
        font-size: 14px;
        line-height: 1.5;
      }

      .toast.show {
        opacity: 1;
        transform: translateX(0);
      }

      .toast-message {
        flex: 1;
        margin-right: 12px;
        word-wrap: break-word;
      }

      .toast-close {
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        line-height: 1;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.7;
        transition: opacity 0.2s;
        flex-shrink: 0;
      }

      .toast-close:hover {
        opacity: 1;
      }

      /* Toast type styles */
      .toast-success {
        background-color: #4caf50;
        border-left: 4px solid #2e7d32;
      }

      .toast-error {
        background-color: #f44336;
        border-left: 4px solid #c62828;
      }

      .toast-warning {
        background-color: #ff9800;
        border-left: 4px solid #e65100;
      }

      .toast-info {
        background-color: #2196f3;
        border-left: 4px solid #1565c0;
      }

      /* Responsive design */
      @media (max-width: 600px) {
        .toast-container {
          top: 10px;
          right: 10px;
          left: 10px;
        }

        .toast {
          min-width: auto;
          max-width: none;
          width: 100%;
        }
      }

      /* Animation for stacking multiple toasts */
      .toast:not(.show) {
        margin-bottom: -100px;
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Clear all active toasts
   * 
   * Removes all toast notifications from the container
   */
  static clearAll(): void {
    if (this.container) {
      this.container.innerHTML = '';
    }
  }

  /**
   * Destroy the toast container
   * 
   * Removes the container from the DOM and resets initialization state
   */
  static destroy(): void {
    if (this.container && this.container.parentNode) {
      this.container.remove();
    }
    this.container = null;
    this.isInitialized = false;

    // Remove styles
    const styleElement = document.getElementById('toast-styles');
    if (styleElement) {
      styleElement.remove();
    }
  }
}
