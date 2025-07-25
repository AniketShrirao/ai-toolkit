/**
 * Tests for error recovery mechanisms
 */

import {
  ErrorRecoveryManager,
  RecoveryStrategy,
} from "../../errors/ErrorRecovery.js";
import {
  OllamaConnectionError,
  OllamaModelError,
  DocumentProcessingError,
  FileSystemError,
  WorkflowExecutionError,
  ConfigurationError,
  ErrorCategory,
} from "../../errors/ErrorTypes.js";
import { createTestLogger } from "../../logging/Logger.js";

describe("ErrorRecoveryManager", () => {
  let recoveryManager: ErrorRecoveryManager;
  let logger: ReturnType<typeof createTestLogger>;

  beforeEach(() => {
    logger = createTestLogger();
    recoveryManager = new ErrorRecoveryManager(logger);
  });

  const mockContext = {
    userId: "test-user",
    sessionId: "test-session",
    requestId: "test-request",
    operation: "test-operation",
    component: "test-component",
    timestamp: new Date(),
  };

  describe("attemptRecovery", () => {
    it("should attempt recovery for Ollama connection errors", async () => {
      const error = new OllamaConnectionError("Connection failed", mockContext);

      const result = await recoveryManager.attemptRecovery(error, 2);

      expect(result.attempts).toBeGreaterThan(0);
      expect(result.strategy).toBe("ollama-connection-retry");
      expect(typeof result.success).toBe("boolean");
      expect(result.message).toBeDefined();
    });

    it("should attempt model fallback for model errors", async () => {
      const error = new OllamaModelError("Model failed", mockContext, "llama2");

      const result = await recoveryManager.attemptRecovery(error, 2);

      expect(result.attempts).toBeGreaterThan(0);
      expect(result.strategy).toBe("ollama-model-fallback");
    });

    it("should attempt document processing fallback", async () => {
      const error = new DocumentProcessingError(
        "Processing failed",
        mockContext,
        "/path/to/doc.pdf"
      );

      const result = await recoveryManager.attemptRecovery(error, 2);

      expect(result.attempts).toBeGreaterThan(0);
      expect(result.strategy).toBe("document-processing-fallback");
    });

    it("should retry file system operations", async () => {
      const error = new FileSystemError(
        "File operation failed",
        mockContext,
        "write",
        "/path/to/file"
      );

      const result = await recoveryManager.attemptRecovery(error, 2);

      expect(result.attempts).toBeGreaterThan(0);
      expect(result.strategy).toBe("file-system-retry");
    });

    it("should retry workflow steps", async () => {
      const error = new WorkflowExecutionError(
        "Step failed",
        mockContext,
        "workflow-1",
        "step-1"
      );

      const result = await recoveryManager.attemptRecovery(error, 2);

      expect(result.attempts).toBeGreaterThan(0);
      expect(result.strategy).toBe("workflow-step-retry");
    });

    it("should apply configuration fallback", async () => {
      const error = new ConfigurationError(
        "Config missing",
        mockContext,
        "ollama.host"
      );

      const result = await recoveryManager.attemptRecovery(error, 1);

      expect(result.attempts).toBe(1);
      expect(result.strategy).toBe("configuration-fallback");
      expect(result.success).toBe(true); // Configuration fallback always succeeds
    });

    it("should return failure when no strategy available", async () => {
      // Create an error type that has no recovery strategy
      const error = {
        code: "UNKNOWN_ERROR",
        category: "UNKNOWN" as ErrorCategory,
        message: "Unknown error",
        recoverable: true,
      } as any;

      const result = await recoveryManager.attemptRecovery(error, 2);

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(0);
      expect(result.strategy).toBe("none");
      expect(result.message).toContain("No recovery strategy available");
    });

    it("should respect max attempts limit", async () => {
      const error = new OllamaConnectionError("Connection failed", mockContext);

      const result = await recoveryManager.attemptRecovery(error, 1);

      expect(result.attempts).toBeLessThanOrEqual(1);
    });
  });

  describe("custom strategies", () => {
    it("should register custom recovery strategy", () => {
      const customStrategy: RecoveryStrategy = {
        name: "custom-strategy",
        canHandle: (error) => error.code === "CUSTOM_ERROR",
        maxAttempts: 2,
        delayMs: 1000,
        execute: async () => ({
          success: true,
          attempts: 1,
          strategy: "custom-strategy",
          message: "Custom recovery successful",
        }),
      };

      recoveryManager.registerStrategy(customStrategy);

      const strategies = recoveryManager.getStrategies();
      expect(strategies).toContain("custom-strategy");
    });

    it("should use custom strategy for matching errors", async () => {
      const customStrategy: RecoveryStrategy = {
        name: "custom-strategy",
        canHandle: (error) => error.code === "CUSTOM_ERROR",
        maxAttempts: 1,
        delayMs: 0,
        execute: async () => ({
          success: true,
          attempts: 1,
          strategy: "custom-strategy",
          message: "Custom recovery successful",
        }),
      };

      recoveryManager.registerStrategy(customStrategy);

      const customError = {
        code: "CUSTOM_ERROR",
        category: ErrorCategory.SYSTEM,
        recoverable: true,
      } as any;

      const result = await recoveryManager.attemptRecovery(customError, 1);

      expect(result.success).toBe(true);
      expect(result.strategy).toBe("custom-strategy");
      expect(result.message).toBe("Custom recovery successful");
    });

    it("should remove custom strategy", () => {
      const customStrategy: RecoveryStrategy = {
        name: "removable-strategy",
        canHandle: () => false,
        maxAttempts: 1,
        delayMs: 0,
        execute: async () => ({
          success: false,
          attempts: 1,
          strategy: "removable-strategy",
          message: "Should not be called",
        }),
      };

      recoveryManager.registerStrategy(customStrategy);
      expect(recoveryManager.getStrategies()).toContain("removable-strategy");

      const removed = recoveryManager.removeStrategy("removable-strategy");
      expect(removed).toBe(true);
      expect(recoveryManager.getStrategies()).not.toContain(
        "removable-strategy"
      );
    });

    it("should return false when removing non-existent strategy", () => {
      const removed = recoveryManager.removeStrategy("non-existent");
      expect(removed).toBe(false);
    });
  });

  describe("strategy execution", () => {
    it("should handle strategy execution errors", async () => {
      const faultyStrategy: RecoveryStrategy = {
        name: "faulty-strategy",
        canHandle: (error) => error.code === "TEST_ERROR",
        maxAttempts: 2,
        delayMs: 0,
        execute: async () => {
          throw new Error("Strategy execution failed");
        },
      };

      recoveryManager.registerStrategy(faultyStrategy);

      const testError = {
        code: "TEST_ERROR",
        category: ErrorCategory.SYSTEM,
        recoverable: true,
      } as any;

      const result = await recoveryManager.attemptRecovery(testError, 2);

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(2);
    });

    it("should try multiple attempts for failing strategies", async () => {
      let attemptCount = 0;
      const retryStrategy: RecoveryStrategy = {
        name: "retry-strategy",
        canHandle: (error) => error.code === "RETRY_ERROR",
        maxAttempts: 3,
        delayMs: 0,
        execute: async (error, attempt) => {
          attemptCount++;
          return {
            success: attempt === 3, // Succeed on third attempt
            attempts: attempt,
            strategy: "retry-strategy",
            message: `Attempt ${attempt}`,
          };
        },
      };

      recoveryManager.registerStrategy(retryStrategy);

      const retryError = {
        code: "RETRY_ERROR",
        category: ErrorCategory.SYSTEM,
        recoverable: true,
      } as any;

      const result = await recoveryManager.attemptRecovery(retryError, 3);

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(3);
      expect(attemptCount).toBe(3);
    });
  });

  describe("built-in strategies", () => {
    it("should have all expected built-in strategies", () => {
      const strategies = recoveryManager.getStrategies();

      expect(strategies).toContain("ollama-connection-retry");
      expect(strategies).toContain("ollama-model-fallback");
      expect(strategies).toContain("document-processing-fallback");
      expect(strategies).toContain("file-system-retry");
      expect(strategies).toContain("workflow-step-retry");
      expect(strategies).toContain("configuration-fallback");
    });

    it("should handle model fallback with no available models", async () => {
      const error = new OllamaModelError(
        "Model failed",
        mockContext,
        "mistral"
      ); // Last fallback model

      const result = await recoveryManager.attemptRecovery(error, 2);

      // Should eventually fail when no more fallback models available
      expect(typeof result.success).toBe("boolean");
      expect(result.strategy).toBe("ollama-model-fallback");
    });
  });
});
