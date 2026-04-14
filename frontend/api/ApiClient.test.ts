/**
 * Tests for ApiClient
 * 
 * Validates:
 * - HTTP methods (GET, POST, PUT, DELETE)
 * - Authorization header support
 * - Error handling with ApiError class
 * - Network error handling
 * - 401 handling with auth:expired event
 * - Retry logic for timeouts
 * 
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ApiClient, ApiError } from './ApiClient';

describe('ApiClient', () => {
  let apiClient: ApiClient;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    apiClient = new ApiClient('http://localhost:3000');
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should remove trailing slash from baseUrl', () => {
      const client = new ApiClient('http://localhost:3000/');
      expect(client['baseUrl']).toBe('http://localhost:3000');
    });

    it('should keep baseUrl without trailing slash', () => {
      const client = new ApiClient('http://localhost:3000');
      expect(client['baseUrl']).toBe('http://localhost:3000');
    });
  });

  describe('setAuthToken', () => {
    it('should set the authentication token', () => {
      const token = 'test-token-123';
      apiClient.setAuthToken(token);
      expect(apiClient['token']).toBe(token);
    });
  });

  describe('clearAuthToken', () => {
    it('should clear the authentication token', () => {
      apiClient.setAuthToken('test-token');
      apiClient.clearAuthToken();
      expect(apiClient['token']).toBeNull();
    });
  });

  describe('get', () => {
    it('should perform a GET request successfully', async () => {
      const mockData = { id: 1, name: 'Test' };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      });

      const result = await apiClient.get('/api/test');

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3000/api/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result).toEqual(mockData);
    });

    it('should include Authorization header when token is set', async () => {
      const token = 'test-token-123';
      apiClient.setAuthToken(token);

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await apiClient.get('/api/test');

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3000/api/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${token}`,
          }),
        })
      );
    });
  });

  describe('post', () => {
    it('should perform a POST request with data', async () => {
      const requestData = { name: 'Test' };
      const responseData = { id: 1, ...requestData };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => responseData,
      });

      const result = await apiClient.post('/api/test', requestData);

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3000/api/test',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(requestData),
        })
      );
      expect(result).toEqual(responseData);
    });
  });

  describe('put', () => {
    it('should perform a PUT request with data', async () => {
      const requestData = { name: 'Updated' };
      const responseData = { id: 1, ...requestData };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => responseData,
      });

      const result = await apiClient.put('/api/test/1', requestData);

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3000/api/test/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(requestData),
        })
      );
      expect(result).toEqual(responseData);
    });
  });

  describe('delete', () => {
    it('should perform a DELETE request', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      const result = await apiClient.delete('/api/test/1');

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3000/api/test/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
      expect(result).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should throw ApiError with status code and message', async () => {
      const errorResponse = {
        message: 'Resource not found',
      };

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => errorResponse,
      });

      try {
        await apiClient.get('/api/test');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error).toMatchObject({
          message: 'Resource not found',
          statusCode: 404,
        });
      }
    });

    it('should include validation errors in ApiError', async () => {
      const errorResponse = {
        message: 'Validation failed',
        errors: {
          username: ['Username is required'],
          password: ['Password must be at least 8 characters'],
        },
      };

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => errorResponse,
      });

      await expect(apiClient.post('/api/auth/register', {})).rejects.toMatchObject({
        message: 'Validation failed',
        statusCode: 400,
        errors: errorResponse.errors,
      });
    });

    it('should use statusText when response body is not JSON', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Not JSON');
        },
      });

      await expect(apiClient.get('/api/test')).rejects.toMatchObject({
        message: 'Internal Server Error',
        statusCode: 500,
      });
    });
  });

  describe('401 handling', () => {
    it('should dispatch auth:expired event on 401 response', async () => {
      const eventListener = vi.fn();
      window.addEventListener('auth:expired', eventListener);

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      });

      try {
        await apiClient.get('/api/test');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect(eventListener).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'auth:expired',
            detail: { message: 'Authentication token has expired' },
          })
        );
      }

      window.removeEventListener('auth:expired', eventListener);
    });

    it('should throw ApiError with user-friendly message on 401', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      });

      try {
        await apiClient.get('/api/test');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toMatchObject({
          message: 'Your session has expired. Please log in again.',
          statusCode: 401,
        });
      }
    });
  });

  describe('network error handling', () => {
    it('should retry on network error up to 3 times', async () => {
      fetchMock
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
        });

      const result = await apiClient.get('/api/test');

      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ success: true });
    });

    it('should throw user-friendly error after max retries', async () => {
      fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

      await expect(apiClient.get('/api/test')).rejects.toMatchObject({
        message: 'Unable to connect to the server. Please check your internet connection and try again.',
        statusCode: 0,
      });

      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('should handle unexpected errors gracefully', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Unexpected error'));

      await expect(apiClient.get('/api/test')).rejects.toMatchObject({
        message: 'An unexpected error occurred. Please try again.',
        statusCode: 0,
      });
    });
  });

  describe('ApiError class', () => {
    it('should create ApiError with message and statusCode', () => {
      const error = new ApiError('Test error', 400);
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('ApiError');
    });

    it('should create ApiError with validation errors', () => {
      const errors = {
        username: ['Required field'],
        password: ['Too short'],
      };
      const error = new ApiError('Validation failed', 400, errors);
      
      expect(error.errors).toEqual(errors);
    });

    it('should maintain proper stack trace', () => {
      const error = new ApiError('Test error', 400);
      expect(error.stack).toBeDefined();
    });
  });

  describe('endpoint formatting', () => {
    it('should handle endpoints with leading slash', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await apiClient.get('/api/test');

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3000/api/test',
        expect.any(Object)
      );
    });

    it('should handle endpoints without leading slash', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await apiClient.get('api/test');

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3000/api/test',
        expect.any(Object)
      );
    });
  });
});
