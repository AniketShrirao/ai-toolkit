import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Job } from "bullmq";
import { JobProcessorRegistry } from "../../queue/JobProcessorRegistry.js";
import { QueueFactory } from "../../queue/QueueFactory.js";
import { QueueManager } from "../../interfaces/QueueManager.js";

describe("JobProcessorRegistry", () => {
  let queueManager: QueueManager;
  let registry: JobProcessorRegistry;

  beforeAll(async () => {
    try {
      queueManager = await QueueFactory.createQueueManager({
        redis: {
          host: "localhost",
          port: 6379,
          db: 4, // Use different DB for processor tests
        },
      });
      registry = new JobProcessorRegistry(queueManager);
    } catch (error) {
      console.warn("Redis not available for processor tests, skipping");
      return;
    }
  });

  afterAll(async () => {
    if (queueManager) {
      await QueueFactory.shutdown();
    }
  });

  describe("Processor Registration", () => {
    it("should register a custom processor", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      const testProcessor = {
        name: "test-processor",
        description: "A test processor",
        queueName: "document-processing",
        processor: async (job: Job) => {
          return { processed: true, jobId: job.id };
        },
      };

      registry.registerProcessor(testProcessor);

      const retrievedProcessor = registry.getProcessor("test-processor");
      expect(retrievedProcessor).toBeDefined();
      expect(retrievedProcessor?.name).toBe("test-processor");
      expect(retrievedProcessor?.description).toBe("A test processor");
    });

    it("should list all registered processors", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      const initialCount = registry.listProcessors().length;

      registry.registerProcessor({
        name: "list-test-processor",
        description: "Processor for list test",
        queueName: "ai-analysis",
        processor: async () => ({ result: "test" }),
      });

      const processors = registry.listProcessors();
      expect(processors.length).toBe(initialCount + 1);
      expect(processors.some((p) => p.name === "list-test-processor")).toBe(
        true
      );
    });

    it("should unregister a processor", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      registry.registerProcessor({
        name: "temp-processor",
        description: "Temporary processor",
        queueName: "workflow-execution",
        processor: async () => ({ temp: true }),
      });

      expect(registry.getProcessor("temp-processor")).toBeDefined();

      const unregistered = registry.unregisterProcessor("temp-processor");
      expect(unregistered).toBe(true);
      expect(registry.getProcessor("temp-processor")).toBeUndefined();
    });

    it("should return false when unregistering non-existent processor", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      const result = registry.unregisterProcessor("non-existent-processor");
      expect(result).toBe(false);
    });
  });

  describe("Built-in Processors", () => {
    beforeAll(async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      registry.registerBuiltInProcessors();
    });

    it("should register all built-in processors", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      const processors = registry.listProcessors();
      const builtInProcessorNames = [
        "document-analysis",
        "ai-analysis",
        "workflow-execution",
        "file-operations",
        "notification",
      ];

      for (const name of builtInProcessorNames) {
        expect(processors.some((p) => p.name === name)).toBe(true);
      }
    });

    it("should have document-analysis processor", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      const processor = registry.getProcessor("document-analysis");
      expect(processor).toBeDefined();
      expect(processor?.queueName).toBe("document-processing");
      expect(processor?.description).toContain("document");
    });

    it("should have ai-analysis processor", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      const processor = registry.getProcessor("ai-analysis");
      expect(processor).toBeDefined();
      expect(processor?.queueName).toBe("ai-analysis");
      expect(processor?.description).toContain("AI");
    });

    it("should have workflow-execution processor", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      const processor = registry.getProcessor("workflow-execution");
      expect(processor).toBeDefined();
      expect(processor?.queueName).toBe("workflow-execution");
      expect(processor?.description).toContain("workflow");
    });

    it("should have file-operations processor", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      const processor = registry.getProcessor("file-operations");
      expect(processor).toBeDefined();
      expect(processor?.queueName).toBe("file-operations");
      expect(processor?.description).toContain("file");
    });

    it("should have notification processor", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      const processor = registry.getProcessor("notification");
      expect(processor).toBeDefined();
      expect(processor?.queueName).toBe("notifications");
      expect(processor?.description).toContain("notification");
    });
  });

  describe("Processor Functionality", () => {
    it("should execute a simple processor", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      const simpleProcessor = {
        name: "simple-test",
        description: "Simple test processor",
        queueName: "document-processing",
        processor: async (job: Job) => {
          return {
            jobId: job.id,
            data: job.data,
            processed: true,
            timestamp: new Date(),
          };
        },
      };

      registry.registerProcessor(simpleProcessor);

      const processor = registry.getProcessor("simple-test");
      expect(processor).toBeDefined();

      // Create a mock job
      const mockJob = {
        id: "test-job-123",
        data: { test: "data" },
        updateProgress: async () => {},
      } as unknown as Job;

      const result = await processor!.processor(mockJob);
      expect(result.processed).toBe(true);
      expect(result.jobId).toBe("test-job-123");
      expect(result.data).toEqual({ test: "data" });
    });
  });
});
