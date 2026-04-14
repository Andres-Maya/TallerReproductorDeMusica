/**
 * Toast Tests
 * 
 * Tests for the Toast notification component
 * 
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Toast } from './Toast';

describe('Toast', () => {
  beforeEach(() => {
    // Clean up any existing toast elements
    const existingContainer = document.querySelector('.toast-container');
    if (existingContainer) {
      existingContainer.remove();
    }
    
    const existingStyles = document.getElementById('toast-styles');
    if (existingStyles) {
      existingStyles.remove();
    }
  });

  afterEach(() => {
    // Clean up after each test
    Toast.destroy();
  });

  describe('Initialization', () => {
    it('should initialize toast container', () => {
      Toast.init();
      
      const container = document.querySelector('.toast-container');
      expect(container).toBeTruthy();
      expect(container?.parentNode).toBe(document.body);
    });

    it('should add styles to document head', () => {
      Toast.init();
      
      const styles = document.getElementById('toast-styles');
      expect(styles).toBeTruthy();
      expect(styles?.tagName).toBe('STYLE');
    });

    it('should not create duplicate containers on multiple init calls', () => {
      Toast.init();
      Toast.init();
      Toast.init();
      
      const containers = document.querySelectorAll('.toast-container');
      expect(containers.length).toBe(1);
    });

    it('should not add duplicate styles on multiple init calls', () => {
      Toast.init();
      Toast.init();
      
      const styles = document.querySelectorAll('#toast-styles');
      expect(styles.length).toBe(1);
    });
  });

  describe('Display Toast', () => {
    beforeEach(() => {
      Toast.init();
    });

    it('should display a toast with default type (info)', () => {
      Toast.show('Test message');
      
      const toast = document.querySelector('.toast');
      expect(toast).toBeTruthy();
      expect(toast?.classList.contains('toast-info')).toBe(true);
      expect(toast?.textContent).toContain('Test message');
    });

    it('should display toast with success type', () => {
      Toast.show('Success message', 'success');
      
      const toast = document.querySelector('.toast-success');
      expect(toast).toBeTruthy();
      expect(toast?.textContent).toContain('Success message');
    });

    it('should display toast with error type', () => {
      Toast.show('Error message', 'error');
      
      const toast = document.querySelector('.toast-error');
      expect(toast).toBeTruthy();
      expect(toast?.textContent).toContain('Error message');
    });

    it('should display toast with warning type', () => {
      Toast.show('Warning message', 'warning');
      
      const toast = document.querySelector('.toast-warning');
      expect(toast).toBeTruthy();
      expect(toast?.textContent).toContain('Warning message');
    });

    it('should display toast with info type', () => {
      Toast.show('Info message', 'info');
      
      const toast = document.querySelector('.toast-info');
      expect(toast).toBeTruthy();
      expect(toast?.textContent).toContain('Info message');
    });

    it('should include close button', () => {
      Toast.show('Test message');
      
      const closeButton = document.querySelector('.toast-close');
      expect(closeButton).toBeTruthy();
      expect(closeButton?.getAttribute('aria-label')).toBe('Close notification');
    });

    it('should warn if not initialized', () => {
      Toast.destroy();
      
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      Toast.show('Test message');
      
      expect(consoleWarnSpy).toHaveBeenCalledWith('Toast not initialized. Call Toast.init() first.');
      
      consoleWarnSpy.mockRestore();
    });
  });

  describe('Convenience Methods', () => {
    beforeEach(() => {
      Toast.init();
    });

    it('should display error toast using error() method', () => {
      Toast.error('Error message');
      
      const toast = document.querySelector('.toast-error');
      expect(toast).toBeTruthy();
      expect(toast?.textContent).toContain('Error message');
    });

    it('should display success toast using success() method', () => {
      Toast.success('Success message');
      
      const toast = document.querySelector('.toast-success');
      expect(toast).toBeTruthy();
      expect(toast?.textContent).toContain('Success message');
    });

    it('should display warning toast using warning() method', () => {
      Toast.warning('Warning message');
      
      const toast = document.querySelector('.toast-warning');
      expect(toast).toBeTruthy();
      expect(toast?.textContent).toContain('Warning message');
    });

    it('should display info toast using info() method', () => {
      Toast.info('Info message');
      
      const toast = document.querySelector('.toast-info');
      expect(toast).toBeTruthy();
      expect(toast?.textContent).toContain('Info message');
    });
  });

  describe('Multiple Toasts', () => {
    beforeEach(() => {
      Toast.init();
    });

    it('should display multiple toasts simultaneously', () => {
      Toast.show('First message');
      Toast.show('Second message');
      Toast.show('Third message');
      
      const toasts = document.querySelectorAll('.toast');
      expect(toasts.length).toBe(3);
    });

    it('should display toasts with different types', () => {
      Toast.success('Success');
      Toast.error('Error');
      Toast.warning('Warning');
      
      expect(document.querySelector('.toast-success')).toBeTruthy();
      expect(document.querySelector('.toast-error')).toBeTruthy();
      expect(document.querySelector('.toast-warning')).toBeTruthy();
    });
  });

  describe('Animation', () => {
    beforeEach(() => {
      Toast.init();
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should add show class after delay', () => {
      Toast.show('Test message');
      
      let toast = document.querySelector('.toast');
      expect(toast?.classList.contains('show')).toBe(false);
      
      vi.advanceTimersByTime(10);
      
      toast = document.querySelector('.toast');
      expect(toast?.classList.contains('show')).toBe(true);
    });
  });

  describe('Auto-dismiss', () => {
    beforeEach(() => {
      Toast.init();
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should auto-dismiss after default duration (5000ms)', () => {
      Toast.show('Test message');
      
      expect(document.querySelector('.toast')).toBeTruthy();
      
      // Advance past animation delay
      vi.advanceTimersByTime(10);
      
      // Advance to just before dismiss
      vi.advanceTimersByTime(4990);
      expect(document.querySelector('.toast')).toBeTruthy();
      
      // Advance past dismiss time
      vi.advanceTimersByTime(10);
      
      // Toast should have show class removed
      const toast = document.querySelector('.toast');
      expect(toast?.classList.contains('show')).toBe(false);
      
      // Advance past removal animation
      vi.advanceTimersByTime(300);
      expect(document.querySelector('.toast')).toBeFalsy();
    });

    it('should auto-dismiss after custom duration', () => {
      Toast.show('Test message', 'info', 2000);
      
      expect(document.querySelector('.toast')).toBeTruthy();
      
      // Advance past animation delay
      vi.advanceTimersByTime(10);
      
      // Advance to custom duration
      vi.advanceTimersByTime(2000);
      
      const toast = document.querySelector('.toast');
      expect(toast?.classList.contains('show')).toBe(false);
      
      // Advance past removal animation
      vi.advanceTimersByTime(300);
      expect(document.querySelector('.toast')).toBeFalsy();
    });

    it('should not auto-dismiss when duration is 0', () => {
      Toast.show('Test message', 'info', 0);
      
      // Advance past animation delay
      vi.advanceTimersByTime(10);
      
      // Advance a long time
      vi.advanceTimersByTime(10000);
      
      // Toast should still be visible
      const toast = document.querySelector('.toast');
      expect(toast).toBeTruthy();
      expect(toast?.classList.contains('show')).toBe(true);
    });
  });

  describe('Manual Dismissal', () => {
    beforeEach(() => {
      Toast.init();
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should dismiss when close button is clicked', () => {
      Toast.show('Test message');
      
      // Advance past animation delay
      vi.advanceTimersByTime(10);
      
      const closeButton = document.querySelector('.toast-close') as HTMLButtonElement;
      expect(closeButton).toBeTruthy();
      
      closeButton.click();
      
      // Toast should have show class removed
      const toast = document.querySelector('.toast');
      expect(toast?.classList.contains('show')).toBe(false);
      
      // Advance past removal animation
      vi.advanceTimersByTime(300);
      expect(document.querySelector('.toast')).toBeFalsy();
    });

    it('should dismiss when toast is clicked', () => {
      Toast.show('Test message');
      
      // Advance past animation delay
      vi.advanceTimersByTime(10);
      
      const toast = document.querySelector('.toast') as HTMLElement;
      expect(toast).toBeTruthy();
      
      toast.click();
      
      // Toast should have show class removed
      expect(toast.classList.contains('show')).toBe(false);
      
      // Advance past removal animation
      vi.advanceTimersByTime(300);
      expect(document.querySelector('.toast')).toBeFalsy();
    });
  });

  describe('Clear All', () => {
    beforeEach(() => {
      Toast.init();
    });

    it('should clear all toasts', () => {
      Toast.show('First message');
      Toast.show('Second message');
      Toast.show('Third message');
      
      expect(document.querySelectorAll('.toast').length).toBe(3);
      
      Toast.clearAll();
      
      expect(document.querySelectorAll('.toast').length).toBe(0);
    });

    it('should not throw if container does not exist', () => {
      Toast.destroy();
      
      expect(() => {
        Toast.clearAll();
      }).not.toThrow();
    });
  });

  describe('Destroy', () => {
    beforeEach(() => {
      Toast.init();
    });

    it('should remove container from DOM', () => {
      expect(document.querySelector('.toast-container')).toBeTruthy();
      
      Toast.destroy();
      
      expect(document.querySelector('.toast-container')).toBeFalsy();
    });

    it('should remove styles from document', () => {
      expect(document.getElementById('toast-styles')).toBeTruthy();
      
      Toast.destroy();
      
      expect(document.getElementById('toast-styles')).toBeFalsy();
    });

    it('should allow re-initialization after destroy', () => {
      Toast.destroy();
      Toast.init();
      
      expect(document.querySelector('.toast-container')).toBeTruthy();
      expect(document.getElementById('toast-styles')).toBeTruthy();
    });

    it('should not throw if container does not exist', () => {
      Toast.destroy();
      
      expect(() => {
        Toast.destroy();
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      Toast.init();
    });

    it('should handle empty message', () => {
      Toast.show('');
      
      const toast = document.querySelector('.toast');
      expect(toast).toBeTruthy();
    });

    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(500);
      Toast.show(longMessage);
      
      const toast = document.querySelector('.toast');
      expect(toast).toBeTruthy();
      expect(toast?.textContent).toContain(longMessage);
    });

    it('should handle special characters in message', () => {
      const specialMessage = '<script>alert("XSS")</script>';
      Toast.show(specialMessage);
      
      const toast = document.querySelector('.toast');
      expect(toast?.textContent).toContain(specialMessage);
      // Should not execute script
      expect(toast?.innerHTML).not.toContain('<script>');
    });

    it('should handle negative duration', () => {
      Toast.show('Test message', 'info', -1000);
      
      // Should not auto-dismiss with negative duration
      const toast = document.querySelector('.toast');
      expect(toast).toBeTruthy();
    });
  });
});
