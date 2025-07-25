import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  WorkflowStepExecutor,
  StepExecutionContext,
} from "../../execution/WorkflowStepExecutor.js";
import { QueueFactory } from "../../queue/QueueFactory.js";
import { JobProcessorRegistry } from "../../queue/JobProcessorRegistry.js";
import { QueueManager } from "../../interfaces/QueueManager.js";
import { WorkflowStep } from "@ai-toolkit/shared";

describe("WorkflowStepExecutor", () => {
  let queueManager: QueueManager;
  let stepExecutor: WorkflowStepExecutor;
  let registry: JobProcessorRegistry;

  beforeAll(async () => {
    try {
      queueManager = await QueueFactory.createQueueManager({
        redis: {
          host: "localhost",
          port: 6379,
          db: 7, // Use different DB for step executor tests
        },
      });

      registry = new JobProcessorRegistry(queueManager);
      registry.registerBuiltInProcessors();

      stepExecutor = new WorkflowStepExecutor(queueManager);
    } catch (error) {
      console.warn(
        "Redis not available for step executor tests, creating mock"
      );
      // Create a mock queue manager for tests that don't require Redis
      const mockQueueManager = {
        addJob: async () => "mock-job-id",
        getJob: async () => ({
          status: "completed",
          result: { data: "mock-result" },
        }),
      } as any;
      stepExecutor = new WorkflowStepExecutor(mockQueueManager);
    }
  });

  afterAll(async () => {
    if (queueManager) {
      await QueueFactory.shutdown();
    }
  });

  describe("Step Execution", () => {
    it("should execute a document analysis step", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      const step: WorkflowStep = {
        id: "doc-analysis-step",
        name: "Document Analysis",
        type: "document-analysis",
        config: {
          extractText: true,
          identifyHeaders: true,
        },
        dependencies: [],
      };

      const context: StepExecutionContext = {
        workflowId: "test-workflow",
        executionId: "test-execution",
        stepId: step.id,
        input: { documentPath: "/test/document.pdf" },
        previousResults: new Map(),
        globalContext: {},
      };

      const result = await stepExecutor.executeStep(step, context);

      expect(result).toBeDefined();
      expect(typeof result.success).toBe("boolean");
      expect(typeof result.duration).toBe("number");
      expect(result.duration).toBeGreaterThan(0);
    }, 10000);

    it("should execute a requirement extraction step", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      const step: WorkflowStep = {
        id: "req-extraction-step",
        name: "Requirement Extraction",
        type: "requirement-extraction",
        config: {
          categorize: true,
          prioritize: true,
        },
        dependencies: [],
      };

      const context: StepExecutionContext = {
        workflowId: "test-workflow",
        executionId: "test-execution",
        stepId: step.id,
        input: { content: "Sample document content with requirements" },
        previousResults: new Map(),
        globalContext: {},
      };

      const result = await stepExecutor.executeStep(step, context);

      expect(result).toBeDefined();
      expect(typeof result.success).toBe("boolean");
      expect(typeof result.duration).toBe("number");
    }, 10000);

    it("should execute an estimation step", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      const step: WorkflowStep = {
        id: "estimation-step",
        name: "Project Estimation",
        type: "estimation",
        config: {
          factors: ["complexity", "scope"],
          includeRiskFactors: true,
        },
        dependencies: [],
      };

      const context: StepExecutionContext = {
        workflowId: "test-workflow",
        executionId: "test-execution",
        stepId: step.id,
        input: { requirements: ["req1", "req2"] },
        previousResults: new Map(),
        globalContext: {},
      };

      const result = await stepExecutor.executeStep(step, context);

      expect(result).toBeDefined();
      expect(typeof result.success).toBe("boolean");
      expect(typeof result.duration).toBe("number");
    }, 10000);

    it("should handle step with unsupported type", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      const step: WorkflowStep = {
        id: "unsupported-step",
        name: "Unsupported Step",
        type: "unsupported-type" as any,
        config: {},
        dependencies: [],
      };

      const context: StepExecutionContext = {
        workflowId: "test-workflow",
        executionId: "test-execution",
        stepId: step.id,
        input: {},
        previousResults: new Map(),
        globalContext: {},
      };

      const result = await stepExecutor.executeStep(step, context);

      expect(result.success).toBe(false);
      expect(result.error).toContain("No handler registered");
    });
  });

  describe("Dependency Management", () => {
    it("should check step dependencies correctly", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      const stepWithDeps: WorkflowStep = {
        id: "dependent-step",
        name: "Dependent Step",
        type: "document-analysis",
        config: {},
        dependencies: ["prerequisite-step"],
      };

      const contextWithoutDeps: StepExecutionContext = {
        workflowId: "test-workflow",
        executionId: "test-execution",
        stepId: stepWithDeps.id,
        input: {},
        previousResults: new Map(),
        globalContext: {},
      };

      const result = await stepExecutor.executeStep(
        stepWithDeps,
        contextWithoutDeps
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Dependencies not satisfied");
    });

    it("should execute step when dependencies are satisfied", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      const stepWithDeps: WorkflowStep = {
        id: "dependent-step",
        name: "Dependent Step",
        type: "document-analysis",
        config: {},
        dependencies: ["prerequisite-step"],
      };

      const contextWithDeps: StepExecutionContext = {
        workflowId: "test-workflow",
        executionId: "test-execution",
        stepId: stepWithDeps.id,
        input: {},
        previousResults: new Map([
          ["prerequisite-step", { result: "completed" }],
        ]),
        globalContext: {},
      };

      const result = await stepExecutor.executeStep(
        stepWithDeps,
        contextWithDeps
      );

      expect(result).toBeDefined();
      expect(typeof result.success).toBe("boolean");
    }, 10000);
  });

  describe("Step Order Execution", () => {
    it("should execute steps in dependency order", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      const steps: WorkflowStep[] = [
        {
          id: "step-3",
          name: "Step 3",
          type: "notification",
          config: { message: "Final step" },
          dependencies: ["step-2"],
        },
        {
          id: "step-1",
          name: "Step 1",
          type: "document-analysis",
          config: { extractText: true },
          dependencies: [],
        },
        {
          id: "step-2",
          name: "Step 2",
          type: "requirement-extraction",
          config: { categorize: true },
          dependencies: ["step-1"],
        },
      ];

      const baseContext = {
        workflowId: "test-workflow",
        executionId: "test-execution",
        input: { documentPath: "/test/doc.pdf" },
        previousResults: new Map(),
        globalContext: {},
      };

      const results = await stepExecutor.executeStepsInOrder(
        steps,
        baseContext
      );

      expect(results.size).toBe(3);
      expect(results.has("step-1")).toBe(true);
      expect(results.has("step-2")).toBe(true);
      expect(results.has("step-3")).toBe(true);
    }, 15000);

    it("should validate step execution order", () => {
      const validSteps: WorkflowStep[] = [
        {
          id: "step-1",
          name: "Step 1",
          type: "document-analysis",
          config: {},
          dependencies: [],
        },
        {
          id: "step-2",
          name: "Step 2",
          type: "requirement-extraction",
          config: {},
          dependencies: ["step-1"],
        },
      ];

      const validation = stepExecutor.validateStepOrder(validSteps);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should detect circular dependencies in step order", () => {
      const circularSteps: WorkflowStep[] = [
        {
          id: "step-a",
          name: "Step A",
          type: "document-analysis",
          config: {},
          dependencies: ["step-b"],
        },
        {
          id: "step-b",
          name: "Step B",
          type: "requirement-extraction",
          config: {},
          dependencies: ["step-a"],
        },
      ];

      const validation = stepExecutor.validateStepOrder(circularSteps);

      expect(validation.valid).toBe(false);
      expect(
        validation.errors.some((e) => e.includes("Circular dependency"))
      ).toBe(true);
    });

    it("should detect invalid dependencies in step order", () => {
      const invalidSteps: WorkflowStep[] = [
        {
          id: "step-1",
          name: "Step 1",
          type: "document-analysis",
          config: {},
          dependencies: ["non-existent-step"],
        },
      ];

      const validation = stepExecutor.validateStepOrder(invalidSteps);

      expect(validation.valid).toBe(false);
      expect(
        validation.errors.some((e) => e.includes("non-existent step"))
      ).toBe(true);
    });
  });

  describe("Custom Step Handlers", () => {
    it("should register and use custom step handler", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      // Register a custom handler
      stepExecutor.registerStepHandler(
        "custom-type" as any,
        async (context, step) => {
          return {
            success: true,
            output: {
              customResult: "Custom step executed",
              input: context.input,
            },
            duration: 100,
          };
        }
      );

      const customStep: WorkflowStep = {
        id: "custom-step",
        name: "Custom Step",
        type: "custom-type" as any,
        config: { customConfig: true },
        dependencies: [],
      };

      const context: StepExecutionContext = {
        workflowId: "test-workflow",
        executionId: "test-execution",
        stepId: customStep.id,
        input: { testData: "test" },
        previousResults: new Map(),
        globalContext: {},
      };

      const result = await stepExecutor.executeStep(customStep, context);

      expect(result.success).toBe(true);
      expect(result.output.customResult).toBe("Custom step executed");
      expect(result.output.input.testData).toBe("test");
    });
  });

  describe("Context Management", () => {
    it("should create execution context correctly", () => {
      const context = stepExecutor.createExecutionContext(
        "workflow-123",
        "execution-456",
        "step-789",
        { inputData: "test" },
        new Map([["prev-step", { result: "data" }]]),
        { globalVar: "value" }
      );

      expect(context.workflowId).toBe("workflow-123");
      expect(context.executionId).toBe("execution-456");
      expect(context.stepId).toBe("step-789");
      expect(context.input.inputData).toBe("test");
      expect(context.previousResults.get("prev-step").result).toBe("data");
      expect(context.globalContext.globalVar).toBe("value");
    });

    it("should handle context with default values", () => {
      const context = stepExecutor.createExecutionContext(
        "workflow-123",
        "execution-456",
        "step-789",
        { inputData: "test" }
      );

      expect(context.previousResults.size).toBe(0);
      expect(Object.keys(context.globalContext)).toHaveLength(0);
    });
  });

  describe("Error Handling", () => {
    it("should handle step execution errors gracefully", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      // Register a handler that throws an error
      stepExecutor.registerStepHandler("error-type" as any, async () => {
        throw new Error("Intentional test error");
      });

      const errorStep: WorkflowStep = {
        id: "error-step",
        name: "Error Step",
        type: "error-type" as any,
        config: {},
        dependencies: [],
      };

      const context: StepExecutionContext = {
        workflowId: "test-workflow",
        executionId: "test-execution",
        stepId: errorStep.id,
        input: {},
        previousResults: new Map(),
        globalContext: {},
      };

      const result = await stepExecutor.executeStep(errorStep, context);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Intentional test error");
      expect(typeof result.duration).toBe("number");
    });
  });
});
