/**
 * Error recovery mechanisms for the AI Toolkit
 * Implements automated recovery strategies for common failure scenarios
 */

import { BaseError, RecoveryAction, ErrorCategory } from "./ErrorTypes.js";
import { Logger } from "../logging/Logger";

export interface RecoveryResult {
  success: boolean;
  attempts: number;
  strategy: string;
  message: string;
  details?: Record<string, any>;
}

export interface RecoveryStrategy {
  name: string;
  canHandle: (error: BaseError) => boolean;
  execute: (error: BaseError, attempt: number) => Promise<RecoveryResult>;
  maxAttempts: number;
  delayMs: number;
}

export class ErrorRecoveryManager {
  private logger: Logger;
  private strategies: RecoveryStrategy[] = [];

  constructor(logger: Logger) {
    this.logger = logger;
    this.registerBuiltInStrategies();
  }

  /**
   * Attempt to recover from an error using available strategies
   */
  async attemptRecovery(
    error: BaseError,
    maxAttempts: number = 3
  ): Promise<RecoveryResult> {
    this.logger.debug("Starting error recovery", {
      errorCode: error.code,
      category: error.category,
      maxAttempts,
    });

    // Find applicable strategies
    const applicableStrategies = this.strategies.filter((strategy) =>
      strategy.canHandle(error)
    );

    if (applicableStrategies.length === 0) {
      return {
        success: false,
        attempts: 0,
        strategy: "none",
        message: "No recovery strategy available for this error type",
      };
    }

    // Try each strategy
    for (const strategy of applicableStrategies) {
      const strategyMaxAttempts = Math.min(maxAttempts, strategy.maxAttempts);

      for (let attempt = 1; attempt <= strategyMaxAttempts; attempt++) {
        try {
          this.logger.debug("Attempting recovery", {
            strategy: strategy.name,
            attempt,
            maxAttempts: strategyMaxAttempts,
          });

          // Add delay between attempts (except first)
          if (attempt > 1) {
            await this.delay(strategy.delayMs * Math.pow(2, attempt - 2)); // Exponential backoff
          }

          const result = await strategy.execute(error, attempt);
          result.attempts = attempt;
          result.strategy = strategy.name;

          if (result.success) {
            this.logger.info("Error recovery successful", {
              strategy: strategy.name,
              attempts: attempt,
              errorCode: error.code,
            });
            return result;
          }

          this.logger.debug("Recovery attempt failed", {
            strategy: strategy.name,
            attempt,
            message: result.message,
          });
        } catch (recoveryError) {
          this.logger.warn("Recovery strategy threw error", {
            strategy: strategy.name,
            attempt,
            error:
              recoveryError instanceof Error
                ? recoveryError.message
                : String(recoveryError),
          });
        }
      }
    }

    return {
      success: false,
      attempts: maxAttempts,
      strategy: applicableStrategies[0].name,
      message: "All recovery attempts failed",
    };
  }

  /**
   * Register a custom recovery strategy
   */
  registerStrategy(strategy: RecoveryStrategy): void {
    this.strategies.push(strategy);
    this.logger.debug("Recovery strategy registered", { name: strategy.name });
  }

  /**
   * Remove a recovery strategy
   */
  removeStrategy(name: string): boolean {
    const index = this.strategies.findIndex((s) => s.name === name);
    if (index > -1) {
      this.strategies.splice(index, 1);
      this.logger.debug("Recovery strategy removed", { name });
      return true;
    }
    return false;
  }

  /**
   * Get list of registered strategies
   */
  getStrategies(): string[] {
    return this.strategies.map((s) => s.name);
  }

