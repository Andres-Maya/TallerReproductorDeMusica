/**
 * ErrorBoundary - Global error handler for unhandled JavaScript errors
 * 
 * Features:
 * - Catches unhandled JavaScript errors via 'error' event
 * - Catches unhandled promise rejections via 'unhandledrejection' event
 * - Displays user-friendly error UI with reload button
 * - Shows stack traces in development mode only
 * - Logs all errors to console for debugging
 * - Supports optional error reporting to external tracking services
 * 
 * Requirements: 5.1, 5.2, 5.3
 */

/**
 * Error information structure
 */
export interface ErrorInfo {
  message: string;
  stack?: string;
  timestamp: Date;
}

/**
 * Optional error tracking service interface
 */
interface ErrorTracker {
  captureException(error: Error): void;
}

/**
 * Extend Window interface to include optional error tracker
 */
declare global {
  interface Window {
    errorTracker?: ErrorTracker;
  }
}

/**
 * ErrorBoundary - Catches and displays unhandled errors
 * 
 * This component sets up global error handlers and displays a user-friendly
 * error UI when unhandled errors occur. In development mode, it also shows
 * detailed stack traces for debugging.
 * 
 * Requirements: 5.1, 5.2, 5.3
 */
export class ErrorBoundary {
  private container: HTMLElement;
  private errorInfo: ErrorInfo | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.setupGlobalErrorHandler();
  }

  /**
   * Set up global error handlers for unhandled errors and promise rejections
   * 
   * Requirements: 5.1
   */
  private setupGlobalErrorHandler(): void {
    // Handle unhandled JavaScript errors
    window.addEventListener('error', (event: ErrorEvent) => {
      this.handleError(event.error || new Error(event.message));
      event.preventDefault();
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));
      this.handleError(error);
      event.preventDefault();
    });
  }

  /**
   * Handle an error by storing it, logging it, and rendering the error UI
   * 
   * @param error - The error to handle
   * 
   * Requirements: 5.1, 5.2, 5.3
   */
  handleError(error: Error): void {
    // Store error information
    this.errorInfo = {
      message: error.message || 'An unexpected error occurred',
      stack: error.stack,
      timestamp: new Date(),
    };

    // Log error to console for debugging
    console.error('Error caught by boundary:', error);
    console.error('Timestamp:', this.errorInfo.timestamp.toISOString());
    if (this.errorInfo.stack) {
      console.error('Stack trace:', this.errorInfo.stack);
    }

    // Render error UI
    this.render();

    // Report error to tracking service if available
    this.reportError(error);
  }

  /**
   * Render the error UI with user-friendly message and reload button
   * 
   * Shows stack trace only in development mode (when import.meta.env.DEV is true)
   * 
   * Requirements: 5.2, 5.3
   */
  private render(): void {
    if (!this.errorInfo) return;

    // Check if we're in development mode
    // In Vite, import.meta.env.DEV is true in development, false in production
    const isDevelopment = import.meta.env?.DEV ?? false;

    // Create error UI HTML
    this.container.innerHTML = `
      <div class="error-boundary">
        <div class="error-icon">⚠️</div>
        <h2>Something went wrong</h2>
        <p class="error-message">${this.escapeHtml(this.errorInfo.message)}</p>
        <button id="reload-btn" class="reload-button">Reload Application</button>
        ${isDevelopment ? `
          <details class="error-details">
            <summary>Error Details (Development Mode)</summary>
            <div class="error-stack">
              <strong>Timestamp:</strong> ${this.errorInfo.timestamp.toISOString()}<br><br>
              <strong>Stack Trace:</strong>
              <pre>${this.escapeHtml(this.errorInfo.stack || 'No stack trace available')}</pre>
            </div>
          </details>
        ` : ''}
      </div>
    `;

    // Add inline styles for error UI
    this.addStyles();

    // Attach reload button event listener
    const reloadBtn = document.getElementById('reload-btn');
    if (reloadBtn) {
      reloadBtn.addEventListener('click', () => {
        window.location.reload();
      });
    }
  }

  /**
   * Add inline styles for the error boundary UI
   * 
   * @private
   */
  private addStyles(): void {
    // Check if styles are already added
    if (document.getElementById('error-boundary-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'error-boundary-styles';
    style.textContent = `
      .error-boundary {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 400px;
        padding: 2rem;
        text-align: center;
        background-color: #fff;
        border: 2px solid #f44336;
        border-radius: 8px;
        margin: 2rem auto;
        max-width: 600px;
      }

      .error-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
      }

      .error-boundary h2 {
        color: #f44336;
        margin: 0 0 1rem 0;
        font-size: 1.5rem;
      }

      .error-message {
        color: #333;
        margin: 0 0 1.5rem 0;
        font-size: 1rem;
        line-height: 1.5;
      }

      .reload-button {
        background-color: #f32133ff;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        font-size: 1rem;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.2s;
      }

      .reload-button:hover {
        background-color: #11171dff;
      }

      .reload-button:active {
        background-color: #131b25ff;
      }

      .error-details {
        margin-top: 2rem;
        width: 100%;
        text-align: left;
      }

      .error-details summary {
        cursor: pointer;
        color: #666;
        font-weight: bold;
        padding: 0.5rem;
        background-color: #f5f5f5;
        border-radius: 4px;
        user-select: none;
      }

      .error-details summary:hover {
        background-color: #e0e0e0;
      }

      .error-stack {
        margin-top: 1rem;
        padding: 1rem;
        background-color: #f5f5f5;
        border-radius: 4px;
        font-size: 0.875rem;
      }

      .error-stack pre {
        margin: 0.5rem 0 0 0;
        padding: 0.5rem;
        background-color: #fff;
        border: 1px solid #ddd;
        border-radius: 4px;
        overflow-x: auto;
        font-family: 'Courier New', monospace;
        font-size: 0.75rem;
        line-height: 1.4;
        white-space: pre-wrap;
        word-wrap: break-word;
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Report error to external tracking service if available
   * 
   * This method checks for a global errorTracker object (e.g., Sentry)
   * and sends the error to it for monitoring and analysis.
   * 
   * @param error - The error to report
   * 
   * Requirements: 5.3
   */
  private reportError(error: Error): void {
    try {
      // Check if error tracking service is available
      if (window.errorTracker && typeof window.errorTracker.captureException === 'function') {
        window.errorTracker.captureException(error);
        console.log('Error reported to tracking service');
      }
    } catch (reportError) {
      // Silently fail if error reporting fails
      console.warn('Failed to report error to tracking service:', reportError);
    }
  }

  /**
   * Escape HTML to prevent XSS attacks when displaying error messages
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
   * Reset the error boundary to clear the current error
   * 
   * This can be used to programmatically clear the error state
   * without reloading the page.
   */
  reset(): void {
    this.errorInfo = null;
    this.container.innerHTML = '';
  }
}
