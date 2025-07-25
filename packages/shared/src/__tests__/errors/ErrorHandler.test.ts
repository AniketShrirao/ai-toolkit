/**
 * Tests for error handler
 */

import { ErrorHandler, ErrorHandlerConfig } from "../../errors/ErrorHandler.js";
import {
  OllamaConnectionError,
  ErrorCategory,
  ErrorSeverity,
} from "../../errors/ErrorTypes.js";
import { vi } from "vitest";
import { Logger, createTestLogger } from "../../logging/Logger.js";
import { MemoryTransport } from "../../logging/LogTransport.js";
import { LogLevel } from "../../logging/LogLevel.js";

describe("ErrorHandler", () => {
  let logger: Logger;
  let memoryTransport: MemoryTransport;
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    memoryTransport = new MemoryTransport(LogLevel.DEBUG);
    logger = createTestLogger();
    logger.addTransport(memoryTransport);

    errorHandler = new ErrorHandler(logger, {
      enableRecovery: true,
      maxRecoveryAttempts: 2,
      logLevel: "debug",
      enableTelemetry: false,
      enableUserNotifications: false,
    });
  });

  afterEach(async () => {
    await logger.close();
  });

  const mockContext = {
    userId: "test-user",
    sessionId: "test-session",
    requestId: "test-request",
    operation: "test-operation",
    component: "test-component",
    timestamp: new Date(),
  };

  describe("handleError", () => {
    it("should handle error and create report", async () => {
      const error = new OllamaConnectionError("Connection failed", mockContext);

      const report = await errorHandler.handleError(error);

      expect(report.error).toBe(error);
      expect(report.handled).toBe(true);
      expect(report.timestamp).toBeInstanceOf(Date);
      expect(report.handlingDuration).toBeGreaterThanOrEqual(0);
      expect(typeof report.recovered).toBe("boolean");
      expect(typeof report.recoveryAttempts).toBe("number");
    });

    it("should attempt recovery for recoverable errors", async () => {
      const error = new OllamaConnectionError("Connection failed", mockContext);

      const report = await errorHandler.handleError(error);

      expect(report.recoveryAttempts).toBeGreaterThan(0);
    });

    it("should not attempt recovery when disabled", async () => {
      const noRecoveryHandler = new ErrorHandler(logger, {
        enableRecovery: false,
      });
      const error = new OllamaConnectionError("Connection failed", mockContext);

      const report = await noRecoveryHandler.handleError(error);

      expect(report.recoveryAttempts).toBe(0);
      expect(report.recovered).toBe(false);
    });

    it("should log error appropriately", async () => {
      const error = new OllamaConnectionError("Connection failed", mockContext);

      await errorHandler.handleError(error);

      const logEntries = memoryTransport.getEntries();
      const errorLogEntry = logEntries.find(
        (entry) =>
          entry.level === LogLevel.ERROR &&
          entry.message.includes("High severity error")
      );

      expect(errorLogEntry).toBeDefined();
      expect(errorLogEntry?.data?.code).toBe("OLLAMA_CONNECTION_FAILED");
    });
  });

  describe("handleGenericError", () => {
    it("should convert generic Error to BaseError", async () => {
      const genericError = new Error("Generic error message");

      const report = await errorHandler.handleGenericError(
        genericError,
        mockContext,
        ErrorCategory.SYSTEM,
        ErrorSeverity.HIGH
      );

      expect(report.error.code).toBe("GENERIC_ERROR");
      expect(report.error.message).toBe("Generic error message");
      expect(report.error.category).toBe(ErrorCategory.SYSTEM);
      expect(report.error.severity).toBe(ErrorSeverity.HIGH);
      expect(report.error.cause).toBe(genericError);
    });
  });

  describe("error listeners", () => {
    it("should notify error listeners", async () => {
      const listener = vi.fn();
      errorHandler.onError(listener);

      const error = new OllamaConnectionError("Connection failed", mockContext);
      const report = await errorHandler.handleError(error);

      expect(listener).toHaveBeenCalledWith(error, report);
    });

    it("should remove error listeners", async () => {
      const listener = vi.fn();
      errorHandler.onError(listener);
      errorHandler.removeErrorListener(listener);

      const error = new OllamaConnectionError("Connection failed", mockContext);
      await errorHandler.handleError(error);

      expect(listener).not.toHaveBeenCalled();
    });

    it("should handle listener errors gracefully", async () => {
      const faultyListener = vi.fn(() => {
        throw new Error("Listener error");
      });
      errorHandler.onError(faultyListener);

      const error = new OllamaConnectionError("Connection failed", mockContext);

      // Should not throw despite listener error
      await expect(errorHandler.handleError(error)).resolves.toBeDefined();
      expect(faultyListener).toHaveBeenCalled();
    });
  });

  describe("metrics", () => {
    it("should track error metrics", async () => {
      const error1 = new OllamaConnectionError("Error 1", mockContext);
      const error2 = new OllamaConnectionError("Error 2", mockContext);

      await errorHandler.handleError(error1);
      await errorHandler.handleError(error2);

      const metrics = errorHandler.getMetrics();

      expect(metrics.totalErrors).toBe(2);
      expect(metrics.errorsByCategory[ErrorCategory.OLLAMA_CONNECTION]).toBe(2);
      expect(metrics.errorsBySeverity[ErrorSeverity.HIGH]).toBe(2);
      expect(metrics.averageHandlingTime).toBeGreaterThanOrEqual(0);
      expect(metrics.recoverySuccessRate).toBeGreaterThanOrEqual(0);
      expect(metrics.recoverySuccessRate).toBeLessThanOrEqual(1);
    });

    it("should handle empty metrics", () => {
      const metrics = errorHandler.getMetrics();

      expect(metrics.totalErrors).toBe(0);
      expect(metrics.recoverySuccessRate).toBe(0);
      expect(metrics.averageHandlingTime).toBe(0);
    });
  });

  describe("error history", () => {
    it("should store error history", async () => {
      const error = new OllamaConnectionError("Connection failed", mockContext);

      await errorHandler.handleError(error);

      const recentErrors = errorHandler.getRecentErrors(10);
      expect(recentErrors).toHaveLength(1);
      expect(recentErrors[0].error).toBe(error);
    });

    it("should limit recent errors", async () => {
      // Add multiple errors
      for (let i = 0; i < 5; i++) {
        const error = new OllamaConnectionError(`Error ${i}`, mockContext);
        await errorHandler.handleError(error);
      }

      const recentErrors = errorHandler.getRecentErrors(3);
      expect(recentErrors).toHaveLength(3);
    });

    it("should clear history", async () => {
      const error = new OllamaConnectionError("Connection failed", mockContext);
      await errorHandler.handleError(error);

      errorHandler.clearHistory();

      const recentErrors = errorHandler.getRecentErrors(10);
      expect(recentErrors).toHaveLength(0);
    });
  });

  describe("error handling failures", () => {
    it("should handle errors during error handling", async () => {
      // Create a handler with a faulty recovery manager
      const faultyHandler = new ErrorHandler(logger);

      // Mock the recovery manager to throw
      (faultyHandler as any).recoveryManager = {
        attemptRecovery: vi
          .fn()
          .mockRejectedValue(new Error("Recovery failed")),
      };

      const error = new OllamaConnectionError("Connection failed", mockContext);
      const report = await faultyHandler.handleError(error);

      expect(report.handled).toBe(false);
      expect(report.recovered).toBe(false);
    });
  });
});
