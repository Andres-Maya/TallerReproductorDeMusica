/**
 * ErrorBoundary Tests
 * 
 * Tests for the ErrorBoundary component that catches and displays unhandled errors
 * 
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

describe('ErrorBoundary', () => {
  let container: HTMLElement;
  let errorBoundary: ErrorBoundary;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Create a container element
    container = document.createElement('div');
    document.body.appendChild(container);

    // Spy on console.error to suppress error logs during tests
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Create ErrorBoundary instance
    errorBoundary = new ErrorBoundary(container);
  });

  afterEach(() => {
    // Clean up
    document.body.removeChild(container);
    consoleErrorSpy.mockRestore();
    
    // Remove any added styles
    const styleElement = document.getElementById('error-boundary-styles');
    if (styleElement) {
      styleElement.remove();
    }
  });

  describe('Initialization', () => {
    it('should create an ErrorBoundary instance', () => {
      expect(errorBoundary).toBeInstanceOf(ErrorBoundary);
    });

    it('should set up global error handlers', () => {
      // The error handlers are set up in the constructor
      // We can verify by triggering an error event
      const error = new Error('Test error');
      const errorEvent = new ErrorEvent('error', { error });
      
      window.dispatchEvent(errorEvent);
      
      // Should have logged the error
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error caught by boundary:', error);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors and display error UI', () => {
      const error = new Error('Test error message');
      
      errorBoundary.handleError(error);
      
      // Check that error UI is rendered
      expect(container.innerHTML).toContain('Something went wrong');
      expect(container.innerHTML).toContain('Test error message');
      expect(container.innerHTML).toContain('Reload Application');
    });

    it('should log errors to console', () => {
      const error = new Error('Console test error');
      
      errorBoundary.handleError(error);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error caught by boundary:', error);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Timestamp:', expect.any(String));
    });

    it('should escape HTML in error messages to prevent XSS', () => {
      const error = new Error('<script>alert("XSS")</script>');
      
      errorBoundary.handleError(error);
      
      // Should escape the HTML tags
      expect(container.innerHTML).toContain('&lt;script&gt;');
      expect(container.innerHTML).not.toContain('<script>alert');
    });

    it('should handle errors with stack traces', () => {
      const error = new Error('Error with stack');
      error.stack = 'Error: Error with stack\n    at test.js:10:5';
      
      errorBoundary.handleError(error);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Stack trace:', error.stack);
    });

    it('should handle errors without stack traces', () => {
      const error = new Error('Error without stack');
      delete error.stack;
      
      errorBoundary.handleError(error);
      
      // Should not throw and should still render
      expect(container.innerHTML).toContain('Something went wrong');
    });
  });

  describe('Global Error Events', () => {
    it('should catch unhandled error events', () => {
      const error = new Error('Unhandled error');
      const errorEvent = new ErrorEvent('error', { 
        error,
        message: 'Unhandled error'
      });
      
      window.dispatchEvent(errorEvent);
      
      expect(container.innerHTML).toContain('Something went wrong');
      expect(container.innerHTML).toContain('Unhandled error');
    });

    it('should catch unhandled promise rejections', () => {
      const error = new Error('Promise rejection');
      const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
        promise: Promise.resolve(), // Use resolved promise to avoid actual rejection
        reason: error
      });
      
      window.dispatchEvent(rejectionEvent);
      
      expect(container.innerHTML).toContain('Something went wrong');
      expect(container.innerHTML).toContain('Promise rejection');
    });

    it('should handle promise rejections with non-Error reasons', () => {
      const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
        promise: Promise.resolve(), // Use resolved promise to avoid actual rejection
        reason: 'String rejection'
      });
      
      window.dispatchEvent(rejectionEvent);
      
      expect(container.innerHTML).toContain('Something went wrong');
      expect(container.innerHTML).toContain('String rejection');
    });
  });

  describe('Error UI', () => {
    it('should display reload button', () => {
      const error = new Error('Test error');
      
      errorBoundary.handleError(error);
      
      const reloadBtn = container.querySelector('#reload-btn');
      expect(reloadBtn).toBeTruthy();
      expect(reloadBtn?.textContent).toBe('Reload Application');
    });

    it('should reload page when reload button is clicked', () => {
      const error = new Error('Test error');
      
      // Mock window.location.reload
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { ...originalLocation, reload: vi.fn() } as any;
      
      errorBoundary.handleError(error);
      
      const reloadBtn = container.querySelector('#reload-btn') as HTMLButtonElement;
      reloadBtn?.click();
      
      expect(window.location.reload).toHaveBeenCalled();
      
      // Restore original location
      window.location = originalLocation;
    });

    it('should add styles to the document', () => {
      const error = new Error('Test error');
      
      errorBoundary.handleError(error);
      
      const styleElement = document.getElementById('error-boundary-styles');
      expect(styleElement).toBeTruthy();
      expect(styleElement?.tagName).toBe('STYLE');
    });

    it('should not add duplicate styles', () => {
      const error = new Error('Test error');
      
      errorBoundary.handleError(error);
      errorBoundary.handleError(error);
      
      const styleElements = document.querySelectorAll('#error-boundary-styles');
      expect(styleElements.length).toBe(1);
    });
  });

  describe('Development Mode', () => {
    it('should show error details in development mode', () => {
      // Mock development mode
      vi.stubEnv('DEV', true);
      
      const error = new Error('Dev mode error');
      error.stack = 'Error: Dev mode error\n    at test.js:10:5';
      
      errorBoundary.handleError(error);
      
      // Should show details section
      expect(container.innerHTML).toContain('Error Details (Development Mode)');
      expect(container.innerHTML).toContain('Stack Trace:');
      
      vi.unstubAllEnvs();
    });

    it('should not show error details in production mode', () => {
      // Mock production mode
      vi.stubEnv('DEV', false);
      
      const error = new Error('Prod mode error');
      error.stack = 'Error: Prod mode error\n    at test.js:10:5';
      
      errorBoundary.handleError(error);
      
      // Should not show details section
      expect(container.innerHTML).not.toContain('Error Details');
      expect(container.innerHTML).not.toContain('Stack Trace:');
      
      vi.unstubAllEnvs();
    });
  });

  describe('Error Reporting', () => {
    it('should report errors to tracking service if available', () => {
      const captureExceptionSpy = vi.fn();
      window.errorTracker = {
        captureException: captureExceptionSpy
      };
      
      const error = new Error('Tracked error');
      errorBoundary.handleError(error);
      
      expect(captureExceptionSpy).toHaveBeenCalledWith(error);
      
      // Clean up
      delete window.errorTracker;
    });

    it('should not throw if error tracking service is not available', () => {
      delete window.errorTracker;
      
      const error = new Error('Untracked error');
      
      expect(() => {
        errorBoundary.handleError(error);
      }).not.toThrow();
    });

    it('should handle errors in error reporting gracefully', () => {
      window.errorTracker = {
        captureException: () => {
          throw new Error('Tracking failed');
        }
      };
      
      const error = new Error('Error with failing tracker');
      
      expect(() => {
        errorBoundary.handleError(error);
      }).not.toThrow();
      
      // Clean up
      delete window.errorTracker;
    });
  });

  describe('Reset', () => {
    it('should reset error state', () => {
      const error = new Error('Test error');
      
      errorBoundary.handleError(error);
      expect(container.innerHTML).toContain('Something went wrong');
      
      errorBoundary.reset();
      expect(container.innerHTML).toBe('');
    });

    it('should allow handling new errors after reset', () => {
      const error1 = new Error('First error');
      const error2 = new Error('Second error');
      
      errorBoundary.handleError(error1);
      expect(container.innerHTML).toContain('First error');
      
      errorBoundary.reset();
      
      errorBoundary.handleError(error2);
      expect(container.innerHTML).toContain('Second error');
      expect(container.innerHTML).not.toContain('First error');
    });
  });
});
