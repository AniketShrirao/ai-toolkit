/**
 * Log level definitions and utilities
 */
export declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    CRITICAL = 4
}
export declare const LogLevelNames: Record<LogLevel, string>;
export declare const LogLevelColors: Record<LogLevel, string>;
export declare const RESET_COLOR = "\u001B[0m";
/**
 * Parse log level from string
 */
export declare function parseLogLevel(level: string): LogLevel;
/**
 * Check if a log level should be logged based on minimum level
 */
export declare function shouldLog(level: LogLevel, minLevel: LogLevel): boolean;
//# sourceMappingURL=LogLevel.d.ts.map