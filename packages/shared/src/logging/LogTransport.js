/**
 * Log transport implementations for different output destinations
 */
import { LogLevel } from "./LogLevel.js";
import { JsonLogFormatter, ConsoleLogFormatter, } from "./LogFormatter";
import * as fs from "fs";
import * as path from "path";
/**
 * Console transport for development and debugging
 */
export class ConsoleTransport {
    name = "console";
    minLevel;
    formatter;
    constructor(minLevel = LogLevel.INFO, useColors = true) {
        this.minLevel = minLevel;
        this.formatter = new ConsoleLogFormatter(useColors);
    }
    async log(entry) {
        const formatted = this.formatter.format(entry);
        // Use appropriate console method based on log level
        switch (entry.level) {
            case LogLevel.DEBUG:
                console.debug(formatted);
                break;
            case LogLevel.INFO:
                console.info(formatted);
                break;
            case LogLevel.WARN:
                console.warn(formatted);
                break;
            case LogLevel.ERROR:
            case LogLevel.CRITICAL:
                console.error(formatted);
                break;
        }
    }
    async close() {
        // Nothing to close for console transport
    }
}
/**
 * File transport for persistent logging
 */
export class FileTransport {
    name = "file";
    minLevel;
    formatter;
    filePath;
    writeStream = null;
    maxFileSize;
    maxFiles;
    constructor(filePath, minLevel = LogLevel.INFO, maxFileSize = 10 * 1024 * 1024, // 10MB
    maxFiles = 5) {
        this.minLevel = minLevel;
        this.filePath = filePath;
        this.formatter = new JsonLogFormatter();
        this.maxFileSize = maxFileSize;
        this.maxFiles = maxFiles;
        this.ensureDirectoryExists();
        this.initializeStream();
    }
    async log(entry) {
        if (!this.writeStream) {
            this.initializeStream();
        }
        const formatted = this.formatter.format(entry);
        return new Promise((resolve, reject) => {
            this.writeStream.write(formatted + "\n", (error) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve();
                }
            });
        });
    }
    async close() {
        if (this.writeStream) {
            return new Promise((resolve) => {
                this.writeStream.end(() => {
                    this.writeStream = null;
                    resolve();
                });
            });
        }
    }
    ensureDirectoryExists() {
        const dir = path.dirname(this.filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }
    initializeStream() {
        // Check if file needs rotation
        this.rotateIfNeeded();
        this.writeStream = fs.createWriteStream(this.filePath, { flags: "a" });
        this.writeStream.on("error", (error) => {
            console.error("File transport error:", error);
        });
    }
    rotateIfNeeded() {
        if (!fs.existsSync(this.filePath)) {
            return;
        }
        const stats = fs.statSync(this.filePath);
        if (stats.size >= this.maxFileSize) {
            this.rotateFiles();
        }
    }
    rotateFiles() {
        const dir = path.dirname(this.filePath);
        const ext = path.extname(this.filePath);
        const basename = path.basename(this.filePath, ext);
        // Rotate existing files
        for (let i = this.maxFiles - 1; i >= 1; i--) {
            const oldFile = path.join(dir, `${basename}.${i}${ext}`);
            const newFile = path.join(dir, `${basename}.${i + 1}${ext}`);
            if (fs.existsSync(oldFile)) {
                if (i === this.maxFiles - 1) {
                    fs.unlinkSync(oldFile); // Delete oldest file
                }
                else {
                    fs.renameSync(oldFile, newFile);
                }
            }
        }
        // Move current file to .1
        const rotatedFile = path.join(dir, `${basename}.1${ext}`);
        if (fs.existsSync(this.filePath)) {
            fs.renameSync(this.filePath, rotatedFile);
        }
    }
}
/**
 * Memory transport for testing and temporary storage
 */
export class MemoryTransport {
    name = "memory";
    minLevel;
    entries = [];
    maxEntries;
    constructor(minLevel = LogLevel.DEBUG, maxEntries = 1000) {
        this.minLevel = minLevel;
        this.maxEntries = maxEntries;
    }
    async log(entry) {
        this.entries.push(entry);
        // Remove oldest entries if we exceed max
        if (this.entries.length > this.maxEntries) {
            this.entries = this.entries.slice(-this.maxEntries);
        }
    }
    async close() {
        // Nothing to close for memory transport
    }
    /**
     * Get all stored log entries
     */
    getEntries() {
        return [...this.entries];
    }
    /**
     * Get entries by level
     */
    getEntriesByLevel(level) {
        return this.entries.filter((entry) => entry.level === level);
    }
    /**
     * Clear all entries
     */
    clear() {
        this.entries = [];
    }
    /**
     * Get entries count
     */
    getCount() {
        return this.entries.length;
    }
}
/**
 * Null transport that discards all log entries (for testing)
 */
export class NullTransport {
    name = "null";
    minLevel = LogLevel.DEBUG;
    async log(entry) {
        // Do nothing
    }
    async close() {
        // Nothing to close
    }
}
//# sourceMappingURL=LogTransport.js.map