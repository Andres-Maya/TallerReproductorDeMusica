/**
 * LoginForm - Usage Example
 * 
 * This example demonstrates how to use the LoginForm component
 * in your application.
 */

import { LoginForm } from './LoginForm';
import { AuthApi } from '../../api/AuthApi';
import { ApiClient } from '../../api/ApiClient';
import { SessionManager } from '../../app/SessionManager';
import { StateManager } from '../../app/StateManager';

// Initialize dependencies
const apiClient = new ApiClient('http://localhost:3000');
const authApi = new AuthApi(apiClient);
const sessionManager = new SessionManager();
const stateManager = new StateManager();

// Get container element
const container = document.getElementById('app');

if (container) {
  // Create LoginForm with success callback
  const loginForm = new LoginForm(
    container,
    authApi,
    sessionManager,
    stateManager,
    () => {
      // Success callback - redirect to playlists page
      console.log('Login successful! Redirecting to playlists...');
      window.location.href = '/playlists';
    }
  );

  // The form is now rendered and ready for user interaction
  console.log('LoginForm initialized');
}

/**
 * Example: Programmatic cleanup
 * 
 * If you need to remove the form programmatically:
 */
function cleanupExample() {
  const container = document.getElementById('app');
  if (container) {
    const loginForm = new LoginForm(
      container,
      authApi,
      sessionManager,
      stateManager
    );

    // Later, when you want to remove the form:
    loginForm.destroy();
  }
}

/**
 * Example: Integration with state management
 * 
 * The LoginForm automatically updates the StateManager on successful login.
 * You can subscribe to state changes to react to login events:
 */
function stateSubscriptionExample() {
  const stateManager = new StateManager();

  // Subscribe to state changes
  const unsubscribe = stateManager.subscribe((state) => {
    if (state.user) {
      console.log('User logged in:', state.user.username);
      // Perform actions after login (e.g., load playlists)
    }
  });

  // Don't forget to unsubscribe when done
  // unsubscribe();
}

/**
 * Example: Custom error handling
 * 
 * The LoginForm handles errors internally, but you can also
 * listen to state changes for error handling:
 */
function errorHandlingExample() {
  const stateManager = new StateManager();

  stateManager.subscribe((state) => {
    if (state.error) {
      console.error('Application error:', state.error);
      // Display custom error UI
    }
  });
}
