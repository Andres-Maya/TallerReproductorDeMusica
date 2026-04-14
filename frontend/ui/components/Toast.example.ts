/**
 * Toast Component Usage Examples
 * 
 * This file demonstrates how to use the Toast notification component
 */

import { Toast } from './Toast';

// Initialize the toast system (call once during app initialization)
Toast.init();

// Example 1: Display a basic info toast
Toast.show('This is an info message');

// Example 2: Display a success toast
Toast.success('Operation completed successfully!');

// Example 3: Display an error toast
Toast.error('An error occurred while processing your request');

// Example 4: Display a warning toast
Toast.warning('Please save your work before continuing');

// Example 5: Display an info toast explicitly
Toast.info('New features are now available');

// Example 6: Display a toast with custom duration (3 seconds)
Toast.show('This will disappear in 3 seconds', 'info', 3000);

// Example 7: Display a toast that doesn't auto-dismiss (duration = 0)
Toast.show('Click to dismiss', 'warning', 0);

// Example 8: Display multiple toasts
Toast.success('First operation completed');
Toast.success('Second operation completed');
Toast.info('All operations finished');

// Example 9: Clear all active toasts
// Toast.clearAll();

// Example 10: Destroy the toast system (cleanup)
// Toast.destroy();

// Real-world usage examples:

// After successful login
function handleLoginSuccess() {
  Toast.success('Welcome back! You have successfully logged in.');
}

// After failed API request
function handleApiError(error: Error) {
  Toast.error(`Failed to load data: ${error.message}`);
}

// After saving data
function handleSaveSuccess() {
  Toast.success('Your changes have been saved');
}

// Warning before destructive action
function warnBeforeDelete() {
  Toast.warning('This action cannot be undone');
}

// Info notification
function notifyNewFeature() {
  Toast.info('Check out our new playlist sharing feature!');
}

// Form validation error
function showValidationError(message: string) {
  Toast.error(message);
}

// Network status
function handleOffline() {
  Toast.show('You are currently offline. Some features may be unavailable.', 'warning', 0);
}

function handleOnline() {
  Toast.success('Connection restored');
}

// File upload progress
function handleUploadComplete(filename: string) {
  Toast.success(`${filename} uploaded successfully`);
}

// Session expiration warning
function warnSessionExpiring() {
  Toast.show('Your session will expire in 5 minutes', 'warning', 10000);
}
