/**
 * Main logger implementation with multiple transports and structured logging
 */

import { LogLevel, shouldLog } from "./LogLevel.js";
import {
  LogTransport,
  LogEntry,
  ConsoleTransport,
  FileTransport,
} from "./LogTransport.js";

export interface LoggerConfig {
  name: string;
  level: LogLevel;
  transports: LogTransport[];
  enableStackTrace: boolean;
  enablePerformanceTracking: boolean;
}

export interface LogContext {
  component?: string;
  requestId?: string;
  userId?: string;
  sessionId?: string;
  operation?: string;
  metadata?: Record<string, any>;
}

export interface PerformanceTimer {
  name: string;
  startTime: number;
  end(): void;
}

export class Logger {
  private config: LoggerConfig;
  private context: LogContext = {};

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      name: "ai-toolkit",
      level: LogLevel.INFO,
      transports: [new ConsoleTransport()],
      enableStackTrace: true,
      enablePerformanceTracking: true,
      ...config,
    };
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    const childLogger = new Logger(this.config);
    childLogger.context = { ...this.context, ...context };
    return childLogger;
  }

  /**
   * Set global context for all log entries
   */
  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Clear context
   */
  clearContext(): void {
    this.context = {};
  }

  /**
   * Add a transport
   */
  addTransport(transport: LogTransport): void {
    this.config.transports.push(transport);
  }

  /**
   * Remove a transport by name
   */
  removeTransport(name: string): boolean {
    const index = this.config.transports.findIndex((t) => t.name === name);
    if (index > -1) {
      this.config.transports.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Set minimum log level
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Debug level logging
   */
  debug(
    message: string,
    data?: Record<string, any>,
    context?: LogContext
  ): void {
    this.log(LogLevel.DEBUG, message, data, context);
  }

  /**
   * Info level logging
   */
  info(
    message: string,
    data?: Record<string, any>,
    context?: LogContext
  ): void {
    this.log(LogLevel.INFO, message, data, context);
  }

  /**
   * Warning level logging
   */
  warn(
    message: string,
    data?: Record<string, any>,
    context?: LogContext
  ): void {
    this.log(LogLevel.WARN, message, data, context);
  }

  /**
   * Error level logging
   */
  error(
    message: string,
    data?: Record<string, any>,
    context?: LogContext
  ): void {
    this.log(LogLevel.ERROR, message, data, context);
  }

  /**
   * Critical level logging
   */
  critical(
    message: string,
    data?: Record<string, any>,
    context?: LogContext
  ): void {
    this.log(LogLevel.CRITICAL, message, data, context);
  }

  /**
   * Log an error object
   */
  logError(
    error: Error,
    message?: string,
    data?: Record<string, any>,
    context?: LogContext
  ): void {
    const errorData = {
      ...data,
      error: {
        name: error.name,
        message: error.message,
        ...(this.config.enableStackTrace && { stack: error.stack }),
      },
    };

    this.log(LogLevel.ERROR, message || error.message, errorData, context);
  }

  /**
   * Start a performance timer
   */
  startTimer(name: string): PerformanceTimer {
    const startTime = Date.now();

    return {
      name,
      startTime,
      end: () => {
        const duration = Date.now() - startTime;
        if (this.config.enablePerformanceTracking) {
          this.debug(`Performance: ${name}`, { duration, unit: "ms" });
        }
      },
    };
  }

  /**
   * Log with performance timing
   */
  withTiming<T>(name: string, fn: () => T): T;
  withTiming<T>(name: string, fn: () => Promise<T>): Promise<T>;
  withTiming<T>(name: string, fn: () => T | Promise<T>): T | Promise<T> {
    const timer = this.startTimer(name);

    try {
      const result = fn();

      if (result instanceof Promise) {
        return result.finally(() => timer.end());
      } else {
        timer.end();
        return result;
      }
    } catch (error) {
      timer.end();
      throw error;
    }
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    data?: Record<string, any>,
    context?: LogContext
  ): void {
    if (!shouldLog(level, this.config.level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      data,
      component: context?.component || this.context.component,
      requestId: context?.requestId || this.context.requestId,
      userId: context?.userId || this.context.userId,
      sessionId: context?.sessionId || this.context.sessionId,
    };

    // Send to all transports that accept this log level
    this.config.transports.forEach((transport) => {
      if (shouldLog(level, transport.minLevel)) {
        transport.log(entry).catch((error) => {
          // Fallback error handling - don't let transport errors break logging
          console.error(`Transport ${transport.name} failed:`, error);
        });
      }
    });
  }

  /**
   * Close all transports
   */
  async close(): Promise<void> {
    await Promise.all(
      this.config.transports.map((transport) =>
        transport
          .close()
          .catch((error) =>
            console.error(`Failed to close transport ${transport.name}:`, error)
          )
      )
    );
  }
}

/**
 * Global logger instance
 */
let globalLogger: Logger | null = null;

/**
 * Initialize global logger
 */
export function initializeLogger(config?: Partial<LoggerConfig>): Logger {
  globalLogger = new Logger(config);
  return globalLogger;
}

/**
 * Get global logger instance
 */
export function getLogger(): Logger {
  if (!globalLogger) {
    globalLogger = new Logger();
  }
  return globalLogger;
}

/**
 * Create a logger with file transport
 */
export function createFileLogger(
  filePath: string,
  level: LogLevel = LogLevel.INFO,
  includeConsole: boolean = true
): Logger {
  const transports: LogTransport[] = [new FileTransport(filePath, level)];

  if (includeConsole) {
    transports.push(new ConsoleTransport(level));
  }

  return new Logger({
    name: "file-logger",
    level,
    transports,
  });
}

/**
 * Create a logger for testing
 */
export function createTestLogger(): Logger {
  return new Logger({
    name: "test-logger",
    level: LogLevel.DEBUG,
    transports: [], // No output during tests
  });
}
