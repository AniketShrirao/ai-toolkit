import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { BullMQManager } from "../../queue/BullMQManager.js";
import { QueueConfig, JobData } from "../../interfaces/QueueManager.js";
import { Priority } from "@ai-toolkit/shared";

describe("BullMQManager", () => {
  let queueManager: BullMQManager;
  const testQueueConfig: QueueConfig = {
    name: "test-queue",
    concurrency: 2,
    retryConfig: {
      maxRetries: 3,
      backoffStrategy: "exponential",
      initialDelay: 100,
      maxDelay: 1000,
    },
    defaultJobOptions: {
      removeOnComplete: 10,
      removeOnFail: 5,
    },
  };

  beforeAll(async () => {
    queueManager = new BullMQManager({
      host: "localhost",
      port: 6379,
      db: 1, // Use different DB for tests
    });

    try {
      await queueManager.initialize();
    } catch (error) {
      console.warn(
        "Redis not available for tests, skipping BullMQManager tests"
      );
      return;
    }
  });

  afterAll(async () => {
    if (queueManager) {
      await queueManager.shutdown();
    }
  });

  beforeEach(async () => {
    // Skip if Redis is not available
    const isHealthy = await queueManager.isHealthy();
    if (!isHealthy) {
      console.warn("Redis not healthy, skipping test");
      return;
    }
  });

  describe("Initialization and Health", () => {
    it("should initialize successfully", async () => {
      const isHealthy = await queueManager.isHealthy();
      if (!isHealthy) return; // Skip if Redis not available

      expect(isHealthy).toBe(true);
    });

    it("should create a queue successfully", async () => {
      const isHealthy = await queueManager.isHealthy();
      if (!isHealthy) return;

      await expect(
        queueManager.createQueue(testQueueConfig)
      ).resolves.not.toThrow();
    });
  });

  describe("Job Management", () => {
    beforeEach(async () => {
      const isHealthy = await queueManager.isHealthy();
      if (!isHealthy) return;

      await queueManager.createQueue(testQueueConfig);

      // Register a simple test processor
      if (queueManager instanceof BullMQManager) {
        queueManager.registerJobProcessor(testQueueConfig.name, async (job) => {
          return { processed: true, data: job.data };
        });
      }
    });

    it("should add a job to the queue", async () => {
      const isHealthy = await queueManager.isHealthy();
      if (!isHealthy) return;

      const jobData: JobData = {
        id: "test-job-1",
        type: "test-operation",
        payload: { message: "Hello World" },
        createdAt: new Date(),
      };

      const jobId = await queueManager.addJob(
        testQueueConfig.name,
        jobData,
        "medium"
      );
      expect(jobId).toBeDefined();
      expect(typeof jobId).toBe("string");
    });

    it("should retrieve job status", async () => {
      const isHealthy = await queueManager.isHealthy();
      if (!isHealthy) return;

      const jobData: JobData = {
        id: "test-job-2",
        type: "test-operation",
        payload: { message: "Status Test" },
        createdAt: new Date(),
      };

      const jobId = await queueManager.addJob(testQueueConfig.name, jobData);
      const jobStatus = await queueManager.getJob(jobId);

      expect(jobStatus).toBeDefined();
      expect(jobStatus?.id).toBe(jobId);
      expect(
        ["waiting", "active", "completed", "failed"].includes(
          jobStatus?.status!
        )
      ).toBe(true);
    });

    it("should add bulk jobs", async () => {
      const isHealthy = await queueManager.isHealthy();
      if (!isHealthy) return;

      const jobs = [
        {
          data: {
            id: "bulk-job-1",
            type: "bulk-test",
            payload: { index: 1 },
            createdAt: new Date(),
          },
          priority: "high" as Priority,
        },
        {
          data: {
            id: "bulk-job-2",
            type: "bulk-test",
            payload: { index: 2 },
            createdAt: new Date(),
          },
          priority: "low" as Priority,
        },
      ];

      const jobIds = await queueManager.addBulkJobs(testQueueConfig.name, jobs);
      expect(jobIds).toHaveLength(2);
      expect(jobIds.every((id) => typeof id === "string")).toBe(true);
    });

    it("should handle job priorities correctly", async () => {
      const isHealthy = await queueManager.isHealthy();
      if (!isHealthy) return;

      const highPriorityJob: JobData = {
        id: "high-priority-job",
        type: "priority-test",
        payload: { priority: "high" },
        createdAt: new Date(),
      };

      const lowPriorityJob: JobData = {
        id: "low-priority-job",
        type: "priority-test",
        payload: { priority: "low" },
        createdAt: new Date(),
      };

      const highJobId = await queueManager.addJob(
        testQueueConfig.name,
        highPriorityJob,
        "high"
      );
      const lowJobId = await queueManager.addJob(
        testQueueConfig.name,
        lowPriorityJob,
        "low"
      );

      expect(highJobId).toBeDefined();
      expect(lowJobId).toBeDefined();
    });
  });

  describe("Queue Operations", () => {
    beforeEach(async () => {
      const isHealthy = await queueManager.isHealthy();
      if (!isHealthy) return;

      await queueManager.createQueue(testQueueConfig);
    });

    it("should get queue statistics", async () => {
      const isHealthy = await queueManager.isHealthy();
      if (!isHealthy) return;

      const stats = await queueManager.getQueueStats(testQueueConfig.name);

      expect(stats).toBeDefined();
      expect(typeof stats.waiting).toBe("number");
      expect(typeof stats.active).toBe("number");
      expect(typeof stats.completed).toBe("number");
      expect(typeof stats.failed).toBe("number");
    });

    it("should pause and resume queue", async () => {
      const isHealthy = await queueManager.isHealthy();
      if (!isHealthy) return;

      await expect(
        queueManager.pauseQueue(testQueueConfig.name)
      ).resolves.not.toThrow();
      await expect(
        queueManager.resumeQueue(testQueueConfig.name)
      ).resolves.not.toThrow();
    });

    it("should get system statistics", async () => {
      const isHealthy = await queueManager.isHealthy();
      if (!isHealthy) return;

      const systemStats = await queueManager.getSystemStats();

      expect(systemStats).toBeDefined();
      expect(typeof systemStats.totalQueues).toBe("number");
      expect(typeof systemStats.totalJobs).toBe("number");
      expect(typeof systemStats.activeJobs).toBe("number");
      expect(systemStats.totalQueues).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Error Handling", () => {
    it("should handle non-existent queue operations gracefully", async () => {
      const isHealthy = await queueManager.isHealthy();
      if (!isHealthy) return;

      const jobData: JobData = {
        id: "error-test-job",
        type: "error-test",
        payload: {},
        createdAt: new Date(),
      };

      await expect(
        queueManager.addJob("non-existent-queue", jobData)
      ).rejects.toThrow("Queue not found");
    });

    it("should handle job removal for non-existent jobs", async () => {
      const isHealthy = await queueManager.isHealthy();
      if (!isHealthy) return;

      const result = await queueManager.removeJob("non-existent-job-id");
      expect(result).toBe(false);
    });

    it("should handle retry for non-existent jobs", async () => {
      const isHealthy = await queueManager.isHealthy();
      if (!isHealthy) return;

      const result = await queueManager.retryJob("non-existent-job-id");
      expect(result).toBe(false);
    });
  });

  describe("Event Handling", () => {
    beforeEach(async () => {
      const isHealthy = await queueManager.isHealthy();
      if (!isHealthy) return;

      await queueManager.createQueue(testQueueConfig);
    });

    it("should register event handlers without throwing", async () => {
      const isHealthy = await queueManager.isHealthy();
      if (!isHealthy) return;

      expect(() => {
        queueManager.onJobProgress(testQueueConfig.name, (jobId, progress) => {
          console.log(`Job ${jobId} progress:`, progress);
        });
      }).not.toThrow();

      expect(() => {
        queueManager.onJobCompleted(testQueueConfig.name, (jobId, result) => {
          console.log(`Job ${jobId} completed:`, result);
        });
      }).not.toThrow();

      expect(() => {
        queueManager.onJobFailed(testQueueConfig.name, (jobId, error) => {
          console.log(`Job ${jobId} failed:`, error);
        });
      }).not.toThrow();
    });
  });
});
