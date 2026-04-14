/**
 * RegisterForm - Usage Example
 * 
 * This example demonstrates how to use the RegisterForm component
 * in your application.
 */

import { RegisterForm } from './RegisterForm';
import { AuthApi } from '../../api/AuthApi';
import { ApiClient } from '../../api/ApiClient';
import { SessionManager } from '../../app/SessionManager';
import { StateManager } from '../../app/StateManager';

// Example 1: Basic usage with redirect to playlists
function example1() {
  // Get or create container element
  const container = document.getElementById('register-container');
  if (!container) {
    console.error('Container element not found');
    return;
  }

  // Initialize dependencies
  const apiClient = new ApiClient('http://localhost:3000');
  const authApi = new AuthApi(apiClient);
  const sessionManager = new SessionManager();
  const stateManager = new StateManager();

  // Create RegisterForm with success callback
  const registerForm = new RegisterForm(
    container,
    authApi,
    sessionManager,
    stateManager,
    () => {
      // Redirect to playlists page on successful registration
      window.location.href = '/playlists';
    }
  );

  console.log('RegisterForm initialized');
}

// Example 2: Usage with custom success handler
function example2() {
  const container = document.getElementById('register-container');
  if (!container) return;

  const apiClient = new ApiClient('http://localhost:3000');
  const authApi = new AuthApi(apiClient);
  const sessionManager = new SessionManager();
  const stateManager = new StateManager();

  // Create RegisterForm with custom success handler
  const registerForm = new RegisterForm(
    container,
    authApi,
    sessionManager,
    stateManager,
    () => {
      // Show welcome message
      alert('Welcome to Waveline! Your account has been created.');
      
      // Navigate to onboarding or playlists
      window.location.href = '/onboarding';
    }
  );
}

// Example 3: Usage with state subscription
function example3() {
  const container = document.getElementById('register-container');
  if (!container) return;

  const apiClient = new ApiClient('http://localhost:3000');
  const authApi = new AuthApi(apiClient);
  const sessionManager = new SessionManager();
  const stateManager = new StateManager();

  // Subscribe to state changes
  const unsubscribe = stateManager.subscribe((state) => {
    if (state.user) {
      console.log('User registered:', state.user.username);
      // Update UI based on user state
    }
  });

  // Create RegisterForm
  const registerForm = new RegisterForm(
    container,
    authApi,
    sessionManager,
    stateManager,
    () => {
      console.log('Registration successful');
      // Redirect after short delay to show success state
      setTimeout(() => {
        window.location.href = '/playlists';
      }, 1000);
    }
  );

  // Clean up subscription when done
  // unsubscribe();
}

// Example 4: Usage without success callback (for testing)
function example4() {
  const container = document.getElementById('register-container');
  if (!container) return;

  const apiClient = new ApiClient('http://localhost:3000');
  const authApi = new AuthApi(apiClient);
  const sessionManager = new SessionManager();
  const stateManager = new StateManager();

  // Create RegisterForm without callback
  const registerForm = new RegisterForm(
    container,
    authApi,
    sessionManager,
    stateManager
  );

  // Session and state will still be updated on successful registration
  // but no redirect will occur
}

// Example 5: Programmatic cleanup
function example5() {
  const container = document.getElementById('register-container');
  if (!container) return;

  const apiClient = new ApiClient('http://localhost:3000');
  const authApi = new AuthApi(apiClient);
  const sessionManager = new SessionManager();
  const stateManager = new StateManager();

  const registerForm = new RegisterForm(
    container,
    authApi,
    sessionManager,
    stateManager,
    () => {
      window.location.href = '/playlists';
    }
  );

  // Later, when you need to clean up (e.g., navigating away)
  // registerForm.destroy();
}

// Example 6: Integration with router
function example6() {
  // Assuming you have a router setup
  const router = {
    navigate: (path: string) => {
      console.log(`Navigating to ${path}`);
      // Your router logic here
    }
  };

  const container = document.getElementById('register-container');
  if (!container) return;

  const apiClient = new ApiClient('http://localhost:3000');
  const authApi = new AuthApi(apiClient);
  const sessionManager = new SessionManager();
  const stateManager = new StateManager();

  const registerForm = new RegisterForm(
    container,
    authApi,
    sessionManager,
    stateManager,
    () => {
      // Use router for navigation
      router.navigate('/playlists');
    }
  );
}

// HTML structure example
const htmlExample = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Register - Waveline</title>
</head>
<body>
  <!-- Container for RegisterForm -->
  <div id="register-container"></div>

  <!-- Your app scripts -->
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
`;

// Export examples
export {
  example1,
  example2,
  example3,
  example4,
  example5,
  example6,
  htmlExample,
};
