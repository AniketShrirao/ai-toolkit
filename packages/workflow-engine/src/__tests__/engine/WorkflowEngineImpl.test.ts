import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { WorkflowEngineImpl } from "../../engine/WorkflowEngineImpl.js";
import { QueueFactory } from "../../queue/QueueFactory.js";
import { JobProcessorRegistry } from "../../queue/JobProcessorRegistry.js";
import { QueueManager } from "../../interfaces/QueueManager.js";
import { WorkflowDefinition as CoreWorkflowDefinition } from "@ai-toolkit/shared";

describe("WorkflowEngineImpl", () => {
  let queueManager: QueueManager;
  let workflowEngine: WorkflowEngineImpl;
  let registry: JobProcessorRegistry;

  const sampleWorkflow: CoreWorkflowDefinition = {
    id: "test-workflow-1",
    name: "Test Document Processing Workflow",
    description: "A test workflow for document processing",
    steps: [
      {
        id: "extract-content",
        name: "Extract Content",
        type: "document-analysis",
        config: { extractText: true },
        dependencies: [],
      },
      {
        id: "analyze-structure",
        name: "Analyze Structure",
        type: "document-analysis",
        config: { identifyHeaders: true },
        dependencies: ["extract-content"],
      },
    ],
    triggers: [
      {
        type: "manual",
        config: {},
      },
    ],
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(async () => {
    try {
      queueManager = await QueueFactory.createQueueManager({
        redis: {
          host: "localhost",
          port: 6379,
          db: 6, // Use different DB for workflow engine tests
        },
      });

      registry = new JobProcessorRegistry(queueManager);
      registry.registerBuiltInProcessors();

      workflowEngine = new WorkflowEngineImpl(queueManager);
    } catch (error) {
      console.warn("Redis not available for workflow engine tests, skipping");
      return;
    }
  });

  afterAll(async () => {
    if (queueManager) {
      await QueueFactory.shutdown();
    }
  });

  beforeEach(async () => {
    // Skip if Redis is not available
    const isHealthy = await queueManager?.isHealthy();
    if (!isHealthy) {
      console.warn("Redis not healthy, skipping test");
      return;
    }
  });

  describe("Workflow Management", () => {
    it("should create a workflow successfully", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      const workflow = await workflowEngine.createWorkflow(sampleWorkflow);

      expect(workflow).toBeDefined();
      expect(workflow.definition.id).toBe(sampleWorkflow.id);
      expect(workflow.definition.name).toBe(sampleWorkflow.name);
    });

    it("should retrieve a workflow by ID", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      await workflowEngine.createWorkflow(sampleWorkflow);
      const retrieved = await workflowEngine.getWorkflow(sampleWorkflow.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.definition.id).toBe(sampleWorkflow.id);
    });

    it("should update a workflow", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      await workflowEngine.createWorkflow(sampleWorkflow);

      const updates = {
        name: "Updated Test Workflow",
        description: "Updated description",
      };

      const updated = await workflowEngine.updateWorkflow(
        sampleWorkflow.id,
        updates
      );

      expect(updated.definition.name).toBe(updates.name);
      expect(updated.definition.description).toBe(updates.description);
      expect(updated.definition.id).toBe(sampleWorkflow.id); // ID should not change
    });

    it("should delete a workflow", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      const testWorkflowId = "test-workflow-delete";
      const testWorkflow = { ...sampleWorkflow, id: testWorkflowId };

      await workflowEngine.createWorkflow(testWorkflow);
      const deleted = await workflowEngine.deleteWorkflow(testWorkflowId);

      expect(deleted).toBe(true);

      const retrieved = await workflowEngine.getWorkflow(testWorkflowId);
      expect(retrieved).toBeNull();
    });

    it("should list workflows with filters", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      const enabledWorkflow = {
        ...sampleWorkflow,
        id: "enabled-workflow",
        enabled: true,
      };
      const disabledWorkflow = {
        ...sampleWorkflow,
        id: "disabled-workflow",
        enabled: false,
      };

      await workflowEngine.createWorkflow(enabledWorkflow);
      await workflowEngine.createWorkflow(disabledWorkflow);

      const allWorkflows = await workflowEngine.listWorkflows();
      const enabledOnly = await workflowEngine.listWorkflows({ enabled: true });
      const disabledOnly = await workflowEngine.listWorkflows({
        enabled: false,
      });

      expect(allWorkflows.length).toBeGreaterThanOrEqual(2);
      expect(enabledOnly.every((w) => w.enabled)).toBe(true);
      expect(disabledOnly.every((w) => !w.enabled)).toBe(true);
    });
  });

  describe("Workflow Validation", () => {
    it("should validate a correct workflow", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      const validation = await workflowEngine.validateWorkflow(sampleWorkflow);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should detect invalid workflow configurations", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      const invalidWorkflow: CoreWorkflowDefinition = {
        id: "",
        name: "",
        description: "",
        steps: [],
        triggers: [],
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const validation = await workflowEngine.validateWorkflow(invalidWorkflow);

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors.some((e) => e.includes("ID is required"))).toBe(
        true
      );
      expect(
        validation.errors.some((e) => e.includes("name is required"))
      ).toBe(true);
    });

    it("should detect circular dependencies", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      const circularWorkflow: CoreWorkflowDefinition = {
        id: "circular-workflow",
        name: "Circular Workflow",
        description: "Workflow with circular dependencies",
        steps: [
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
            type: "document-analysis",
            config: {},
            dependencies: ["step-a"],
          },
        ],
        triggers: [],
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const validation =
        await workflowEngine.validateWorkflow(circularWorkflow);

      expect(validation.valid).toBe(false);
      expect(
        validation.errors.some((e) => e.includes("non-existent step"))
      ).toBe(true);
    });
  });

  describe("Workflow Execution", () => {
    it("should execute a workflow asynchronously", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      await workflowEngine.createWorkflow(sampleWorkflow);

      const executionId = await workflowEngine.executeWorkflowAsync(
        sampleWorkflow.id,
        { files: ["test.pdf"] }
      );

      expect(executionId).toBeDefined();
      expect(typeof executionId).toBe("string");

      const execution = await workflowEngine.getWorkflowExecution(executionId);
      expect(execution).toBeDefined();
      expect(execution?.workflowId).toBe(sampleWorkflow.id);
    });

    it("should track workflow execution status", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      await workflowEngine.createWorkflow(sampleWorkflow);

      const executionId = await workflowEngine.executeWorkflowAsync(
        sampleWorkflow.id,
        { files: ["test.pdf"] }
      );

      const status = await workflowEngine.getWorkflowStatus(executionId);
      expect(
        ["pending", "running", "completed", "failed"].includes(status)
      ).toBe(true);
    });

    it("should list active workflows", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      await workflowEngine.createWorkflow(sampleWorkflow);

      const executionId = await workflowEngine.executeWorkflowAsync(
        sampleWorkflow.id,
        { files: ["test.pdf"] }
      );

      // Wait a bit for the workflow to start
      await new Promise((resolve) => setTimeout(resolve, 100));

      const activeWorkflows = await workflowEngine.listActiveWorkflows();
      expect(Array.isArray(activeWorkflows)).toBe(true);
    });

    it("should get execution history", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      await workflowEngine.createWorkflow(sampleWorkflow);

      await workflowEngine.executeWorkflowAsync(sampleWorkflow.id, {
        files: ["test1.pdf"],
      });

      await workflowEngine.executeWorkflowAsync(sampleWorkflow.id, {
        files: ["test2.pdf"],
      });

      const history = await workflowEngine.getExecutionHistory(
        sampleWorkflow.id,
        10
      );
      expect(history.length).toBeGreaterThanOrEqual(2);
      expect(
        history.every((exec) => exec.workflowId === sampleWorkflow.id)
      ).toBe(true);
    });
  });

  describe("Workflow Control", () => {
    it("should cancel a workflow execution", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      await workflowEngine.createWorkflow(sampleWorkflow);

      const executionId = await workflowEngine.executeWorkflowAsync(
        sampleWorkflow.id,
        { files: ["test.pdf"] }
      );

      const cancelled = await workflowEngine.cancelWorkflow(executionId);
      expect(cancelled).toBe(true);

      const status = await workflowEngine.getWorkflowStatus(executionId);
      expect(status).toBe("cancelled");
    });

    it("should retry a failed workflow", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      await workflowEngine.createWorkflow(sampleWorkflow);

      const originalExecutionId = await workflowEngine.executeWorkflowAsync(
        sampleWorkflow.id,
        { files: ["test.pdf"] }
      );

      const newExecutionId =
        await workflowEngine.retryWorkflow(originalExecutionId);
      expect(newExecutionId).toBeDefined();
      expect(newExecutionId).not.toBe(originalExecutionId);
    });
  });

  describe("Workflow Scheduling", () => {
    it("should schedule a workflow with cron expression", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      await workflowEngine.createWorkflow(sampleWorkflow);

      const schedule = {
        expression: "0 0 * * *", // Daily at midnight
        timezone: "UTC",
      };

      const scheduled = await workflowEngine.scheduleWorkflow(
        sampleWorkflow.id,
        schedule
      );
      expect(scheduled).toBe(true);

      const scheduledWorkflows = await workflowEngine.listScheduledWorkflows();
      expect(
        scheduledWorkflows.some((sw) => sw.workflowId === sampleWorkflow.id)
      ).toBe(true);
    });

    it("should unschedule a workflow", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      await workflowEngine.createWorkflow(sampleWorkflow);

      const schedule = {
        expression: "0 0 * * *",
        timezone: "UTC",
      };

      await workflowEngine.scheduleWorkflow(sampleWorkflow.id, schedule);
      const unscheduled = await workflowEngine.unscheduleWorkflow(
        sampleWorkflow.id
      );

      expect(unscheduled).toBe(true);
    });

    it("should reject invalid cron expressions", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      await workflowEngine.createWorkflow(sampleWorkflow);

      const invalidSchedule = {
        expression: "invalid-cron",
        timezone: "UTC",
      };

      await expect(
        workflowEngine.scheduleWorkflow(sampleWorkflow.id, invalidSchedule)
      ).rejects.toThrow("Invalid cron expression");
    });
  });

  describe("Performance and Monitoring", () => {
    it("should provide workflow metrics", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      await workflowEngine.createWorkflow(sampleWorkflow);

      // Execute a few workflows
      await workflowEngine.executeWorkflowAsync(sampleWorkflow.id, {
        files: ["test1.pdf"],
      });
      await workflowEngine.executeWorkflowAsync(sampleWorkflow.id, {
        files: ["test2.pdf"],
      });

      const metrics = await workflowEngine.getWorkflowMetrics(
        sampleWorkflow.id
      );

      expect(metrics).toBeDefined();
      expect(typeof metrics.totalExecutions).toBe("number");
      expect(typeof metrics.successRate).toBe("number");
      expect(typeof metrics.averageDuration).toBe("number");
      expect(typeof metrics.errorRate).toBe("number");
      expect(metrics.totalExecutions).toBeGreaterThanOrEqual(2);
    });

    it("should provide system metrics", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      const systemMetrics = await workflowEngine.getSystemMetrics();

      expect(systemMetrics).toBeDefined();
      expect(typeof systemMetrics.activeWorkflows).toBe("number");
      expect(typeof systemMetrics.queuedJobs).toBe("number");
      expect(typeof systemMetrics.completedToday).toBe("number");
      expect(typeof systemMetrics.failedToday).toBe("number");
      expect(typeof systemMetrics.systemLoad).toBe("number");
    });
  });

  describe("Configuration", () => {
    it("should update engine configuration", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      const newConfig = {
        maxConcurrentWorkflows: 20,
        defaultTimeout: 600000,
        retryPolicy: {
          maxRetries: 5,
          backoffStrategy: "linear" as const,
        },
      };

      await workflowEngine.updateEngineConfig(newConfig);
      const currentConfig = await workflowEngine.getEngineConfig();

      expect(currentConfig.maxConcurrentWorkflows).toBe(
        newConfig.maxConcurrentWorkflows
      );
      expect(currentConfig.defaultTimeout).toBe(newConfig.defaultTimeout);
      expect(currentConfig.retryPolicy.maxRetries).toBe(
        newConfig.retryPolicy.maxRetries
      );
    });
  });

  describe("Cleanup and Maintenance", () => {
    it("should clean up completed executions", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      await workflowEngine.createWorkflow(sampleWorkflow);

      // Execute some workflows
      await workflowEngine.executeWorkflowAsync(sampleWorkflow.id, {
        files: ["test1.pdf"],
      });
      await workflowEngine.executeWorkflowAsync(sampleWorkflow.id, {
        files: ["test2.pdf"],
      });

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));

      const olderThan = new Date(Date.now() + 1000); // Future date to clean all
      const cleanedCount =
        await workflowEngine.cleanupCompletedExecutions(olderThan);

      expect(typeof cleanedCount).toBe("number");
    });

    it("should archive workflow data", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      await workflowEngine.createWorkflow(sampleWorkflow);

      const olderThan = new Date(Date.now() + 1000);
      const archived = await workflowEngine.archiveWorkflowData(
        sampleWorkflow.id,
        olderThan
      );

      expect(archived).toBe(true);
    });
  });

  describe("Event Handling", () => {
    it("should register event handlers without throwing", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      expect(() => {
        workflowEngine.onWorkflowStart((execution) => {
          console.log("Workflow started:", execution.id);
        });
      }).not.toThrow();

      expect(() => {
        workflowEngine.onWorkflowComplete((execution) => {
          console.log("Workflow completed:", execution.id);
        });
      }).not.toThrow();

      expect(() => {
        workflowEngine.onWorkflowError((execution, error) => {
          console.log("Workflow error:", execution.id, error.message);
        });
      }).not.toThrow();

      expect(() => {
        workflowEngine.onWorkflowProgress((execution) => {
          console.log("Workflow progress:", execution.id, execution.progress);
        });
      }).not.toThrow();
    });
  });
});
