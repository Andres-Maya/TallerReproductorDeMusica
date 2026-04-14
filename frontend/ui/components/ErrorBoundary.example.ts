/**
 * ErrorBoundary Usage Example
 * 
 * This file demonstrates how to use the ErrorBoundary component
 * to catch and display unhandled errors in your application.
 */

import { ErrorBoundary } from './ErrorBoundary';

// Example 1: Basic usage - Set up error boundary on app initialization
function initializeApp() {
  // Get or create a container for error display
  const errorContainer = document.getElementById('error-boundary-container') 
    || createErrorContainer();
  
  // Create the error boundary
  const errorBoundary = new ErrorBoundary(errorContainer);
  
  console.log('ErrorBoundary initialized and ready to catch errors');
  
  return errorBoundary;
}

// Helper function to create error container
function createErrorContainer(): HTMLElement {
  const container = document.createElement('div');
  container.id = 'error-boundary-container';
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.right = '0';
  container.style.zIndex = '9999';
  document.body.prepend(container);
  return container;
}

// Example 2: Manually handle specific errors
function handleSpecificError(errorBoundary: ErrorBoundary) {
  try {
    // Some risky operation
    throw new Error('Something went wrong in this operation');
  } catch (error) {
    // Manually pass the error to the boundary
    if (error instanceof Error) {
      errorBoundary.handleError(error);
    }
  }
}

// Example 3: Reset error boundary programmatically
function resetErrorBoundary(errorBoundary: ErrorBoundary) {
  // Clear the error state without reloading the page
  errorBoundary.reset();
  console.log('Error boundary reset');
}

// Example 4: Integration with error tracking service (e.g., Sentry)
function setupErrorTracking() {
  // Mock error tracking service
  window.errorTracker = {
    captureException: (error: Error) => {
      console.log('Error reported to tracking service:', error.message);
      // In production, this would send to Sentry, LogRocket, etc.
    }
  };
}

// Example 5: Simulate errors for testing
function simulateErrors() {
  // Simulate an unhandled error
  setTimeout(() => {
    throw new Error('Simulated unhandled error');
  }, 1000);
  
  // Simulate an unhandled promise rejection
  setTimeout(() => {
    Promise.reject(new Error('Simulated promise rejection'));
  }, 2000);
}

// Example 6: Complete application setup
export function setupErrorHandling() {
  // 1. Set up error tracking (optional)
  setupErrorTracking();
  
  // 2. Initialize error boundary
  const errorBoundary = initializeApp();
  
  // 3. Expose error boundary for manual error handling
  (window as any).errorBoundary = errorBoundary;
  
  console.log('Error handling setup complete');
  
  return errorBoundary;
}

// Example 7: Usage in main.ts
/*
import { setupErrorHandling } from './ui/components/ErrorBoundary.example';

// Set up error boundary at the start of your application
const errorBoundary = setupErrorHandling();

// Now all unhandled errors will be caught and displayed
// You can also manually handle errors:
try {
  // Your application code
} catch (error) {
  if (error instanceof Error) {
    errorBoundary.handleError(error);
  }
}
*/

// Example 8: HTML structure for error boundary container
/*
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Music Player</title>
</head>
<body>
  <!-- Error boundary container (will be created automatically if not present) -->
  <div id="error-boundary-container"></div>
  
  <!-- Your application content -->
  <div id="app">
    <!-- App content here -->
  </div>
  
  <script type="module" src="/main.ts"></script>
</body>
</html>
*/
