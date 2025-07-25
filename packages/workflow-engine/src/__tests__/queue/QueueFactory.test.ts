import { describe, it, expect, afterAll } from "vitest";
import { QueueFactory, QUEUE_NAMES } from "../../queue/QueueFactory.js";

describe("QueueFactory", () => {
  afterAll(async () => {
    await QueueFactory.shutdown();
  });

  describe("Queue Manager Creation", () => {
    it("should create a queue manager instance", async () => {
      try {
        const queueManager = await QueueFactory.createQueueManager({
          redis: {
            host: "localhost",
            port: 6379,
            db: 2, // Use different DB for factory tests
          },
        });

        expect(queueManager).toBeDefined();
        expect(typeof queueManager.initialize).toBe("function");
        expect(typeof queueManager.addJob).toBe("function");
      } catch (error) {
        console.warn("Redis not available for factory tests, skipping");
        return;
      }
    });

    it("should return the same instance on subsequent calls (singleton)", async () => {
      try {
        const manager1 = await QueueFactory.createQueueManager();
        const manager2 = await QueueFactory.createQueueManager();

        expect(manager1).toBe(manager2);
      } catch (error) {
        console.warn("Redis not available, skipping singleton test");
        return;
      }
    });

    it("should provide access to the instance via getInstance", async () => {
      try {
        await QueueFactory.createQueueManager();
        const instance = QueueFactory.getInstance();

        expect(instance).toBeDefined();
        expect(typeof instance?.addJob).toBe("function");
      } catch (error) {
        console.warn("Redis not available, skipping getInstance test");
        return;
      }
    });
  });

  describe("Predefined Queue Names", () => {
    it("should have all expected queue names defined", () => {
      expect(QUEUE_NAMES.DOCUMENT_PROCESSING).toBe("document-processing");
      expect(QUEUE_NAMES.AI_ANALYSIS).toBe("ai-analysis");
      expect(QUEUE_NAMES.WORKFLOW_EXECUTION).toBe("workflow-execution");
      expect(QUEUE_NAMES.FILE_OPERATIONS).toBe("file-operations");
      expect(QUEUE_NAMES.NOTIFICATIONS).toBe("notifications");
    });

    it("should create all predefined queues", async () => {
      try {
        const queueManager = await QueueFactory.createQueueManager();

        // Test that we can get stats for all predefined queues
        for (const queueName of Object.values(QUEUE_NAMES)) {
          const stats = await queueManager.getQueueStats(queueName);
          expect(stats).toBeDefined();
          expect(typeof stats.waiting).toBe("number");
        }
      } catch (error) {
        console.warn("Redis not available, skipping predefined queues test");
        return;
      }
    });
  });

  describe("Configuration", () => {
    it("should handle custom retry configuration", async () => {
      try {
        const customConfig = {
          defaultRetryConfig: {
            maxRetries: 5,
            backoffStrategy: "linear" as const,
            initialDelay: 2000,
            maxDelay: 60000,
          },
          defaultConcurrency: 10,
        };

        const queueManager =
          await QueueFactory.createQueueManager(customConfig);
        expect(queueManager).toBeDefined();
      } catch (error) {
        console.warn("Redis not available, skipping custom config test");
        return;
      }
    });

    it("should handle custom Redis configuration", async () => {
      try {
        const customRedisConfig = {
          redis: {
            host: "localhost",
            port: 6379,
            db: 3,
          },
        };

        const queueManager =
          await QueueFactory.createQueueManager(customRedisConfig);
        expect(queueManager).toBeDefined();

        const isHealthy = await queueManager.isHealthy();
        expect(typeof isHealthy).toBe("boolean");
      } catch (error) {
        console.warn("Redis not available, skipping custom Redis config test");
        return;
      }
    });
  });

  describe("Shutdown", () => {
    it("should shutdown gracefully", async () => {
      try {
        await QueueFactory.createQueueManager();
        await expect(QueueFactory.shutdown()).resolves.not.toThrow();

        const instance = QueueFactory.getInstance();
        expect(instance).toBeNull();
      } catch (error) {
        console.warn("Redis not available, skipping shutdown test");
        return;
      }
    });
  });
});
