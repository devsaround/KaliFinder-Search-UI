/**
 * Core API Error Handling
 * Comprehensive error definitions and handling strategies
 */

/**
 * Base error class for all API-related errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      context: this.context,
    };
  }
}

/**
 * Network/Connectivity errors
 */
export class NetworkError extends ApiError {
  constructor(message: string = 'Network request failed', context?: Record<string, unknown>) {
    super(message, 0, 'NETWORK_ERROR', context);
    this.name = 'NetworkError';
  }
}

/**
 * Request timeout errors
 */
export class TimeoutError extends ApiError {
  constructor(timeoutMs: number, context?: Record<string, unknown>) {
    super(`Request timed out after ${timeoutMs}ms`, 0, 'TIMEOUT_ERROR', context);
    this.name = 'TimeoutError';
  }
}

/**
 * Rate limiting errors
 */
export class RateLimitError extends ApiError {
  constructor(
    public retryAfter: number,
    message: string = 'Rate limit exceeded',
    context?: Record<string, unknown>
  ) {
    super(message, 429, 'RATE_LIMIT_ERROR', context);
    this.name = 'RateLimitError';
  }
}

/**
 * Validation errors
 */
export class ValidationError extends ApiError {
  constructor(
    public field: string,
    message: string,
    context?: Record<string, unknown>
  ) {
    super(message, 400, 'VALIDATION_ERROR', context);
    this.name = 'ValidationError';
  }
}

/**
 * Parse API response and throw appropriate error
 */
export async function parseErrorResponse(response: Response): Promise<ApiError> {
  try {
    const data = await response.json();

    switch (response.status) {
      case 400:
        return new ValidationError(
          data.field || 'unknown',
          data.message || 'Validation failed',
          data
        );

      case 429:
        return new RateLimitError(
          data.retryAfter || 60,
          data.message || 'Rate limit exceeded',
          data
        );

      case 500:
      case 502:
      case 503:
      case 504:
        return new ApiError(data.message || 'Server error', response.status, 'SERVER_ERROR', data);

      default:
        return new ApiError(
          data.message || `Request failed with status ${response.status}`,
          response.status,
          data.code || 'UNKNOWN_ERROR',
          data
        );
    }
  } catch {
    return new ApiError(
      `Failed to parse error response (${response.status})`,
      response.status,
      'PARSE_ERROR'
    );
  }
}

/**
 * Determine if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof TimeoutError) return true;
  if (error instanceof NetworkError) return true;
  if (error instanceof RateLimitError) return true;

  if (error instanceof ApiError) {
    // Retry on 5xx errors and 429
    return error.statusCode >= 500 || error.statusCode === 429;
  }

  return false;
}

/**
 * Safe error logging that doesn't expose sensitive data
 */
export function logApiError(error: unknown, context: string): void {
  const isDevelopment = import.meta.env.DEV;

  if (error instanceof ApiError) {
    const logMessage = `[${context}] ${error.name}: ${error.message} (${error.code})`;

    if (isDevelopment) {
      console.error(logMessage, error.toJSON());
    } else {
      console.error(logMessage);
    }
  } else if (error instanceof Error) {
    console.error(`[${context}] ${error.name}: ${error.message}`);
  } else {
    console.error(`[${context}] Unknown error:`, error);
  }
}
