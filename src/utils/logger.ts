/**
 * Logger Utility - Production-ready logging with levels
 * Only logs in development, removes console noise in production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  prefix: string;
}

const config: LoggerConfig = {
  enabled: import.meta.env.DEV || import.meta.env.MODE === 'development',
  level: 'debug',
  prefix: '[KaliFinder]',
};

const logLevels: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private shouldLog(level: LogLevel): boolean {
    if (!config.enabled && level !== 'error') return false;
    return logLevels[level] >= logLevels[config.level];
  }

  debug(message: string, data?: unknown): void {
    if (this.shouldLog('debug')) {
      console.log(`${config.prefix} ${message}`, data !== undefined ? data : '');
    }
  }

  info(message: string, data?: unknown): void {
    if (this.shouldLog('info')) {
      console.info(`${config.prefix} ℹ️ ${message}`, data !== undefined ? data : '');
    }
  }

  warn(message: string, data?: unknown): void {
    if (this.shouldLog('warn')) {
      console.warn(`${config.prefix} ⚠️ ${message}`, data !== undefined ? data : '');
    }
  }

  error(message: string, error?: unknown): void {
    if (this.shouldLog('error')) {
      console.error(`${config.prefix} ❌ ${message}`, error !== undefined ? error : '');
    }
  }

  // Performance timing
  time(label: string): void {
    if (this.shouldLog('debug')) {
      console.time(`${config.prefix} ${label}`);
    }
  }

  timeEnd(label: string): void {
    if (this.shouldLog('debug')) {
      console.timeEnd(`${config.prefix} ${label}`);
    }
  }

  // Group related logs
  group(label: string): void {
    if (this.shouldLog('debug')) {
      console.group(`${config.prefix} ${label}`);
    }
  }

  groupEnd(): void {
    if (this.shouldLog('debug')) {
      console.groupEnd();
    }
  }
}

export const logger = new Logger();
