/**
 * Logger Utility
 * Centralized debug logging with mode detection
 * In production, all logs except errors are completely removed by esbuild
 */

let DEBUG_MODE = false;

export function setDebugMode(enabled: boolean): void {
  DEBUG_MODE = enabled;
}

// These will be removed by esbuild in production (drop: ['console'])
export function log(...args: unknown[]): void {
  if (DEBUG_MODE || import.meta.env.DEV) {
    console.log('[Kalifinder]', ...args);
  }
}

export function warn(...args: unknown[]): void {
  if (DEBUG_MODE || import.meta.env.DEV) {
    console.warn('[Kalifinder]', ...args);
  }
}

// Errors are always logged (not dropped)
export function error(...args: unknown[]): void {
  console.error('[Kalifinder]', ...args);
}
