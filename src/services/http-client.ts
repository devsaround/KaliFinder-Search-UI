/**
 * HTTP Client with Request Retry Logic
 * Handles network requests with exponential backoff and timeout management
 */

import type { WidgetConfig } from '@/config/widget-config';
import {
  ApiError,
  NetworkError,
  TimeoutError,
  isRetryableError,
  parseErrorResponse,
} from './api-errors';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: HeadersInit;
  body?: BodyInit;
  timeout?: number;
  retryConfig?: {
    attempts: number;
    delayMs: number;
  };
}

/**
 * HTTP Client with retry and timeout support
 */
export class HttpClient {
  constructor(private config: WidgetConfig) {}

  /**
   * Perform HTTP request with retry logic
   */
  async request<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.config.api.timeout,
      retryConfig = {
        attempts: this.config.api.retryAttempts,
        delayMs: this.config.api.retryDelay,
      },
    } = options;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retryConfig.attempts; attempt++) {
      try {
        return await this.performRequest<T>(url, {
          method,
          headers,
          body,
          timeout,
        });
      } catch (error) {
        lastError = error as Error;

        // Don't retry if error is not retryable
        if (!isRetryableError(error)) {
          throw error;
        }

        // Don't retry if we've exhausted attempts
        if (attempt === retryConfig.attempts) {
          throw error;
        }

        // Exponential backoff
        const delayMs = retryConfig.delayMs * Math.pow(2, attempt - 1);
        await this.sleep(delayMs);
      }
    }

    // Should never reach here, but throw the last error just in case
    throw lastError || new NetworkError('Request failed after all retries');
  }

  /**
   * Perform single HTTP request with timeout
   */
  private async performRequest<T>(
    url: string,
    options: {
      method: string;
      headers: HeadersInit;
      body?: BodyInit;
      timeout: number;
    }
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout);

    try {
      const response = await fetch(url, {
        method: options.method,
        headers: options.headers,
        body: options.body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await parseErrorResponse(response);
        throw error;
      }

      const json = await response.json();

      // Unwrap {success: true, data: {...}} response format
      if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
        return json.data as T;
      }

      return json as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiError) {
        throw error;
      }

      // Handle AbortError (timeout)
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new TimeoutError(options.timeout);
      }

      // Handle network errors
      if (error instanceof TypeError) {
        throw new NetworkError((error as Error).message);
      }

      throw error;
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * GET request
   */
  async get<T>(url: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(
    url: string,
    body: BodyInit,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<T> {
    return this.request<T>(url, { ...options, method: 'POST', body });
  }
}
