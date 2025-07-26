/**
 * Main logger implementation with multiple transports and structured logging
 */
import { LogLevel } from "./LogLevel.js";
import { LogTransport } from "./LogTransport.js";
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
export declare class Logger {
    private config;
    private context;
    constructor(config?: Partial<LoggerConfig>);
    /**
     * Create a child logger with additional context
     */
    child(context: LogContext): Logger;
    /**
     * Set global context for all log entries
     */
    setContext(context: LogContext): void;
    /**
     * Clear context
     */
    clearContext(): void;
    /**
     * Add a transport
     */
    addTransport(transport: LogTransport): void;
    /**
     * Remove a transport by name
     */
    removeTransport(name: string): boolean;
    /**
     * Set minimum log level
     */
    setLevel(level: LogLevel): void;
    /**
     * Debug level logging
     */
    debug(message: string, data?: Record<string, any>, context?: LogContext): void;
    /**
     * Info level logging
     */
    info(message: string, data?: Record<string, any>, context?: LogContext): void;
    /**
     * Warning level logging
     */
    warn(message: string, data?: Record<string, any>, context?: LogContext): void;
    /**
     * Error level logging
     */
    error(message: string, data?: Record<string, any>, context?: LogContext): void;
    /**
     * Critical level logging
     */
    critical(message: string, data?: Record<string, any>, context?: LogContext): void;
    /**
     * Log an error object
     */
    logError(error: Error, message?: string, data?: Record<string, any>, context?: LogContext): void;
    /**
     * Start a performance timer
     */
    startTimer(name: string): PerformanceTimer;
    /**
     * Log with performance timing
     */
    withTiming<T>(name: string, fn: () => T): T;
    withTiming<T>(name: string, fn: () => Promise<T>): Promise<T>;
    /**
     * Core logging method
     */
    private log;
    /**
     * Close all transports
     */
    close(): Promise<void>;
}
/**
 * Initialize global logger
 */
export declare function initializeLogger(config?: Partial<LoggerConfig>): Logger;
/**
 * Get global logger instance
 */
export declare function getLogger(): Logger;
/**
 * Create a logger with file transport
 */
export declare function createFileLogger(filePath: string, level?: LogLevel, includeConsole?: boolean): Logger;
/**
 * Create a logger for testing
 */
export declare function createTestLogger(): Logger;
//# sourceMappingURL=Logger.d.ts.map