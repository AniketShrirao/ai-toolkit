/**
 * Tests for Logger implementation
 */

import {
  Logger,
  createTestLogger,
  createFileLogger,
} from "../../logging/Logger.js";
import { LogLevel } from "../../logging/LogLevel.js";
import { vi } from "vitest";
import {
  MemoryTransport,
  ConsoleTransport,
  NullTransport,
} from "../../logging/LogTransport.js";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

describe("Logger", () => {
  let logger: Logger;
  let memoryTransport: MemoryTransport;

  beforeEach(() => {
    memoryTransport = new MemoryTransport(LogLevel.DEBUG);
    logger = new Logger({
      name: "test-logger",
      level: LogLevel.DEBUG,
      transports: [memoryTransport],
    });
  });

  afterEach(async () => {
    await logger.close();
  });

  describe("basic logging", () => {
    it("should log debug messages", () => {
      logger.debug("Debug message", { key: "value" });

      const entries = memoryTransport.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].level).toBe(LogLevel.DEBUG);
      expect(entries[0].message).toBe("Debug message");
      expect(entries[0].data).toEqual({ key: "value" });
    });

    it("should log info messages", () => {
      logger.info("Info message");

      const entries = memoryTransport.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].level).toBe(LogLevel.INFO);
      expect(entries[0].message).toBe("Info message");
    });

    it("should log warning messages", () => {
      logger.warn("Warning message");

      const entries = memoryTransport.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].level).toBe(LogLevel.WARN);
      expect(entries[0].message).toBe("Warning message");
    });

    it("should log error messages", () => {
      logger.error("Error message");

      const entries = memoryTransport.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].level).toBe(LogLevel.ERROR);
      expect(entries[0].message).toBe("Error message");
    });

    it("should log critical messages", () => {
      logger.critical("Critical message");

      const entries = memoryTransport.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].level).toBe(LogLevel.CRITICAL);
      expect(entries[0].message).toBe("Critical message");
    });
  });

  describe("log levels", () => {
    it("should respect minimum log level", () => {
      logger.setLevel(LogLevel.WARN);

      logger.debug("Debug message");
      logger.info("Info message");
      logger.warn("Warning message");
      logger.error("Error message");

      const entries = memoryTransport.getEntries();
      expect(entries).toHaveLength(2);
      expect(entries[0].level).toBe(LogLevel.WARN);
      expect(entries[1].level).toBe(LogLevel.ERROR);
    });
  });

  describe("context", () => {
    it("should include context in log entries", () => {
      const context = {
        component: "test-component",
        requestId: "req-123",
        userId: "user-456",
        sessionId: "session-789",
      };

      logger.info("Test message", undefined, context);

      const entries = memoryTransport.getEntries();
      expect(entries[0].component).toBe("test-component");
      expect(entries[0].requestId).toBe("req-123");
      expect(entries[0].userId).toBe("user-456");
      expect(entries[0].sessionId).toBe("session-789");
    });

    it("should use global context", () => {
      logger.setContext({
        component: "global-component",
        requestId: "global-req",
      });

      logger.info("Test message");

      const entries = memoryTransport.getEntries();
      expect(entries[0].component).toBe("global-component");
      expect(entries[0].requestId).toBe("global-req");
    });

    it("should override global context with local context", () => {
      logger.setContext({
        component: "global-component",
        requestId: "global-req",
      });

      logger.info("Test message", undefined, {
        component: "local-component",
      });

      const entries = memoryTransport.getEntries();
      expect(entries[0].component).toBe("local-component");
      expect(entries[0].requestId).toBe("global-req");
    });

    it("should clear context", () => {
      logger.setContext({ component: "test-component" });
      logger.clearContext();
      logger.info("Test message");

      const entries = memoryTransport.getEntries();
      expect(entries[0].component).toBeUndefined();
    });
  });

  describe("child loggers", () => {
    it("should create child logger with additional context", () => {
      const childLogger = logger.child({
        component: "child-component",
        operation: "test-operation",
      });

      childLogger.info("Child message");

      const entries = memoryTransport.getEntries();
      expect(entries[0].component).toBe("child-component");
    });

    it("should inherit parent context in child logger", () => {
      logger.setContext({ requestId: "parent-req" });

      const childLogger = logger.child({
        component: "child-component",
      });

      childLogger.info("Child message");

      const entries = memoryTransport.getEntries();
      expect(entries[0].component).toBe("child-component");
      expect(entries[0].requestId).toBe("parent-req");
    });
  });

  describe("error logging", () => {
    it("should log error objects with stack trace", () => {
      const error = new Error("Test error");

      logger.logError(error, "Custom message", { additional: "data" });

      const entries = memoryTransport.getEntries();
      expect(entries[0].level).toBe(LogLevel.ERROR);
      expect(entries[0].message).toBe("Custom message");
      expect(entries[0].data?.error.name).toBe("Error");
      expect(entries[0].data?.error.message).toBe("Test error");
      expect(entries[0].data?.error.stack).toBeDefined();
      expect(entries[0].data?.additional).toBe("data");
    });

    it("should use error message when no custom message provided", () => {
      const error = new Error("Test error");

      logger.logError(error);

      const entries = memoryTransport.getEntries();
      expect(entries[0].message).toBe("Test error");
    });
  });

  describe("performance timing", () => {
    it("should create and end performance timer", (done) => {
      const timer = logger.startTimer("test-operation");

      setTimeout(() => {
        timer.end();

        const entries = memoryTransport.getEntries();
        const perfEntry = entries.find((e) =>
          e.message.includes("Performance: test-operation")
        );

        expect(perfEntry).toBeDefined();
        expect(perfEntry?.level).toBe(LogLevel.DEBUG);
        expect(perfEntry?.data?.duration).toBeGreaterThan(0);
        expect(perfEntry?.data?.unit).toBe("ms");

        done();
      }, 10);
    });

    it("should time synchronous operations", () => {
      const result = logger.withTiming("sync-operation", () => {
        return "test-result";
      });

      expect(result).toBe("test-result");

      const entries = memoryTransport.getEntries();
      const perfEntry = entries.find((e) =>
        e.message.includes("Performance: sync-operation")
      );
      expect(perfEntry).toBeDefined();
    });

    it("should time asynchronous operations", async () => {
      const result = await logger.withTiming("async-operation", async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return "async-result";
      });

      expect(result).toBe("async-result");

      const entries = memoryTransport.getEntries();
      const perfEntry = entries.find((e) =>
        e.message.includes("Performance: async-operation")
      );
      expect(perfEntry).toBeDefined();
    });

    it("should time operations that throw errors", () => {
      expect(() => {
        logger.withTiming("error-operation", () => {
          throw new Error("Test error");
        });
      }).toThrow("Test error");

      const entries = memoryTransport.getEntries();
      const perfEntry = entries.find((e) =>
        e.message.includes("Performance: error-operation")
      );
      expect(perfEntry).toBeDefined();
    });
  });

  describe("transports", () => {
    it("should add transport", () => {
      const newTransport = new MemoryTransport(LogLevel.INFO);
      logger.addTransport(newTransport);

      logger.info("Test message");

      expect(memoryTransport.getEntries()).toHaveLength(1);
      expect(newTransport.getEntries()).toHaveLength(1);
    });

    it("should remove transport by name", () => {
      const newTransport = new MemoryTransport(LogLevel.INFO);
      newTransport.name = "removable-transport";
      logger.addTransport(newTransport);

      const removed = logger.removeTransport("removable-transport");
      expect(removed).toBe(true);

      logger.info("Test message");
      expect(newTransport.getEntries()).toHaveLength(0);
    });

    it("should return false when removing non-existent transport", () => {
      const removed = logger.removeTransport("non-existent");
      expect(removed).toBe(false);
    });

    it("should respect transport minimum levels", () => {
      const infoTransport = new MemoryTransport(LogLevel.INFO);
      const errorTransport = new MemoryTransport(LogLevel.ERROR);

      logger.addTransport(infoTransport);
      logger.addTransport(errorTransport);

      logger.debug("Debug message");
      logger.info("Info message");
      logger.error("Error message");

      expect(memoryTransport.getEntries()).toHaveLength(3); // DEBUG level transport
      expect(infoTransport.getEntries()).toHaveLength(2); // INFO and ERROR
      expect(errorTransport.getEntries()).toHaveLength(1); // ERROR only
    });
  });

  describe("transport error handling", () => {
    it("should handle transport errors gracefully", () => {
      const faultyTransport = {
        name: "faulty-transport",
        minLevel: LogLevel.DEBUG,
        log: vi.fn().mockRejectedValue(new Error("Transport error")),
        close: vi.fn().mockResolvedValue(undefined),
      };

      logger.addTransport(faultyTransport);

      // Should not throw despite transport error
      expect(() => logger.info("Test message")).not.toThrow();
      expect(faultyTransport.log).toHaveBeenCalled();
    });
  });

  describe("factory functions", () => {
    it("should create test logger", () => {
      const testLogger = createTestLogger();
      expect(testLogger).toBeInstanceOf(Logger);
    });

    it("should create file logger", () => {
      const tempFile = path.join(os.tmpdir(), "test-log.log");
      const fileLogger = createFileLogger(tempFile, LogLevel.INFO, false);

      expect(fileLogger).toBeInstanceOf(Logger);

      // Cleanup
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    });
  });

  describe("close", () => {
    it("should close all transports", async () => {
      const transport1 = new NullTransport();
      const transport2 = new NullTransport();

      transport1.close = vi.fn().mockResolvedValue(undefined);
      transport2.close = vi.fn().mockResolvedValue(undefined);

      logger.addTransport(transport1);
      logger.addTransport(transport2);

      await logger.close();

      expect(transport1.close).toHaveBeenCalled();
      expect(transport2.close).toHaveBeenCalled();
    });

    it("should handle transport close errors", async () => {
      const faultyTransport = {
        name: "faulty-transport",
        minLevel: LogLevel.DEBUG,
        log: vi.fn().mockResolvedValue(undefined),
        close: vi.fn().mockRejectedValue(new Error("Close error")),
      };

      logger.addTransport(faultyTransport);

      // Should not throw despite close error
      await expect(logger.close()).resolves.toBeUndefined();
      expect(faultyTransport.close).toHaveBeenCalled();
    });
  });
});
