/**
 * Log transport implementations for different output destinations
 */
import { LogLevel } from "./LogLevel.js";
export interface LogEntry {
    timestamp: Date;
    level: LogLevel;
    message: string;
    data?: Record<string, any>;
    component?: string;
    requestId?: string;
    userId?: string;
    sessionId?: string;
}
export interface LogTransport {
    name: string;
    minLevel: LogLevel;
    log(entry: LogEntry): Promise<void>;
    close(): Promise<void>;
}
/**
 * Console transport for development and debugging
 */
export declare class ConsoleTransport implements LogTransport {
    name: string;
    minLevel: LogLevel;
    private formatter;
    constructor(minLevel?: LogLevel, useColors?: boolean);
    log(entry: LogEntry): Promise<void>;
    close(): Promise<void>;
}
/**
 * File transport for persistent logging
 */
export declare class FileTransport implements LogTransport {
    name: string;
    minLevel: LogLevel;
    private formatter;
    private filePath;
    private writeStream;
    private maxFileSize;
    private maxFiles;
    constructor(filePath: string, minLevel?: LogLevel, maxFileSize?: number, // 10MB
    maxFiles?: number);
    log(entry: LogEntry): Promise<void>;
    close(): Promise<void>;
    private ensureDirectoryExists;
    private initializeStream;
    private rotateIfNeeded;
    private rotateFiles;
}
/**
 * Memory transport for testing and temporary storage
 */
export declare class MemoryTransport implements LogTransport {
    name: string;
    minLevel: LogLevel;
    private entries;
    private maxEntries;
    constructor(minLevel?: LogLevel, maxEntries?: number);
    log(entry: LogEntry): Promise<void>;
    close(): Promise<void>;
    /**
     * Get all stored log entries
     */
    getEntries(): LogEntry[];
    /**
     * Get entries by level
     */
    getEntriesByLevel(level: LogLevel): LogEntry[];
    /**
     * Clear all entries
     */
    clear(): void;
    /**
     * Get entries count
     */
    getCount(): number;
}
/**
 * Null transport that discards all log entries (for testing)
 */
export declare class NullTransport implements LogTransport {
    name: string;
    minLevel: LogLevel;
    log(entry: LogEntry): Promise<void>;
    close(): Promise<void>;
}
//# sourceMappingURL=LogTransport.d.ts.map