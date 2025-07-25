/**
 * Tests for error type definitions
 */

import {
  ErrorCategory,
  ErrorSeverity,
  OllamaConnectionError,
  OllamaModelError,
  DocumentProcessingError,
  WorkflowExecutionError,
  FileSystemError,
  ValidationError,
  ConfigurationError,
  SystemError,
} from "../../errors/ErrorTypes.js";

describe("ErrorTypes", () => {
  const mockContext = {
    userId: "test-user",
    sessionId: "test-session",
    requestId: "test-request",
    operation: "test-operation",
    component: "test-component",
    timestamp: new Date(),
  };

  describe("OllamaConnectionError", () => {
    it("should create error with correct properties", () => {
      const error = new OllamaConnectionError(
        "Connection failed",
        mockContext,
        { host: "localhost", port: 11434 }
      );

      expect(error.name).toBe("OllamaConnectionError");
      expect(error.code).toBe("OLLAMA_CONNECTION_FAILED");
      expect(error.category).toBe(ErrorCategory.OLLAMA_CONNECTION);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.recoverable).toBe(true);
      expect(error.context).toBe(mockContext);
      expect(error.details).toEqual({ host: "localhost", port: 11434 });
      expect(error.recoveryActions).toHaveLength(2);
      expect(error.troubleshootingSteps).toHaveLength(3);
      expect(error.userMessage).toContain("Ollama");
    });

    it("should have appropriate recovery actions", () => {
      const error = new OllamaConnectionError("Connection failed", mockContext);

      const retryAction = error.recoveryActions.find((a) => a.type === "retry");
      expect(retryAction).toBeDefined();
      expect(retryAction?.automated).toBe(true);
      expect(retryAction?.maxAttempts).toBe(3);

      const manualAction = error.recoveryActions.find(
        (a) => a.type === "manual"
      );
      expect(manualAction).toBeDefined();
      expect(manualAction?.automated).toBe(false);
    });
  });

  describe("OllamaModelError", () => {
    it("should create error with model information", () => {
      const error = new OllamaModelError(
        "Model not found",
        mockContext,
        "llama2",
        { available: false }
      );

      expect(error.name).toBe("OllamaModelError");
      expect(error.code).toBe("OLLAMA_MODEL_ERROR");
      expect(error.category).toBe(ErrorCategory.AI_MODEL);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.details?.modelName).toBe("llama2");
      expect(error.userMessage).toContain("llama2");
    });

    it("should have fallback recovery action", () => {
      const error = new OllamaModelError("Model failed", mockContext);

      const fallbackAction = error.recoveryActions.find(
        (a) => a.type === "fallback"
      );
      expect(fallbackAction).toBeDefined();
      expect(fallbackAction?.description).toContain("alternative model");
    });
  });

  describe("DocumentProcessingError", () => {
    it("should create error with document path", () => {
      const error = new DocumentProcessingError(
        "Processing failed",
        mockContext,
        "/path/to/document.pdf",
        { fileSize: 1024 }
      );

      expect(error.name).toBe("DocumentProcessingError");
      expect(error.category).toBe(ErrorCategory.DOCUMENT_PROCESSING);
      expect(error.details?.documentPath).toBe("/path/to/document.pdf");
      expect(error.details?.fileSize).toBe(1024);
    });
  });

  describe("WorkflowExecutionError", () => {
    it("should create error with workflow information", () => {
      const error = new WorkflowExecutionError(
        "Step failed",
        mockContext,
        "workflow-123",
        "step-456",
        { stepType: "ai-analysis" }
      );

      expect(error.name).toBe("WorkflowExecutionError");
      expect(error.category).toBe(ErrorCategory.WORKFLOW_EXECUTION);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.details?.workflowId).toBe("workflow-123");
      expect(error.details?.stepId).toBe("step-456");
    });
  });

  describe("FileSystemError", () => {
    it("should create error with file operation details", () => {
      const error = new FileSystemError(
        "Permission denied",
        mockContext,
        "write",
        "/path/to/file.txt",
        { permissions: "r--" }
      );

      expect(error.name).toBe("FileSystemError");
      expect(error.category).toBe(ErrorCategory.FILE_SYSTEM);
      expect(error.details?.operation).toBe("write");
      expect(error.details?.path).toBe("/path/to/file.txt");
    });
  });

  describe("ValidationError", () => {
    it("should create error with validation details", () => {
      const error = new ValidationError(
        "Invalid email",
        mockContext,
        "email",
        "invalid-email",
        { pattern: "email" }
      );

      expect(error.name).toBe("ValidationError");
      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.severity).toBe(ErrorSeverity.LOW);
      expect(error.details?.field).toBe("email");
      expect(error.details?.value).toBe("invalid-email");
    });
  });

  describe("ConfigurationError", () => {
    it("should create error with config key", () => {
      const error = new ConfigurationError(
        "Missing config",
        mockContext,
        "ollama.host",
        { required: true }
      );

      expect(error.name).toBe("ConfigurationError");
      expect(error.category).toBe(ErrorCategory.CONFIGURATION);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.details?.configKey).toBe("ollama.host");
    });
  });

  describe("SystemError", () => {
    it("should create critical system error", () => {
      const error = new SystemError("Out of memory", mockContext, {
        memoryUsage: "95%",
      });

      expect(error.name).toBe("SystemError");
      expect(error.category).toBe(ErrorCategory.SYSTEM);
      expect(error.severity).toBe(ErrorSeverity.CRITICAL);
      expect(error.recoverable).toBe(false);
    });
  });

  describe("Error inheritance", () => {
    it("should extend Error class properly", () => {
      const error = new OllamaConnectionError("Test", mockContext);

      expect(error instanceof Error).toBe(true);
      expect(error instanceof OllamaConnectionError).toBe(true);
      expect(error.message).toBe("Test");
      expect(error.stack).toBeDefined();
    });
  });
});
