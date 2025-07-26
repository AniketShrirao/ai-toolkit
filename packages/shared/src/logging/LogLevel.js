/**
 * Log level definitions and utilities
 */
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
    LogLevel[LogLevel["CRITICAL"] = 4] = "CRITICAL";
})(LogLevel || (LogLevel = {}));
export const LogLevelNames = {
    [LogLevel.DEBUG]: "DEBUG",
    [LogLevel.INFO]: "INFO",
    [LogLevel.WARN]: "WARN",
    [LogLevel.ERROR]: "ERROR",
    [LogLevel.CRITICAL]: "CRITICAL",
};
export const LogLevelColors = {
    [LogLevel.DEBUG]: "\x1b[36m", // Cyan
    [LogLevel.INFO]: "\x1b[32m", // Green
    [LogLevel.WARN]: "\x1b[33m", // Yellow
    [LogLevel.ERROR]: "\x1b[31m", // Red
    [LogLevel.CRITICAL]: "\x1b[35m", // Magenta
};
export const RESET_COLOR = "\x1b[0m";
/**
 * Parse log level from string
 */
export function parseLogLevel(level) {
    const upperLevel = level.toUpperCase();
    switch (upperLevel) {
        case "DEBUG":
            return LogLevel.DEBUG;
        case "INFO":
            return LogLevel.INFO;
        case "WARN":
        case "WARNING":
            return LogLevel.WARN;
        case "ERROR":
            return LogLevel.ERROR;
        case "CRITICAL":
        case "FATAL":
            return LogLevel.CRITICAL;
        default:
            throw new Error(`Invalid log level: ${level}`);
    }
}
/**
 * Check if a log level should be logged based on minimum level
 */
export function shouldLog(level, minLevel) {
    return level >= minLevel;
}
//# sourceMappingURL=LogLevel.js.map