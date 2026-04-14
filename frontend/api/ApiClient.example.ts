/**
 * ApiClient Usage Examples
 * 
 * This file demonstrates how to use the ApiClient for making HTTP requests
 * to the backend API with proper error handling and authentication.
 */

import { ApiClient, ApiError } from './ApiClient';

// Initialize the API client with the base URL
const apiClient = new ApiClient('http://localhost:3000');

// Example 1: Making a GET request
async function getUserPlaylists() {
  try {
    const playlists = await apiClient.get<Playlist[]>('/api/v1/playlists');
    console.log('User playlists:', playlists);
    return playlists;
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`Error ${error.statusCode}: ${error.message}`);
      if (error.errors) {
        console.error('Validation errors:', error.errors);
      }
    }
    throw error;
  }
}

// Example 2: Making a POST request with authentication
async function login(username: string, password: string) {
  try {
    const response = await apiClient.post<AuthResponse>('/api/v1/auth/login', {
      username,
      password,
    });
    
    // Store the token for subsequent requests
    apiClient.setAuthToken(response.token);
    
    console.log('Login successful:', response.user);
    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.statusCode === 401) {
        console.error('Invalid credentials');
      } else {
        console.error(`Login failed: ${error.message}`);
      }
    }
    throw error;
  }
}

// Example 3: Making a PUT request
async function updatePlaylist(playlistId: string, name: string) {
  try {
    const updated = await apiClient.put<Playlist>(
      `/api/v1/playlists/${playlistId}`,
      { name }
    );
    console.log('Playlist updated:', updated);
    return updated;
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.statusCode === 403) {
        console.error('You do not have permission to update this playlist');
      } else if (error.statusCode === 404) {
        console.error('Playlist not found');
      } else {
        console.error(`Update failed: ${error.message}`);
      }
    }
    throw error;
  }
}

// Example 4: Making a DELETE request
async function deletePlaylist(playlistId: string) {
  try {
    await apiClient.delete(`/api/v1/playlists/${playlistId}`);
    console.log('Playlist deleted successfully');
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`Delete failed: ${error.message}`);
    }
    throw error;
  }
}

// Example 5: Handling authentication expiration
function setupAuthExpirationHandler() {
  window.addEventListener('auth:expired', () => {
    console.log('Session expired, redirecting to login...');
    
    // Clear the token
    apiClient.clearAuthToken();
    
    // Redirect to login page
    window.location.href = '/login';
  });
}

// Example 6: Handling network errors with retry
async function fetchWithRetry() {
  try {
    // The ApiClient automatically retries network errors up to 3 times
    const data = await apiClient.get('/api/v1/playlists');
    return data;
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 0) {
      // Network error after all retries
      console.error('Unable to connect to server. Please check your connection.');
      // Show user-friendly error message in UI
    }
    throw error;
  }
}

// Example 7: Handling validation errors
async function register(username: string, password: string) {
  try {
    const response = await apiClient.post<AuthResponse>('/api/v1/auth/register', {
      username,
      password,
    });
    return response;
  } catch (error) {
    if (error instanceof ApiError && error.errors) {
      // Display validation errors to the user
      Object.entries(error.errors).forEach(([field, messages]) => {
        console.error(`${field}: ${messages.join(', ')}`);
        // Update UI to show field-specific errors
      });
    }
    throw error;
  }
}

// Type definitions for examples
interface Playlist {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  songCount?: number;
}

interface AuthResponse {
  token: string;
  expiresAt: string;
  user: {
    id: string;
    username: string;
  };
}

// Initialize auth expiration handler on app startup
setupAuthExpirationHandler();
