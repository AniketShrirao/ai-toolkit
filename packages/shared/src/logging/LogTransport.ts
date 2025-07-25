/**
 * Log transport implementations for different output destinations
 */

import { LogLevel } from "./LogLevel.js";
import {
  LogFormatter,
  JsonLogFormatter,
  ConsoleLogFormatter,
} from "./LogFormatter";
import * as fs from "fs";
import * as path from "path";

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
export class ConsoleTransport implements LogTransport {
  name = "console";
  minLevel: LogLevel;
  private formatter: LogFormatter;

  constructor(minLevel: LogLevel = LogLevel.INFO, useColors: boolean = true) {
    this.minLevel = minLevel;
    this.formatter = new ConsoleLogFormatter(useColors);
  }

  async log(entry: LogEntry): Promise<void> {
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

  async close(): Promise<void> {
    // Nothing to close for console transport
  }
}

/**
 * File transport for persistent logging
 */
export class FileTransport implements LogTransport {
  name = "file";
  minLevel: LogLevel;
  private formatter: LogFormatter;
  private filePath: string;
  private writeStream: fs.WriteStream | null = null;
  private maxFileSize: number;
  private maxFiles: number;

  constructor(
    filePath: string,
    minLevel: LogLevel = LogLevel.INFO,
    maxFileSize: number = 10 * 1024 * 1024, // 10MB
    maxFiles: number = 5
  ) {
    this.minLevel = minLevel;
    this.filePath = filePath;
    this.formatter = new JsonLogFormatter();
    this.maxFileSize = maxFileSize;
    this.maxFiles = maxFiles;
    this.ensureDirectoryExists();
    this.initializeStream();
  }

  async log(entry: LogEntry): Promise<void> {
    if (!this.writeStream) {
      this.initializeStream();
    }

    const formatted = this.formatter.format(entry);

    return new Promise((resolve, reject) => {
      this.writeStream!.write(formatted + "\n", (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  async close(): Promise<void> {
    if (this.writeStream) {
      return new Promise((resolve) => {
        this.writeStream!.end(() => {
          this.writeStream = null;
          resolve();
        });
      });
    }
  }

  private ensureDirectoryExists(): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private initializeStream(): void {
    // Check if file needs rotation
    this.rotateIfNeeded();

    this.writeStream = fs.createWriteStream(this.filePath, { flags: "a" });

    this.writeStream.on("error", (error) => {
      console.error("File transport error:", error);
    });
  }

  private rotateIfNeeded(): void {
    if (!fs.existsSync(this.filePath)) {
      return;
    }

    const stats = fs.statSync(this.filePath);
    if (stats.size >= this.maxFileSize) {
      this.rotateFiles();
    }
  }

  private rotateFiles(): void {
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
        } else {
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
export class MemoryTransport implements LogTransport {
  name = "memory";
  minLevel: LogLevel;
  private entries: LogEntry[] = [];
  private maxEntries: number;

  constructor(minLevel: LogLevel = LogLevel.DEBUG, maxEntries: number = 1000) {
    this.minLevel = minLevel;
    this.maxEntries = maxEntries;
  }

  async log(entry: LogEntry): Promise<void> {
    this.entries.push(entry);

    // Remove oldest entries if we exceed max
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }
  }

  async close(): Promise<void> {
    // Nothing to close for memory transport
  }

  /**
   * Get all stored log entries
   */
  getEntries(): LogEntry[] {
    return [...this.entries];
  }

  /**
   * Get entries by level
   */
  getEntriesByLevel(level: LogLevel): LogEntry[] {
    return this.entries.filter((entry) => entry.level === level);
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.entries = [];
  }

  /**
   * Get entries count
   */
  getCount(): number {
    return this.entries.length;
  }
}

/**
 * Null transport that discards all log entries (for testing)
 */
export class NullTransport implements LogTransport {
  name = "null";
  minLevel: LogLevel = LogLevel.DEBUG;

  async log(entry: LogEntry): Promise<void> {
    // Do nothing
  }

  async close(): Promise<void> {
    // Nothing to close
  }
}
