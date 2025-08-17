/**
 * Environment-Aware Logger for Enabl Health
 * 
 * Provides clean logging that:
 * - In production: Only shows errors and warnings (silent debug/info)
 * - In development/staging: Shows all logs with emojis for better DX
 * 
 * This ensures production builds are clean while preserving
 * the helpful development experience with detailed logging.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogData {
  [key: string]: unknown;
}

class Logger {
  private isProduction = process.env.NODE_ENV === 'production';
  private appEnv = process.env.NEXT_PUBLIC_APP_ENV || 'development';

  /**
   * Debug level logging - silenced in production
   * Use for detailed technical information during development
   */
  debug(message: string, data?: LogData | string | number | boolean): void {
    if (!this.isProduction) {
      console.log(message, data || '');
    }
  }

  /**
   * Info level logging - silenced in production
   * Use for general application flow information
   */
  info(message: string, data?: LogData | string | number | boolean): void {
    if (!this.isProduction) {
      console.log(message, data || '');
    }
  }

  /**
   * Warning level logging - always shown
   * Use for potentially problematic situations
   */
  warn(message: string, data?: LogData | string | number | boolean): void {
    console.warn(message, data || '');
  }

  /**
   * Error level logging - always shown
   * Use for error conditions that need attention
   */
  error(message: string, error?: unknown): void {
    console.error(message, error || '');
  }

  /**
   * Success logging - silenced in production
   * Use for positive confirmation messages during development
   */
  success(message: string, data?: LogData | string | number | boolean | unknown): void {
    if (!this.isProduction) {
      console.log(message, data || '');
    }
  }

  /**
   * Development-only logging that also checks app environment
   * Use for logs that should only appear in development builds
   */
  dev(message: string, data?: LogData | string | number | boolean): void {
    if (!this.isProduction && this.appEnv === 'development') {
      console.log(message, data || '');
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export default for convenience
export default logger;
