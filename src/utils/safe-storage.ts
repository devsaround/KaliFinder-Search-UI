/**
 * Safe Storage Wrapper
 * Provides error-safe localStorage/sessionStorage operations
 * Handles Safari private mode, quota exceeded, and cross-origin restrictions
 */

import { logger } from './logger';

export interface SafeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): boolean;
  removeItem(key: string): boolean;
  clear(): boolean;
  key(index: number): string | null;
  get length(): number;
}

/**
 * Create a safe wrapper around Web Storage API (localStorage/sessionStorage)
 */
function createSafeStorage(storage: Storage, storageName: string): SafeStorage {
  /**
   * Check if storage is available and functional
   */
  const isAvailable = (): boolean => {
    try {
      const testKey = '__storage_test__';
      storage.setItem(testKey, 'test');
      storage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  };

  // Check availability once during initialization
  const available = isAvailable();

  if (!available) {
    logger.warn(`${storageName} is not available (private mode or disabled)`);
  }

  return {
    getItem(key: string): string | null {
      if (!available) return null;

      try {
        return storage.getItem(key);
      } catch (error) {
        logger.error(`Failed to get item from ${storageName}`, { key, error });
        return null;
      }
    },

    setItem(key: string, value: string): boolean {
      if (!available) return false;

      try {
        storage.setItem(key, value);
        return true;
      } catch (error) {
        // Handle quota exceeded errors
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          logger.warn(`${storageName} quota exceeded`, { key });
        } else {
          logger.error(`Failed to set item in ${storageName}`, { key, error });
        }
        return false;
      }
    },

    removeItem(key: string): boolean {
      if (!available) return false;

      try {
        storage.removeItem(key);
        return true;
      } catch (error) {
        logger.error(`Failed to remove item from ${storageName}`, { key, error });
        return false;
      }
    },

    clear(): boolean {
      if (!available) return false;

      try {
        storage.clear();
        return true;
      } catch (error) {
        logger.error(`Failed to clear ${storageName}`, error);
        return false;
      }
    },

    key(index: number): string | null {
      if (!available) return null;

      try {
        return storage.key(index);
      } catch (error) {
        logger.error(`Failed to get key from ${storageName}`, { index, error });
        return null;
      }
    },

    get length(): number {
      if (!available) return 0;

      try {
        return storage.length;
      } catch {
        return 0;
      }
    },
  };
}

/**
 * Safe localStorage wrapper
 */
export const safeLocalStorage: SafeStorage = createSafeStorage(localStorage, 'localStorage');

/**
 * Safe sessionStorage wrapper
 */
export const safeSessionStorage: SafeStorage = createSafeStorage(sessionStorage, 'sessionStorage');

/**
 * JSON-aware storage helpers
 */
export const storageHelpers = {
  /**
   * Get and parse JSON from storage
   */
  getJSON<T = unknown>(storage: SafeStorage, key: string): T | null {
    const value = storage.getItem(key);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('Failed to parse JSON from storage', { key, error });
      return null;
    }
  },

  /**
   * Stringify and set JSON in storage
   */
  setJSON(storage: SafeStorage, key: string, value: unknown): boolean {
    try {
      const json = JSON.stringify(value);
      return storage.setItem(key, json);
    } catch (error) {
      logger.error('Failed to stringify JSON for storage', { key, error });
      return false;
    }
  },

  /**
   * Get with default value
   */
  getWithDefault(storage: SafeStorage, key: string, defaultValue: string): string {
    return storage.getItem(key) ?? defaultValue;
  },

  /**
   * Get JSON with default value
   */
  getJSONWithDefault<T>(storage: SafeStorage, key: string, defaultValue: T): T {
    return this.getJSON<T>(storage, key) ?? defaultValue;
  },
};
