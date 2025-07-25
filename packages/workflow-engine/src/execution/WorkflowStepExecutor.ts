import {
  CoreWorkflowStep as WorkflowStep,
  WorkflowStepType,
} from "@ai-toolkit/shared";
import { QueueManager, JobData } from "../interfaces/QueueManager.js";
import { QUEUE_NAMES } from "../queue/QueueFactory.js";

export interface StepExecutionContext {
  workflowId: string;
  executionId: string;
  stepId: string;
  input: any;
  previousResults: Map<string, any>;
  globalContext: Record<string, any>;
}

export interface StepExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
  duration: number;
  metadata?: Record<string, any>;
}

export class WorkflowStepExecutor {
  private queueManager: QueueManager;
  private stepHandlers: Map<
    WorkflowStepType,
    (
      context: StepExecutionContext,
      step: WorkflowStep
    ) => Promise<StepExecutionResult>
  > = new Map();

  constructor(queueManager: QueueManager) {
    this.queueManager = queueManager;
    this.registerBuiltInHandlers();
  }

  async executeStep(
    step: WorkflowStep,
    context: StepExecutionContext
  ): Promise<StepExecutionResult> {
    const startTime = Date.now();

    try {
      // Check if step dependencies are satisfied
      const dependenciesResult = this.checkDependencies(
        step,
        context.previousResults
      );
      if (!dependenciesResult.satisfied) {
        return {
          success: false,
          error: `Dependencies not satisfied: ${dependenciesResult.missing.join(", ")}`,
          duration: Date.now() - startTime,
        };
      }

      // Get the appropriate handler for this step type
      const handler = this.stepHandlers.get(step.type);
      if (!handler) {
        return {
          success: false,
          error: `No handler registered for step type: ${step.type}`,
          duration: Date.now() - startTime,
        };
      }

      // Execute the step
      const result = await handler(context, step);
      result.duration = Date.now() - startTime;

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      };
    }
  }

  registerStepHandler(
    stepType: WorkflowStepType,
    handler: (
      context: StepExecutionContext,
      step: WorkflowStep
    ) => Promise<StepExecutionResult>
  ): void {
    this.stepHandlers.set(stepType, handler);
  }

  private checkDependencies(
    step: WorkflowStep,
    previousResults: Map<string, any>
  ): { satisfied: boolean; missing: string[] } {
    const missing: string[] = [];

    for (const depId of step.dependencies) {
      if (!previousResults.has(depId)) {
        missing.push(depId);
      }
    }

    return {
      satisfied: missing.length === 0,
      missing,
    };
  }

  private registerBuiltInHandlers(): void {
    // Document analysis handler
    this.registerStepHandler("document-analysis", async (context, step) => {
      const jobData: JobData = {
        id: `${context.executionId}-${step.id}`,
        type: "document-analysis",
        payload: {
          ...step.config,
          input: context.input,
          context: context.globalContext,
        },
        createdAt: new Date(),
      };

      const jobId = await this.queueManager.addJob(
        QUEUE_NAMES.DOCUMENT_PROCESSING,
        jobData,
        "medium"
      );

      // Wait for job completion
      return this.waitForJobCompletion(jobId);
    });

    // Requirement extraction handler
    this.registerStepHandler(
      "requirement-extraction",
      async (context, step) => {
        const jobData: JobData = {
          id: `${context.executionId}-${step.id}`,
          type: "ai-analysis",
          payload: {
            operation: "requirement-extraction",
            ...step.config,
            input: context.input,
            context: context.globalContext,
          },
          createdAt: new Date(),
        };

        const jobId = await this.queueManager.addJob(
          QUEUE_NAMES.AI_ANALYSIS,
          jobData,
          "medium"
        );

        return this.waitForJobCompletion(jobId);
      }
    );

    // Estimation handler
    this.registerStepHandler("estimation", async (context, step) => {
      const jobData: JobData = {
        id: `${context.executionId}-${step.id}`,
        type: "ai-analysis",
        payload: {
          operation: "estimation",
          ...step.config,
          input: context.input,
          previousResults: Array.from(context.previousResults.entries()),
          context: context.globalContext,
        },
        createdAt: new Date(),
      };

      const jobId = await this.queueManager.addJob(
        QUEUE_NAMES.AI_ANALYSIS,
        jobData,
        "medium"
      );

      return this.waitForJobCompletion(jobId);
    });

    // Communication generation handler
    this.registerStepHandler(
      "communication-generation",
      async (context, step) => {
        const jobData: JobData = {
          id: `${context.executionId}-${step.id}`,
          type: "communication-generation",
          payload: {
            ...step.config,
            input: context.input,
            previousResults: Array.from(context.previousResults.entries()),
            context: context.globalContext,
          },
          createdAt: new Date(),
        };

        const jobId = await this.queueManager.addJob(
          QUEUE_NAMES.AI_ANALYSIS,
          jobData,
          "medium"
        );

        return this.waitForJobCompletion(jobId);
      }
    );

    // Codebase analysis handler
    this.registerStepHandler("codebase-analysis", async (context, step) => {
      const jobData: JobData = {
        id: `${context.executionId}-${step.id}`,
        type: "codebase-analysis",
        payload: {
          ...step.config,
          input: context.input,
          context: context.globalContext,
        },
        createdAt: new Date(),
      };

      const jobId = await this.queueManager.addJob(
        QUEUE_NAMES.AI_ANALYSIS,
        jobData,
        "medium"
      );

      return this.waitForJobCompletion(jobId);
    });

    // File operation handler
    this.registerStepHandler("file-operation", async (context, step) => {
      const jobData: JobData = {
        id: `${context.executionId}-${step.id}`,
        type: "file-operations",
        payload: {
          ...step.config,
          input: context.input,
          context: context.globalContext,
        },
        createdAt: new Date(),
      };

      const jobId = await this.queueManager.addJob(
        QUEUE_NAMES.FILE_OPERATIONS,
        jobData,
        "medium"
      );

      return this.waitForJobCompletion(jobId);
    });

    // Notification handler
    this.registerStepHandler("notification", async (context, step) => {
      const jobData: JobData = {
        id: `${context.executionId}-${step.id}`,
        type: "notification",
        payload: {
          ...step.config,
          input: context.input,
          previousResults: Array.from(context.previousResults.entries()),
          context: context.globalContext,
        },
        createdAt: new Date(),
      };

      const jobId = await this.queueManager.addJob(
        QUEUE_NAMES.NOTIFICATIONS,
        jobData,
        "medium"
      );

      return this.waitForJobCompletion(jobId);
    });
  }

  private async waitForJobCompletion(
    jobId: string
  ): Promise<StepExecutionResult> {
    const maxWaitTime = 300000; // 5 minutes
    const pollInterval = 1000; // 1 second
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const jobStatus = await this.queueManager.getJob(jobId);

      if (!jobStatus) {
        return {
          success: false,
          error: "Job not found",
          duration: Date.now() - startTime,
        };
      }

      if (jobStatus.status === "completed") {
        return {
          success: true,
          output: jobStatus.result?.data,
          duration: Date.now() - startTime,
          metadata: {
            jobId,
            attempts: jobStatus.attempts,
          },
        };
      }

      if (jobStatus.status === "failed") {
        return {
          success: false,
          error: jobStatus.failedReason || "Job failed",
          duration: Date.now() - startTime,
          metadata: {
            jobId,
            attempts: jobStatus.attempts,
          },
        };
      }

      // Wait before polling again
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    return {
      success: false,
      error: "Job execution timeout",
      duration: Date.now() - startTime,
    };
  }

  // Utility methods for creating step execution contexts
  createExecutionContext(
    workflowId: string,
    executionId: string,
    stepId: string,
    input: any,
    previousResults: Map<string, any> = new Map(),
    globalContext: Record<string, any> = {}
  ): StepExecutionContext {
    return {
      workflowId,
      executionId,
      stepId,
      input,
      previousResults,
      globalContext,
    };
  }

  // Method to execute steps in dependency order
  async executeStepsInOrder(
    steps: WorkflowStep[],
    baseContext: Omit<StepExecutionContext, "stepId">
  ): Promise<Map<string, StepExecutionResult>> {
    const results = new Map<string, StepExecutionResult>();
    const executed = new Set<string>();
    const executing = new Set<string>();

    const executeStep = async (step: WorkflowStep): Promise<void> => {
      if (executed.has(step.id) || executing.has(step.id)) {
        return;
      }

      executing.add(step.id);

      // Execute dependencies first
      for (const depId of step.dependencies) {
        const depStep = steps.find((s) => s.id === depId);
        if (depStep && !executed.has(depId)) {
          await executeStep(depStep);
        }
      }

      // Execute this step
      const context: StepExecutionContext = {
        ...baseContext,
        stepId: step.id,
        previousResults: new Map(
          Array.from(results.entries())
            .filter(([id]) => step.dependencies.includes(id))
            .map(([id, result]) => [id, result.output])
        ),
      };

      const result = await this.executeStep(step, context);
      results.set(step.id, result);
      executed.add(step.id);
      executing.delete(step.id);
    };

    // Execute all steps
    for (const step of steps) {
      if (!executed.has(step.id)) {
        await executeStep(step);
      }
    }

    return results;
  }

  // Method to validate step execution order
  validateStepOrder(steps: WorkflowStep[]): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const stepIds = new Set(steps.map((s) => s.id));

    // Check for circular dependencies
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (stepId: string): boolean => {
      if (recursionStack.has(stepId)) {
        return true;
      }

      if (visited.has(stepId)) {
        return false;
      }

      visited.add(stepId);
      recursionStack.add(stepId);

      const step = steps.find((s) => s.id === stepId);
      if (step) {
        for (const depId of step.dependencies) {
          if (hasCycle(depId)) {
            return true;
          }
        }
      }

      recursionStack.delete(stepId);
      return false;
    };

    // Check each step for cycles
    for (const step of steps) {
      if (hasCycle(step.id)) {
        errors.push(`Circular dependency detected involving step: ${step.id}`);
        break;
      }
    }

    // Check for invalid dependencies
    for (const step of steps) {
      for (const depId of step.dependencies) {
        if (!stepIds.has(depId)) {
          errors.push(`Step ${step.id} depends on non-existent step: ${depId}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
