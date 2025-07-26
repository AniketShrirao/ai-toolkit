/**
 * Log formatters for different output formats
 */
import { LogEntry } from "./LogTransport.js";
export interface LogFormatter {
    format(entry: LogEntry): string;
}
/**
 * JSON formatter for structured logging
 */
export declare class JsonLogFormatter implements LogFormatter {
    format(entry: LogEntry): string;
}
/**
 * Console formatter for human-readable output
 */
export declare class ConsoleLogFormatter implements LogFormatter {
    private useColors;
    constructor(useColors?: boolean);
    format(entry: LogEntry): string;
}
/**
 * Simple formatter for basic text output
 */
export declare class SimpleFormatter implements LogFormatter {
    format(entry: LogEntry): string;
}
/**
 * Compact formatter for minimal output
 */
export declare class CompactFormatter implements LogFormatter {
    format(entry: LogEntry): string;
}
//# sourceMappingURL=LogFormatter.d.ts.map