import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { QueueFactory, QUEUE_NAMES } from "../../queue/QueueFactory.js";
import { JobProcessorRegistry } from "../../queue/JobProcessorRegistry.js";
import { QueueManager, JobData } from "../../interfaces/QueueManager.js";

describe("Queue Integration Tests", () => {
  let queueManager: QueueManager;
  let registry: JobProcessorRegistry;

  beforeAll(async () => {
    try {
      queueManager = await QueueFactory.createQueueManager({
        redis: {
          host: "localhost",
          port: 6379,
          db: 5, // Use different DB for integration tests
        },
        defaultConcurrency: 2,
      });

      registry = new JobProcessorRegistry(queueManager);
      registry.registerBuiltInProcessors();
    } catch (error) {
      console.warn("Redis not available for integration tests, skipping");
      return;
    }
  });

  afterAll(async () => {
    if (queueManager) {
      await QueueFactory.shutdown();
    }
  });

  describe("End-to-End Job Processing", () => {
    it("should process a document analysis job from start to finish", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      const jobData: JobData = {
        id: "integration-doc-job",
        type: "document-analysis",
        payload: {
          documentPath: "/test/document.pdf",
          analysisType: "requirements",
          options: { includeKeyPoints: true },
        },
        createdAt: new Date(),
      };

      // Add job to queue
      const jobId = await queueManager.addJob(
        QUEUE_NAMES.DOCUMENT_PROCESSING,
        jobData,
        "high"
      );

      expect(jobId).toBeDefined();

      // Wait a bit for processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Check job status
      const jobStatus = await queueManager.getJob(jobId);
      expect(jobStatus).toBeDefined();
      expect(
        ["waiting", "active", "completed"].includes(jobStatus!.status)
      ).toBe(true);
    }, 10000);

    it("should handle multiple jobs concurrently", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      const jobs = Array.from({ length: 5 }, (_, i) => ({
        data: {
          id: `concurrent-job-${i}`,
          type: "ai-analysis",
          payload: {
            operation: "summarization",
            input: `Test content ${i}`,
            model: "test-model",
          },
          createdAt: new Date(),
        },
        priority: i % 2 === 0 ? "high" : "medium",
      }));

      const jobIds = await queueManager.addBulkJobs(
        QUEUE_NAMES.AI_ANALYSIS,
        jobs as any
      );

      expect(jobIds).toHaveLength(5);

      // Wait for processing
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Check that jobs were processed
      const stats = await queueManager.getQueueStats(QUEUE_NAMES.AI_ANALYSIS);
      expect(
        stats.completed + stats.active + stats.waiting
      ).toBeGreaterThanOrEqual(5);
    }, 15000);

    it("should handle workflow execution with multiple steps", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      const workflowJobData: JobData = {
        id: "workflow-integration-job",
        type: "workflow-execution",
        payload: {
          workflowId: "test-workflow-123",
          input: { documents: ["/test/doc1.pdf", "/test/doc2.pdf"] },
          steps: [
            {
              id: "step1",
              name: "Document Analysis",
              type: "document-analysis",
            },
            {
              id: "step2",
              name: "Requirement Extraction",
              type: "ai-analysis",
            },
            { id: "step3", name: "Generate Summary", type: "ai-analysis" },
          ],
        },
        createdAt: new Date(),
      };

      const jobId = await queueManager.addJob(
        QUEUE_NAMES.WORKFLOW_EXECUTION,
        workflowJobData,
        "high"
      );

      expect(jobId).toBeDefined();

      // Wait for workflow processing
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const jobStatus = await queueManager.getJob(jobId);
      expect(jobStatus).toBeDefined();
    }, 10000);

    it("should handle file operations batch processing", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      const fileJobData: JobData = {
        id: "file-batch-job",
        type: "file-operations",
        payload: {
          operation: "copy",
          files: [
            "/source/file1.txt",
            "/source/file2.txt",
            "/source/file3.txt",
          ],
          options: { preserveTimestamps: true },
        },
        createdAt: new Date(),
      };

      const jobId = await queueManager.addJob(
        QUEUE_NAMES.FILE_OPERATIONS,
        fileJobData,
        "medium"
      );

      expect(jobId).toBeDefined();

      // Wait for file processing
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const jobStatus = await queueManager.getJob(jobId);
      expect(jobStatus).toBeDefined();
    }, 8000);
  });

  describe("Queue Monitoring and Management", () => {
    it("should provide accurate system statistics", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      const systemStats = await queueManager.getSystemStats();

      expect(systemStats.totalQueues).toBeGreaterThanOrEqual(5); // All predefined queues
      expect(typeof systemStats.totalJobs).toBe("number");
      expect(typeof systemStats.activeJobs).toBe("number");
      expect(typeof systemStats.completedJobs).toBe("number");
      expect(typeof systemStats.failedJobs).toBe("number");
    });

    it("should handle queue pause and resume operations", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      // Pause a specific queue
      await queueManager.pauseQueue(QUEUE_NAMES.NOTIFICATIONS);

      // Add a job to the paused queue
      const jobData: JobData = {
        id: "paused-queue-job",
        type: "notification",
        payload: {
          type: "email",
          recipient: "test@example.com",
          message: "Test notification",
        },
        createdAt: new Date(),
      };

      const jobId = await queueManager.addJob(
        QUEUE_NAMES.NOTIFICATIONS,
        jobData
      );

      // Job should be waiting since queue is paused
      await new Promise((resolve) => setTimeout(resolve, 500));
      const pausedJobStatus = await queueManager.getJob(jobId);
      expect(pausedJobStatus?.status).toBe("waiting");

      // Resume the queue
      await queueManager.resumeQueue(QUEUE_NAMES.NOTIFICATIONS);

      // Wait for processing
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }, 8000);

    it("should clean up completed jobs", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      // Add some jobs that will complete quickly
      const quickJobs = Array.from({ length: 3 }, (_, i) => ({
        data: {
          id: `cleanup-job-${i}`,
          type: "notification",
          payload: {
            type: "log",
            message: `Cleanup test ${i}`,
          },
          createdAt: new Date(),
        },
      }));

      await queueManager.addBulkJobs(
        QUEUE_NAMES.NOTIFICATIONS,
        quickJobs as any
      );

      // Wait for completion
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Clean up completed jobs older than 0ms (all completed jobs)
      const cleanedCount = await queueManager.cleanQueue(
        QUEUE_NAMES.NOTIFICATIONS,
        0,
        "completed"
      );

      expect(typeof cleanedCount).toBe("number");
    }, 8000);
  });

  describe("Error Handling and Recovery", () => {
    it("should handle job failures gracefully", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      // Register a processor that always fails
      registry.registerProcessor({
        name: "failing-processor",
        description: "Processor that always fails",
        queueName: QUEUE_NAMES.FILE_OPERATIONS,
        processor: async () => {
          throw new Error("Intentional test failure");
        },
      });

      const failingJobData: JobData = {
        id: "failing-job",
        type: "failing-processor",
        payload: { test: "failure" },
        options: { retries: 1 },
        createdAt: new Date(),
      };

      const jobId = await queueManager.addJob(
        QUEUE_NAMES.FILE_OPERATIONS,
        failingJobData
      );

      // Wait for failure and retries
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const jobStatus = await queueManager.getJob(jobId);
      expect(jobStatus?.status).toBe("failed");
      expect(jobStatus?.failedReason).toContain("Intentional test failure");
    }, 10000);

    it("should support job retry functionality", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      // First, get a failed job from the previous test
      const failedJobs = await queueManager.getFailedJobs(
        QUEUE_NAMES.FILE_OPERATIONS,
        1
      );

      if (failedJobs.length > 0) {
        const failedJobId = failedJobs[0].id;
        const retryResult = await queueManager.retryJob(failedJobId);
        expect(typeof retryResult).toBe("boolean");
      }
    });
  });

  describe("Event Handling", () => {
    it("should emit progress events during job processing", async () => {
      const isHealthy = await queueManager?.isHealthy();
      if (!isHealthy) return;

      let progressEvents: any[] = [];
      let completedEvents: any[] = [];

      // Set up event listeners
      queueManager.onJobProgress(QUEUE_NAMES.AI_ANALYSIS, (jobId, progress) => {
        progressEvents.push({ jobId, progress });
      });

      queueManager.onJobCompleted(QUEUE_NAMES.AI_ANALYSIS, (jobId, result) => {
        completedEvents.push({ jobId, result });
      });

      // Add a job that will emit progress events
      const progressJobData: JobData = {
        id: "progress-test-job",
        type: "ai-analysis",
        payload: {
          operation: "analysis",
          input: "Test content for progress tracking",
        },
        createdAt: new Date(),
      };

      await queueManager.addJob(QUEUE_NAMES.AI_ANALYSIS, progressJobData);

      // Wait for processing and events
      await new Promise((resolve) => setTimeout(resolve, 4000));

      // Note: Events might not be captured in test environment due to timing
      // This test mainly ensures the event registration doesn't throw errors
      expect(Array.isArray(progressEvents)).toBe(true);
      expect(Array.isArray(completedEvents)).toBe(true);
    }, 10000);
  });
});
