import { Job } from "bullmq";
import { QueueManager } from "../interfaces/QueueManager.js";
import { BullMQManager } from "./BullMQManager.js";

export type JobProcessor = (job: Job) => Promise<any>;

export interface JobProcessorInfo {
  name: string;
  description: string;
  processor: JobProcessor;
  queueName: string;
}

export class JobProcessorRegistry {
  private processors: Map<string, JobProcessorInfo> = new Map();
  private queueManager: QueueManager;

  constructor(queueManager: QueueManager) {
    this.queueManager = queueManager;
  }

  registerProcessor(info: JobProcessorInfo): void {
    this.processors.set(info.name, info);

    // Register with the queue manager if it's a BullMQManager
    if (this.queueManager instanceof BullMQManager) {
      this.queueManager.registerJobProcessor(info.queueName, info.processor);
    }
  }

  getProcessor(name: string): JobProcessorInfo | undefined {
    return this.processors.get(name);
  }

  listProcessors(): JobProcessorInfo[] {
    return Array.from(this.processors.values());
  }

  unregisterProcessor(name: string): boolean {
    return this.processors.delete(name);
  }

  // Built-in processors for common workflow operations
  registerBuiltInProcessors(): void {
    // Document processing job
    this.registerProcessor({
      name: "document-analysis",
      description: "Process and analyze documents using AI",
      queueName: "document-processing",
      processor: async (job: Job) => {
        const { documentPath, analysisType, options } = job.data;

        // Update progress
        await job.updateProgress({
          current: 10,
          total: 100,
          message: "Starting document analysis...",
        });

        try {
          // Simulate document processing
          // In real implementation, this would call the document analyzer
          await new Promise((resolve) => setTimeout(resolve, 1000));

          await job.updateProgress({
            current: 50,
            total: 100,
            message: "Analyzing document structure...",
          });

          await new Promise((resolve) => setTimeout(resolve, 1000));

          await job.updateProgress({
            current: 90,
            total: 100,
            message: "Finalizing analysis...",
          });

          const result = {
            documentPath,
            analysisType,
            result: {
              summary: "Document analysis completed",
              keyPoints: [],
              requirements: [],
              actionItems: [],
            },
            processedAt: new Date(),
          };

          await job.updateProgress({
            current: 100,
            total: 100,
            message: "Analysis complete",
          });

          return result;
        } catch (error) {
          throw new Error(`Document analysis failed: ${error}`);
        }
      },
    });

    // AI analysis job
    this.registerProcessor({
      name: "ai-analysis",
      description: "Perform AI-powered analysis operations",
      queueName: "ai-analysis",
      processor: async (job: Job) => {
        const { operation, input, model, options } = job.data;

        await job.updateProgress({
          current: 10,
          total: 100,
          message: `Starting ${operation} analysis...`,
        });

        try {
          // Simulate AI processing
          await new Promise((resolve) => setTimeout(resolve, 2000));

          await job.updateProgress({
            current: 70,
            total: 100,
            message: "Processing with AI model...",
          });

          await new Promise((resolve) => setTimeout(resolve, 1000));

          const result = {
            operation,
            input,
            model,
            output: `AI analysis result for ${operation}`,
            confidence: 0.85,
            processedAt: new Date(),
          };

          await job.updateProgress({
            current: 100,
            total: 100,
            message: "AI analysis complete",
          });

          return result;
        } catch (error) {
          throw new Error(`AI analysis failed: ${error}`);
        }
      },
    });

    // Workflow execution job
    this.registerProcessor({
      name: "workflow-execution",
      description: "Execute complete workflows",
      queueName: "workflow-execution",
      processor: async (job: Job) => {
        const { workflowId, input, steps } = job.data;

        await job.updateProgress({
          current: 0,
          total: steps.length,
          message: "Starting workflow execution...",
        });

        const results = [];

        try {
          for (let i = 0; i < steps.length; i++) {
            const step = steps[i];

            await job.updateProgress({
              current: i,
              total: steps.length,
              message: `Executing step: ${step.name}`,
            });

            // Simulate step execution
            await new Promise((resolve) => setTimeout(resolve, 500));

            results.push({
              stepId: step.id,
              stepName: step.name,
              result: `Step ${step.name} completed`,
              executedAt: new Date(),
            });
          }

          await job.updateProgress({
            current: steps.length,
            total: steps.length,
            message: "Workflow execution complete",
          });

          return {
            workflowId,
            input,
            results,
            completedAt: new Date(),
          };
        } catch (error) {
          throw new Error(`Workflow execution failed: ${error}`);
        }
      },
    });

    // File operations job
    this.registerProcessor({
      name: "file-operations",
      description: "Handle file system operations",
      queueName: "file-operations",
      processor: async (job: Job) => {
        const { operation, files, options } = job.data;

        await job.updateProgress({
          current: 0,
          total: files.length,
          message: `Starting ${operation} operation...`,
        });

        const results = [];

        try {
          for (let i = 0; i < files.length; i++) {
            const file = files[i];

            await job.updateProgress({
              current: i,
              total: files.length,
              message: `Processing file: ${file}`,
            });

            // Simulate file operation
            await new Promise((resolve) => setTimeout(resolve, 200));

            results.push({
              file,
              operation,
              success: true,
              processedAt: new Date(),
            });
          }

          await job.updateProgress({
            current: files.length,
            total: files.length,
            message: "File operations complete",
          });

          return {
            operation,
            files,
            results,
            completedAt: new Date(),
          };
        } catch (error) {
          throw new Error(`File operation failed: ${error}`);
        }
      },
    });

    // Notification job
    this.registerProcessor({
      name: "notification",
      description: "Send notifications and alerts",
      queueName: "notifications",
      processor: async (job: Job) => {
        const { type, recipient, message, options } = job.data;

        await job.updateProgress({
          current: 50,
          total: 100,
          message: "Sending notification...",
        });

        try {
          // Simulate notification sending
          await new Promise((resolve) => setTimeout(resolve, 500));

          const result = {
            type,
            recipient,
            message,
            sent: true,
            sentAt: new Date(),
          };

          await job.updateProgress({
            current: 100,
            total: 100,
            message: "Notification sent",
          });

          return result;
        } catch (error) {
          throw new Error(`Notification failed: ${error}`);
        }
      },
    });
  }
}