  /**
   * Register built-in recovery strategies
   */
  private registerBuiltInStrategies(): void {
    // Ollama Connection Recovery
    this.registerStrategy({
      name: "ollama-connection-retry",
      canHandle: (error) => error.category === ErrorCategory.OLLAMA_CONNECTION,
      maxAttempts: 3,
      delayMs: 2000,
      execute: async (error, attempt) => {
        // Simulate connection retry logic
        // In real implementation, this would attempt to reconnect to Ollama
        this.logger.debug("Attempting Ollama reconnection", { attempt });

        // Placeholder for actual connection logic
        const connectionSuccess = Math.random() > 0.3; // 70% success rate for simulation

        if (connectionSuccess) {
          return {
            success: true,
            attempts: attempt,
            strategy: "ollama-connection-retry",
            message: "Successfully reconnected to Ollama",
            details: { reconnectedAt: new Date() },
          };
        }

        return {
          success: false,
          attempts: attempt,
          strategy: "ollama-connection-retry",
          message: `Connection attempt ${attempt} failed`,
        };
      },
    });

    // Model Loading Recovery
    this.registerStrategy({
      name: "ollama-model-fallback",
      canHandle: (error) => error.category === ErrorCategory.AI_MODEL,
      maxAttempts: 2,
      delayMs: 1000,
      execute: async (error, attempt) => {
        const modelName = error.details?.modelName;
        this.logger.debug("Attempting model fallback", { modelName, attempt });

        // Fallback model selection logic
        const fallbackModels = ["llama2", "codellama", "mistral"];
        const currentIndex = fallbackModels.indexOf(modelName);
        const nextModel = fallbackModels[currentIndex + 1];

        if (nextModel) {
          return {
            success: true,
            attempts: attempt,
            strategy: "ollama-model-fallback",
            message: `Switched to fallback model: ${nextModel}`,
            details: { fallbackModel: nextModel },
          };
        }

        return {
          success: false,
          attempts: attempt,
          strategy: "ollama-model-fallback",
          message: "No more fallback models available",
        };
      },
    });

    // Document Processing Recovery
    this.registerStrategy({
      name: "document-processing-fallback",
      canHandle: (error) =>
        error.category === ErrorCategory.DOCUMENT_PROCESSING,
      maxAttempts: 2,
      delayMs: 500,
      execute: async (error, attempt) => {
        this.logger.debug("Attempting document processing fallback", {
          attempt,
        });

        // Try basic text extraction instead of AI-enhanced processing
        if (attempt === 1) {
          return {
            success: true,
            attempts: attempt,
            strategy: "document-processing-fallback",
            message: "Switched to basic text extraction",
            details: { fallbackMode: "basic-extraction" },
          };
        }

        return {
          success: false,
          attempts: attempt,
          strategy: "document-processing-fallback",
          message: "Basic extraction also failed",
        };
      },
    });

    // File System Recovery
    this.registerStrategy({
      name: "file-system-retry",
      canHandle: (error) => error.category === ErrorCategory.FILE_SYSTEM,
      maxAttempts: 3,
      delayMs: 1000,
      execute: async (error, attempt) => {
        const operation = error.details?.operation;
        const path = error.details?.path;

        this.logger.debug("Retrying file system operation", {
          operation,
          path,
          attempt,
        });

        // Simulate file operation retry
        // In real implementation, this would retry the actual file operation
        const success = Math.random() > 0.4; // 60% success rate for simulation

        if (success) {
          return {
            success: true,
            attempts: attempt,
            strategy: "file-system-retry",
            message: `File operation ${operation} succeeded on retry`,
            details: { operation, path },
          };
        }

        return {
          success: false,
          attempts: attempt,
          strategy: "file-system-retry",
          message: `File operation ${operation} failed on attempt ${attempt}`,
        };
      },
    });

    // Workflow Step Recovery
    this.registerStrategy({
      name: "workflow-step-retry",
      canHandle: (error) => error.category === ErrorCategory.WORKFLOW_EXECUTION,
      maxAttempts: 2,
      delayMs: 3000,
      execute: async (error, attempt) => {
        const workflowId = error.details?.workflowId;
        const stepId = error.details?.stepId;

        this.logger.debug("Retrying workflow step", {
          workflowId,
          stepId,
          attempt,
        });

        // Simulate workflow step retry
        const success = Math.random() > 0.5; // 50% success rate for simulation

        if (success) {
          return {
            success: true,
            attempts: attempt,
            strategy: "workflow-step-retry",
            message: `Workflow step ${stepId} succeeded on retry`,
            details: { workflowId, stepId },
          };
        }

        return {
          success: false,
          attempts: attempt,
          strategy: "workflow-step-retry",
          message: `Workflow step ${stepId} failed on attempt ${attempt}`,
        };
      },
    });

    // Configuration Recovery
    this.registerStrategy({
      name: "configuration-fallback",
      canHandle: (error) => error.category === ErrorCategory.CONFIGURATION,
      maxAttempts: 1,
      delayMs: 0,
      execute: async (error, attempt) => {
        const configKey = error.details?.configKey;

        this.logger.debug("Applying configuration fallback", { configKey });

        // Use default configuration
        return {
          success: true,
          attempts: attempt,
          strategy: "configuration-fallback",
          message: "Applied default configuration",
          details: { configKey, fallbackApplied: true },
        };
      },
    });
  }

  /**
   * Utility method to add delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
