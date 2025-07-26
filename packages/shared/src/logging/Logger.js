/**
 * Main logger implementation with multiple transports and structured logging
 */
import { LogLevel, shouldLog } from "./LogLevel.js";
import { ConsoleTransport, FileTransport, } from "./LogTransport.js";
export class Logger {
    config;
    context = {};
    constructor(config = {}) {
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
    child(context) {
        const childLogger = new Logger(this.config);
        childLogger.context = { ...this.context, ...context };
        return childLogger;
    }
    /**
     * Set global context for all log entries
     */
    setContext(context) {
        this.context = { ...this.context, ...context };
    }
    /**
     * Clear context
     */
    clearContext() {
        this.context = {};
    }
    /**
     * Add a transport
     */
    addTransport(transport) {
        this.config.transports.push(transport);
    }
    /**
     * Remove a transport by name
     */
    removeTransport(name) {
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
    setLevel(level) {
        this.config.level = level;
    }
    /**
     * Debug level logging
     */
    debug(message, data, context) {
        this.log(LogLevel.DEBUG, message, data, context);
    }
    /**
     * Info level logging
     */
    info(message, data, context) {
        this.log(LogLevel.INFO, message, data, context);
    }
    /**
     * Warning level logging
     */
    warn(message, data, context) {
        this.log(LogLevel.WARN, message, data, context);
    }
    /**
     * Error level logging
     */
    error(message, data, context) {
        this.log(LogLevel.ERROR, message, data, context);
    }
    /**
     * Critical level logging
     */
    critical(message, data, context) {
        this.log(LogLevel.CRITICAL, message, data, context);
    }
    /**
     * Log an error object
     */
    logError(error, message, data, context) {
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
    startTimer(name) {
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
    withTiming(name, fn) {
        const timer = this.startTimer(name);
        try {
            const result = fn();
            if (result instanceof Promise) {
                return result.finally(() => timer.end());
            }
            else {
                timer.end();
                return result;
            }
        }
        catch (error) {
            timer.end();
            throw error;
        }
    }
    /**
     * Core logging method
     */
    log(level, message, data, context) {
        if (!shouldLog(level, this.config.level)) {
            return;
        }
        const entry = {
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
    async close() {
        await Promise.all(this.config.transports.map((transport) => transport
            .close()
            .catch((error) => console.error(`Failed to close transport ${transport.name}:`, error))));
    }
}
/**
 * Global logger instance
 */
let globalLogger = null;
/**
 * Initialize global logger
 */
export function initializeLogger(config) {
    globalLogger = new Logger(config);
    return globalLogger;
}
/**
 * Get global logger instance
 */
export function getLogger() {
    if (!globalLogger) {
        globalLogger = new Logger();
    }
    return globalLogger;
}
/**
 * Create a logger with file transport
 */
export function createFileLogger(filePath, level = LogLevel.INFO, includeConsole = true) {
    const transports = [new FileTransport(filePath, level)];
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
export function createTestLogger() {
    return new Logger({
        name: "test-logger",
        level: LogLevel.DEBUG,
        transports: [], // No output during tests
    });
}
//# sourceMappingURL=Logger.js.map