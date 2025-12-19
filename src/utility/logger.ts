/**
 * Logger Utility
 * Centralized logging with environment-aware output
 *
 * - Development: Full logging to console
 * - Production: Only errors and warnings (can be extended for crash reporting)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean;
  minLevel: LogLevel;
  prefix?: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const isDevelopment = __DEV__;

const defaultConfig: LoggerConfig = {
  enabled: true,
  minLevel: isDevelopment ? 'debug' : 'warn',
};

class Logger {
  private config: LoggerConfig;
  private prefix: string;

  constructor(prefix: string = '', config: Partial<LoggerConfig> = {}) {
    this.prefix = prefix;
    this.config = { ...defaultConfig, ...config };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel];
  }

  private formatMessage(message: string): string {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 12);
    return this.prefix ? `[${timestamp}][${this.prefix}] ${message}` : `[${timestamp}] ${message}`;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage(message), ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage(message), ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage(message), ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage(message), ...args);
      // In production, you could send to crash reporting service here
      // e.g., Sentry.captureException(new Error(message));
    }
  }

  /**
   * Create a child logger with a sub-prefix
   */
  child(subPrefix: string): Logger {
    const newPrefix = this.prefix ? `${this.prefix}:${subPrefix}` : subPrefix;
    return new Logger(newPrefix, this.config);
  }
}

// Pre-configured loggers for different modules
export const appLogger = new Logger('App');
export const callLogger = new Logger('Call');
export const socketLogger = new Logger('Socket');
export const audioLogger = new Logger('Audio');
export const webrtcLogger = new Logger('WebRTC');

// Factory function for creating module-specific loggers
export const createLogger = (prefix: string, config?: Partial<LoggerConfig>): Logger => {
  return new Logger(prefix, config);
};

export default Logger;
