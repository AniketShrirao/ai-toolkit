/**
 * Tests for log transport implementations
 */

import {
  ConsoleTransport,
  FileTransport,
  MemoryTransport,
  NullTransport,
  LogEntry,
} from "../../logging/LogTransport.js";
import { LogLevel } from "../../logging/LogLevel.js";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { vi } from "vitest";

describe("LogTransport", () => {
  const mockLogEntry: LogEntry = {
    timestamp: new Date(),
    level: LogLevel.INFO,
    message: "Test message",
    data: { key: "value" },
    component: "test-component",
    requestId: "req-123",
    userId: "user-456",
    sessionId: "session-789",
  };

  describe("ConsoleTransport", () => {
    let originalConsole: typeof console;
    let mockConsole: any;

    beforeEach(() => {
      originalConsole = console;
      mockConsole = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      } as any;
      global.console = mockConsole;
    });

    afterEach(() => {
      global.console = originalConsole;
    });

    it("should log to appropriate console method", async () => {
      const transport = new ConsoleTransport(LogLevel.DEBUG);

      await transport.log({ ...mockLogEntry, level: LogLevel.DEBUG });
      await transport.log({ ...mockLogEntry, level: LogLevel.INFO });
      await transport.log({ ...mockLogEntry, level: LogLevel.WARN });
      await transport.log({ ...mockLogEntry, level: LogLevel.ERROR });
      await transport.log({ ...mockLogEntry, level: LogLevel.CRITICAL });

      expect(mockConsole.debug).toHaveBeenCalledTimes(1);
      expect(mockConsole.info).toHaveBeenCalledTimes(1);
      expect(mockConsole.warn).toHaveBeenCalledTimes(1);
      expect(mockConsole.error).toHaveBeenCalledTimes(2); // ERROR and CRITICAL
    });

    it("should format messages with colors by default", async () => {
      const transport = new ConsoleTransport(LogLevel.DEBUG, true);

      await transport.log(mockLogEntry);

      const loggedMessage = mockConsole.info.mock.calls[0][0];
      expect(loggedMessage).toContain("\x1b[32m"); // Green color for INFO
      expect(loggedMessage).toContain("\x1b[0m"); // Reset color
    });

    it("should format messages without colors when disabled", async () => {
      const transport = new ConsoleTransport(LogLevel.DEBUG, false);

      await transport.log(mockLogEntry);

      const loggedMessage = mockConsole.info.mock.calls[0][0];
      expect(loggedMessage).not.toContain("\x1b[32m");
      expect(loggedMessage).not.toContain("\x1b[0m");
    });

    it("should close without errors", async () => {
      const transport = new ConsoleTransport();
      await expect(transport.close()).resolves.toBeUndefined();
    });
  });

  describe("FileTransport", () => {
    let tempDir: string;
    let logFile: string;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "log-test-"));
      logFile = path.join(tempDir, "test.log");
    });

    afterEach(async () => {
      // Clean up temp directory
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it("should write log entries to file", async () => {
      const transport = new FileTransport(logFile, LogLevel.DEBUG);

      await transport.log(mockLogEntry);
      await transport.close();

      expect(fs.existsSync(logFile)).toBe(true);

      const content = fs.readFileSync(logFile, "utf8");
      const logLine = JSON.parse(content.trim());

      expect(logLine.level).toBe("INFO");
      expect(logLine.message).toBe("Test message");
      expect(logLine.data).toEqual({ key: "value" });
      expect(logLine.component).toBe("test-component");
    });

    it("should create directory if it doesn't exist", async () => {
      const nestedLogFile = path.join(tempDir, "nested", "dir", "test.log");
      const transport = new FileTransport(nestedLogFile, LogLevel.DEBUG);

      await transport.log(mockLogEntry);
      await transport.close();

      expect(fs.existsSync(nestedLogFile)).toBe(true);
    });

    it("should rotate files when size limit is reached", async () => {
      const smallSizeLimit = 100; // Very small limit to trigger rotation
      const transport = new FileTransport(
        logFile,
        LogLevel.DEBUG,
        smallSizeLimit,
        3
      );

      // Write multiple entries to exceed size limit
      for (let i = 0; i < 10; i++) {
        await transport.log({
          ...mockLogEntry,
          message: `Long message ${i} with lots of content to exceed the size limit`,
        });
      }

      await transport.close();

      // Check that rotation occurred
      const rotatedFile = path.join(tempDir, "test.1.log");
      expect(fs.existsSync(logFile)).toBe(true);
      expect(fs.existsSync(rotatedFile)).toBe(true);
    });

    it("should handle write errors gracefully", async () => {
      const transport = new FileTransport(logFile, LogLevel.DEBUG);

      // Close the transport to make writes fail
      await transport.close();

      // Should not throw when logging to closed transport
      await expect(transport.log(mockLogEntry)).rejects.toBeDefined();
    });
  });

  describe("MemoryTransport", () => {
    it("should store log entries in memory", async () => {
      const transport = new MemoryTransport(LogLevel.DEBUG, 100);

      await transport.log(mockLogEntry);

      const entries = transport.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0]).toBe(mockLogEntry);
    });

    it("should limit number of stored entries", async () => {
      const transport = new MemoryTransport(LogLevel.DEBUG, 3);

      // Add more entries than the limit
      for (let i = 0; i < 5; i++) {
        await transport.log({
          ...mockLogEntry,
          message: `Message ${i}`,
        });
      }

      const entries = transport.getEntries();
      expect(entries).toHaveLength(3);
      expect(entries[0].message).toBe("Message 2"); // Oldest entries removed
      expect(entries[2].message).toBe("Message 4");
    });

    it("should filter entries by level", async () => {
      const transport = new MemoryTransport(LogLevel.DEBUG, 100);

      await transport.log({ ...mockLogEntry, level: LogLevel.DEBUG });
      await transport.log({ ...mockLogEntry, level: LogLevel.INFO });
      await transport.log({ ...mockLogEntry, level: LogLevel.ERROR });

      const errorEntries = transport.getEntriesByLevel(LogLevel.ERROR);
      expect(errorEntries).toHaveLength(1);
      expect(errorEntries[0].level).toBe(LogLevel.ERROR);
    });

    it("should clear all entries", async () => {
      const transport = new MemoryTransport(LogLevel.DEBUG, 100);

      await transport.log(mockLogEntry);
      expect(transport.getCount()).toBe(1);

      transport.clear();
      expect(transport.getCount()).toBe(0);
      expect(transport.getEntries()).toHaveLength(0);
    });

    it("should close without errors", async () => {
      const transport = new MemoryTransport();
      await expect(transport.close()).resolves.toBeUndefined();
    });
  });

  describe("NullTransport", () => {
    it("should discard all log entries", async () => {
      const transport = new NullTransport();

      // Should not throw or store anything
      await expect(transport.log(mockLogEntry)).resolves.toBeUndefined();
    });

    it("should close without errors", async () => {
      const transport = new NullTransport();
      await expect(transport.close()).resolves.toBeUndefined();
    });
  });

  describe("transport interface compliance", () => {
    const transports = [
      () => new ConsoleTransport(),
      () => new FileTransport(path.join(os.tmpdir(), "test.log")),
      () => new MemoryTransport(),
      () => new NullTransport(),
    ];

    transports.forEach((createTransport, index) => {
      it(`transport ${index} should implement required interface`, async () => {
        const transport = createTransport();

        expect(transport.name).toBeDefined();
        expect(transport.minLevel).toBeDefined();
        expect(typeof transport.log).toBe("function");
        expect(typeof transport.close).toBe("function");

        await transport.log(mockLogEntry);
        await transport.close();
      });
    });
  });
});
