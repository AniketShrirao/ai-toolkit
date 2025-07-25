/**
 * Tests for troubleshooting guide system
 */

import { TroubleshootingGuideManager } from "../../errors/TroubleshootingGuide.js";
import {
  OllamaConnectionError,
  OllamaModelError,
  DocumentProcessingError,
  WorkflowExecutionError,
  FileSystemError,
  ConfigurationError,
  ErrorCategory,
} from "../../errors/ErrorTypes.js";

describe("TroubleshootingGuideManager", () => {
  let guideManager: TroubleshootingGuideManager;

  beforeEach(() => {
    guideManager = new TroubleshootingGuideManager();
  });

  const mockContext = {
    userId: "test-user",
    sessionId: "test-session",
    requestId: "test-request",
    operation: "test-operation",
    component: "test-component",
    timestamp: new Date(),
  };

  describe("getGuideForError", () => {
    it("should return guide for Ollama connection error", () => {
      const error = new OllamaConnectionError("Connection failed", mockContext);

      const guide = guideManager.getGuideForError(error);

      expect(guide).toBeDefined();
      expect(guide?.title).toContain("Ollama Connection");
      expect(guide?.category).toBe(ErrorCategory.OLLAMA_CONNECTION);
      expect(guide?.steps.length).toBeGreaterThan(0);
      expect(guide?.difficulty).toBe("beginner");
    });

    it("should return guide for model error", () => {
      const error = new OllamaModelError("Model failed", mockContext, "llama2");

      const guide = guideManager.getGuideForError(error);

      expect(guide).toBeDefined();
      expect(guide?.title).toContain("Model Error");
      expect(guide?.category).toBe(ErrorCategory.AI_MODEL);
      expect(guide?.steps.length).toBeGreaterThan(0);
    });

    it("should return guide for document processing error", () => {
      const error = new DocumentProcessingError(
        "Processing failed",
        mockContext
      );

      const guide = guideManager.getGuideForError(error);

      expect(guide).toBeDefined();
      expect(guide?.title).toContain("Document Processing");
      expect(guide?.category).toBe(ErrorCategory.DOCUMENT_PROCESSING);
    });

    it("should return guide for workflow execution error", () => {
      const error = new WorkflowExecutionError("Workflow failed", mockContext);

      const guide = guideManager.getGuideForError(error);

      expect(guide).toBeDefined();
      expect(guide?.title).toContain("Workflow Execution");
      expect(guide?.category).toBe(ErrorCategory.WORKFLOW_EXECUTION);
      expect(guide?.difficulty).toBe("intermediate");
    });

    it("should return guide for file system error", () => {
      const error = new FileSystemError("File operation failed", mockContext);

      const guide = guideManager.getGuideForError(error);

      expect(guide).toBeDefined();
      expect(guide?.title).toContain("File System");
      expect(guide?.category).toBe(ErrorCategory.FILE_SYSTEM);
    });

    it("should return guide for configuration error", () => {
      const error = new ConfigurationError("Config error", mockContext);

      const guide = guideManager.getGuideForError(error);

      expect(guide).toBeDefined();
      expect(guide?.title).toContain("Configuration");
      expect(guide?.category).toBe(ErrorCategory.CONFIGURATION);
      expect(guide?.difficulty).toBe("intermediate");
    });

    it("should return null for unknown error", () => {
      const unknownError = {
        code: "UNKNOWN_ERROR",
        category: "UNKNOWN" as ErrorCategory,
      } as any;

      const guide = guideManager.getGuideForError(unknownError);

      expect(guide).toBeNull();
    });
  });

  describe("getAllGuides", () => {
    it("should return all available guides", () => {
      const guides = guideManager.getAllGuides();

      expect(guides.length).toBeGreaterThan(0);
      expect(
        guides.every((guide) => guide.title && guide.steps.length > 0)
      ).toBe(true);
    });
  });

  describe("getGuidesByCategory", () => {
    it("should return guides for specific category", () => {
      const ollamaGuides = guideManager.getGuidesByCategory(
        ErrorCategory.OLLAMA_CONNECTION
      );

      expect(ollamaGuides.length).toBeGreaterThan(0);
      expect(
        ollamaGuides.every(
          (guide) => guide.category === ErrorCategory.OLLAMA_CONNECTION
        )
      ).toBe(true);
    });

    it("should return empty array for category with no guides", () => {
      const guides = guideManager.getGuidesByCategory(ErrorCategory.NETWORK);

      expect(guides).toEqual([]);
    });
  });

  describe("registerGuide", () => {
    it("should register custom guide", () => {
      const customGuide = {
        title: "Custom Error Guide",
        description: "Guide for custom errors",
        category: ErrorCategory.SYSTEM,
        estimatedTime: "5 minutes",
        difficulty: "beginner" as const,
        steps: [
          {
            step: 1,
            description: "Check system status",
            action: "Run system diagnostics",
            expected: "System should be healthy",
          },
        ],
        additionalResources: [],
      };

      guideManager.registerGuide("CUSTOM_ERROR", customGuide);

      const customError = {
        code: "CUSTOM_ERROR",
        category: ErrorCategory.SYSTEM,
      } as any;

      const guide = guideManager.getGuideForError(customError);
      expect(guide).toBe(customGuide);
    });
  });

  describe("generateUserMessage", () => {
    it("should generate user message with troubleshooting steps", () => {
      const error = new OllamaConnectionError("Connection failed", mockContext);

      const message = guideManager.generateUserMessage(error);

      expect(message).toContain(error.userMessage);
      expect(message).toContain("Troubleshooting Steps:");
      expect(message).toContain("1. Check if Ollama is installed");
      expect(message).toContain("Action:");
      expect(message).toContain("Expected:");
      expect(message).toContain("Additional Resources:");
    });

    it("should generate message without guide for unknown error", () => {
      const unknownError = {
        code: "UNKNOWN_ERROR",
        category: "UNKNOWN" as ErrorCategory,
        userMessage: "Unknown error occurred",
      } as any;

      const message = guideManager.generateUserMessage(unknownError);

      expect(message).toBe("Unknown error occurred");
      expect(message).not.toContain("Troubleshooting Steps:");
    });
  });

  describe("generateHtmlGuide", () => {
    it("should generate HTML guide with proper structure", () => {
      const error = new OllamaConnectionError("Connection failed", mockContext);

      const html = guideManager.generateHtmlGuide(error);

      expect(html).toContain('<div class="troubleshooting-guide">');
      expect(html).toContain("<h3>Ollama Connection Failed</h3>");
      expect(html).toContain('<span class="difficulty difficulty-beginner">');
      expect(html).toContain('<ol class="troubleshooting-steps">');
      expect(html).toContain('<li class="step">');
      expect(html).toContain("<h5>Step 1:");
      expect(html).toContain("<strong>Action:</strong>");
      expect(html).toContain("<strong>Expected Result:</strong>");
      expect(html).toContain('<ul class="resources">');
      expect(html).toContain("<a href=");
    });

    it("should generate basic HTML for error without guide", () => {
      const unknownError = {
        code: "UNKNOWN_ERROR",
        category: "UNKNOWN" as ErrorCategory,
        userMessage: "Unknown error occurred",
      } as any;

      const html = guideManager.generateHtmlGuide(unknownError);

      expect(html).toContain('<div class="troubleshooting-guide">');
      expect(html).toContain("<h3>Error: UNKNOWN_ERROR</h3>");
      expect(html).toContain("Unknown error occurred");
      expect(html).toContain("<em>No specific troubleshooting guide available");
    });
  });

  describe("guide content validation", () => {
    it("should have valid steps in all built-in guides", () => {
      const guides = guideManager.getAllGuides();

      guides.forEach((guide) => {
        expect(guide.steps.length).toBeGreaterThan(0);

        guide.steps.forEach((step) => {
          expect(step.step).toBeGreaterThan(0);
          expect(step.description).toBeTruthy();
          expect(step.action).toBeTruthy();
          expect(step.expected).toBeTruthy();
        });
      });
    });

    it("should have valid metadata in all built-in guides", () => {
      const guides = guideManager.getAllGuides();

      guides.forEach((guide) => {
        expect(guide.title).toBeTruthy();
        expect(guide.description).toBeTruthy();
        expect(guide.estimatedTime).toBeTruthy();
        expect(["beginner", "intermediate", "advanced"]).toContain(
          guide.difficulty
        );
        expect(Object.values(ErrorCategory)).toContain(guide.category);
      });
    });

    it("should have valid resource links", () => {
      const guides = guideManager.getAllGuides();

      guides.forEach((guide) => {
        guide.additionalResources.forEach((resource) => {
          expect(resource.title).toBeTruthy();
          expect(resource.url).toBeTruthy();
          expect(["documentation", "video", "forum", "github"]).toContain(
            resource.type
          );
        });
      });
    });
  });
});
