/**
 * ApiClient - HTTP client for communicating with the backend API
 * 
 * Features:
 * - HTTP methods: GET, POST, PUT, DELETE
 * - Authorization header support with token management
 * - Network error handling with user-friendly messages
 * - 401 handling that dispatches 'auth:expired' event
 * - Retry logic for timeouts (up to 3 attempts)
 * 
 * Requirements: 1.3, 5.5, 5.6, 5.7, 5.1, 5.2
 */

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errors?: Record<string, string[]>;

  constructor(
    message: string,
    statusCode: number,
    errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}

/**
 * HTTP client for API communication
 */
export class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second

  constructor(baseUrl?: string) {
    // Use provided baseUrl or fallback to environment variable or localhost
    const url = baseUrl || import.meta.env.VITE_API_URL || 'http://localhost:4000';
    this.baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  }

  /**
   * Set the authentication token for subsequent requests
   */
  setAuthToken(token: string): void {
    this.token = token;
  }

  /**
   * Clear the authentication token
   */
  clearAuthToken(): void {
    this.token = null;
  }

  /**
   * Perform a GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>('GET', endpoint);
  }

  /**
   * Perform a POST request
   */
  async post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>('POST', endpoint, data);
  }

  /**
   * Perform a PUT request
   */
  async put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>('PUT', endpoint, data);
  }

  /**
   * Perform a DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>('DELETE', endpoint);
  }

  /**
   * Internal request method with error handling and retry logic
   */
  private async request<T>(
    method: string,
    endpoint: string,
    data?: unknown,
    attempt: number = 1
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add authorization header if token is available
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      method,
      headers,
    };

    // Add body for POST, PUT requests
    if (data && (method === 'POST' || method === 'PUT')) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);

      // Handle 401 Unauthorized - dispatch auth:expired event
      if (response.status === 401) {
        this.dispatchAuthExpiredEvent();
        throw new ApiError(
          'Your session has expired. Please log in again.',
          401
        );
      }

      // Handle other error responses
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return undefined as T;
      }

      // Parse JSON response
      const result = await response.json();
      return result as T;

    } catch (error) {
      // If it's already an ApiError, rethrow it
      if (error instanceof ApiError) {
        throw error;
      }

      // Handle network errors (timeout, connection refused, etc.)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        // Retry logic for network errors (up to 3 attempts)
        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * attempt);
          return this.request<T>(method, endpoint, data, attempt + 1);
        }

        throw new ApiError(
          'Unable to connect to the server. Please check your internet connection and try again.',
          0
        );
      }

      // Handle other unexpected errors
      throw new ApiError(
        'An unexpected error occurred. Please try again.',
        0
      );
    }
  }

  /**
   * Handle error responses from the API
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let errorMessage = 'An error occurred';
    let errors: Record<string, string[]> | undefined;

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
      errors = errorData.errors;
    } catch {
      // If response body is not JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }

    throw new ApiError(errorMessage, response.status, errors);
  }

  /**
   * Dispatch custom event when authentication expires
   */
  private dispatchAuthExpiredEvent(): void {
    const event = new CustomEvent('auth:expired', {
      detail: { message: 'Authentication token has expired' }
    });
    window.dispatchEvent(event);
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
