/**
 * Example integration of error handling and logging systems
 * This demonstrates how to use the centralized error handling in various components
 */

import {
  initializeGlobalErrorHandler,
  handleError,
  handleGenericError,
  OllamaConnectionError,
  OllamaModelError,
  DocumentProcessingError,
  WorkflowExecutionError,
  FileSystemError,
  ValidationError,
  ConfigurationError,
  ErrorCategory,
  ErrorSeverity,
} from "../errors/index.js";

import {
  initializeLogger,
  getLogger,
  createFileLogger,
  LogLevel,
} from "../logging/index.js";

import {
  FileTransport,
  ConsoleTransport,
  LogTransport,
} from "../logging/LogTransport.js";

/**
 * Initialize the error handling and logging system
 */
export function initializeErrorHandlingSystem(logFilePath?: string): void {
  // Initialize logger with file and console transports
  const transports: LogTransport[] = [new ConsoleTransport(LogLevel.INFO)];

  if (logFilePath) {
    transports.push(new FileTransport(logFilePath, LogLevel.DEBUG));
  }

  const logger = initializeLogger({
    name: "ai-toolkit",
    level: LogLevel.INFO,
    transports,
    enableStackTrace: true,
    enablePerformanceTracking: true,
  });

  // Initialize global error handler
  initializeGlobalErrorHandler(logger, {
    enableRecovery: true,
    maxRecoveryAttempts: 3,
    logLevel: "info",
    enableTelemetry: true,
    enableUserNotifications: true,
  });

  logger.info("Error handling and logging system initialized");
}

/**
 * Example: Ollama service integration with error handling
 */
export class OllamaServiceExample {
  private logger = getLogger().child({ component: "OllamaService" });

  async connect(
    host: string = "localhost",
    port: number = 11434
  ): Promise<boolean> {
    const context = {
      component: "OllamaService",
      operation: "connect",
      timestamp: new Date(),
      metadata: { host, port },
    };

    try {
      this.logger.info("Attempting to connect to Ollama", { host, port });

      // Simulate connection attempt
      const connected = await this.attemptConnection(host, port);

      if (!connected) {
        const error = new OllamaConnectionError(
          `Failed to connect to Ollama at ${host}:${port}`,
          context,
          { host, port, timeout: 5000 }
        );

        const report = await handleError(error);

        if (report.recovered) {
          this.logger.info("Connection recovered successfully", {
            attempts: report.recoveryAttempts,
            strategy: report.error.recoveryActions[0]?.type,
          });
          return true;
        }

        return false;
      }

      this.logger.info("Successfully connected to Ollama");
      return true;
    } catch (error) {
      await handleGenericError(
        error as Error,
        context,
        ErrorCategory.OLLAMA_CONNECTION,
        ErrorSeverity.HIGH
      );
      return false;
    }
  }

  async loadModel(modelName: string): Promise<boolean> {
    const context = {
      component: "OllamaService",
      operation: "loadModel",
      timestamp: new Date(),
      metadata: { modelName },
    };

    try {
      this.logger.info("Loading model", { modelName });

      const loaded = await this.attemptModelLoad(modelName);

      if (!loaded) {
        const error = new OllamaModelError(
          `Failed to load model: ${modelName}`,
          context,
          modelName,
          { available: false, reason: "not_found" }
        );

        const report = await handleError(error);

        if (report.recovered) {
          this.logger.info("Model loading recovered", {
            fallbackModel: report.error.details?.fallbackModel,
          });
          return true;
        }

        return false;
      }

      this.logger.info("Model loaded successfully", { modelName });
      return true;
    } catch (error) {
      await handleGenericError(
        error as Error,
        context,
        ErrorCategory.AI_MODEL,
        ErrorSeverity.MEDIUM
      );
      return false;
    }
  }

  private async attemptConnection(
    host: string,
    port: number
  ): Promise<boolean> {
    // Simulate connection logic
    return Math.random() > 0.3; // 70% success rate
  }

  private async attemptModelLoad(modelName: string): Promise<boolean> {
    // Simulate model loading
    return Math.random() > 0.4; // 60% success rate
  }
}

/**
 * Example: Document processor with error handling
 */
export class DocumentProcessorExample {
  private logger = getLogger().child({ component: "DocumentProcessor" });

  async processDocument(filePath: string): Promise<any> {
    const context = {
      component: "DocumentProcessor",
      operation: "processDocument",
      timestamp: new Date(),
      metadata: { filePath },
    };

    return this.logger.withTiming("document-processing", async () => {
      try {
        this.logger.info("Starting document processing", { filePath });

        // Validate file
        await this.validateFile(filePath);

        // Extract content
        const content = await this.extractContent(filePath);

        // Analyze with AI
        const analysis = await this.analyzeContent(content);

        this.logger.info("Document processing completed", {
          filePath,
          contentLength: content.length,
          analysisKeys: Object.keys(analysis),
        });

        return { content, analysis };
      } catch (error) {
        if (error instanceof ValidationError) {
          await handleError(error);
          throw error; // Re-throw validation errors
        }

        const processingError = new DocumentProcessingError(
          `Failed to process document: ${filePath}`,
          context,
          filePath,
          {
            fileSize: await this.getFileSize(filePath),
            mimeType: await this.getMimeType(filePath),
          },
          error as Error
        );

        const report = await handleError(processingError);

        if (report.recovered) {
          this.logger.info("Document processing recovered with fallback");
          // Return basic extraction result
          return {
            content: await this.basicExtraction(filePath),
            analysis: {},
          };
        }

        throw error;
      }
    });
  }

  private async validateFile(filePath: string): Promise<void> {
    const context = {
      component: "DocumentProcessor",
      operation: "validateFile",
      timestamp: new Date(),
      metadata: { filePath },
    };

    // Simulate validation
    if (Math.random() < 0.1) {
      // 10% validation failure rate
      throw new ValidationError(
        "Invalid file format",
        context,
        "fileFormat",
        filePath,
        { supportedFormats: ["pdf", "docx", "txt"] }
      );
    }
  }

  private async extractContent(filePath: string): Promise<string> {
    // Simulate content extraction
    if (Math.random() < 0.15) {
      // 15% extraction failure rate
      throw new Error("Content extraction failed");
    }
    return "Extracted content...";
  }

  private async analyzeContent(content: string): Promise<any> {
    // Simulate AI analysis
    if (Math.random() < 0.2) {
      // 20% analysis failure rate
      throw new Error("AI analysis failed");
    }
    return { summary: "Analysis result...", keyPoints: [] };
  }

  private async basicExtraction(filePath: string): Promise<string> {
    // Fallback basic extraction
    return "Basic extracted content...";
  }

  private async getFileSize(filePath: string): Promise<number> {
    return 1024; // Mock file size
  }

  private async getMimeType(filePath: string): Promise<string> {
    return "application/pdf"; // Mock MIME type
  }
}

/**
 * Example: Workflow engine with error handling
 */
export class WorkflowEngineExample {
  private logger = getLogger().child({ component: "WorkflowEngine" });

  async executeWorkflow(workflowId: string, steps: any[]): Promise<any> {
    const context = {
      component: "WorkflowEngine",
      operation: "executeWorkflow",
      timestamp: new Date(),
      metadata: { workflowId, stepCount: steps.length },
    };

    try {
      this.logger.info("Starting workflow execution", {
        workflowId,
        stepCount: steps.length,
      });

      const results = [];

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const stepContext = {
          ...context,
          operation: "executeStep",
          metadata: { ...context.metadata, stepId: step.id, stepIndex: i },
        };

        try {
          const result = await this.executeStep(step, stepContext);
          results.push(result);
        } catch (error) {
          const workflowError = new WorkflowExecutionError(
            `Workflow step failed: ${step.id}`,
            stepContext,
            workflowId,
            step.id,
            { stepType: step.type, stepIndex: i },
            error as Error
          );

          const report = await handleError(workflowError);

          if (report.recovered) {
            this.logger.info("Workflow step recovered", { stepId: step.id });
            results.push({ stepId: step.id, status: "recovered" });
            continue;
          }

          // If recovery failed, decide whether to continue or abort
          if (step.optional) {
            this.logger.warn("Optional step failed, continuing", {
              stepId: step.id,
            });
            results.push({ stepId: step.id, status: "skipped" });
            continue;
          }

          throw workflowError;
        }
      }

      this.logger.info("Workflow execution completed", {
        workflowId,
        results: results.length,
      });
      return { workflowId, results };
    } catch (error) {
      await handleGenericError(
        error as Error,
        context,
        ErrorCategory.WORKFLOW_EXECUTION,
        ErrorSeverity.HIGH
      );
      throw error;
    }
  }

  private async executeStep(step: any, context: any): Promise<any> {
    this.logger.debug("Executing workflow step", {
      stepId: step.id,
      stepType: step.type,
    });

    // Simulate step execution
    if (Math.random() < 0.25) {
      // 25% step failure rate
      throw new Error(`Step execution failed: ${step.id}`);
    }

    return { stepId: step.id, status: "completed", result: "Step result..." };
  }
}

/**
 * Example: File system operations with error handling
 */
export class FileSystemExample {
  private logger = getLogger().child({ component: "FileSystem" });

  async writeFile(filePath: string, content: string): Promise<void> {
    const context = {
      component: "FileSystem",
      operation: "writeFile",
      timestamp: new Date(),
      metadata: { filePath, contentLength: content.length },
    };

    try {
      this.logger.debug("Writing file", { filePath, size: content.length });

      // Simulate file write
      if (Math.random() < 0.1) {
        // 10% write failure rate
        throw new Error("Permission denied");
      }

      this.logger.debug("File written successfully", { filePath });
    } catch (error) {
      const fileError = new FileSystemError(
        `Failed to write file: ${filePath}`,
        context,
        "write",
        filePath,
        { contentLength: content.length, permissions: "rw-" },
        error as Error
      );

      const report = await handleError(fileError);

      if (report.recovered) {
        this.logger.info("File write operation recovered", { filePath });
        return;
      }

      throw fileError;
    }
  }
}

/**
 * Example: Configuration manager with error handling
 */
export class ConfigurationExample {
  private logger = getLogger().child({ component: "Configuration" });
  private config: Record<string, any> = {};

  async loadConfiguration(configPath: string): Promise<void> {
    const context = {
      component: "Configuration",
      operation: "loadConfiguration",
      timestamp: new Date(),
      metadata: { configPath },
    };

    try {
      this.logger.info("Loading configuration", { configPath });

      // Simulate config loading
      if (Math.random() < 0.2) {
        // 20% config load failure rate
        throw new Error("Configuration file not found");
      }

      this.config = { ollama: { host: "localhost", port: 11434 } };
      this.logger.info("Configuration loaded successfully");
    } catch (error) {
      const configError = new ConfigurationError(
        `Failed to load configuration: ${configPath}`,
        context,
        "configFile",
        { configPath },
        error as Error
      );

      const report = await handleError(configError);

      if (report.recovered) {
        this.logger.info("Using default configuration");
        this.config = this.getDefaultConfiguration();
        return;
      }

      throw configError;
    }
  }

  private getDefaultConfiguration(): Record<string, any> {
    return {
      ollama: {
        host: "localhost",
        port: 11434,
      },
      logging: {
        level: "info",
      },
    };
  }
}

/**
 * Example usage of the error handling system
 */
export async function demonstrateErrorHandling(): Promise<void> {
  // Initialize the system
  initializeErrorHandlingSystem("./logs/ai-toolkit.log");

  const logger = getLogger();

  // Create service instances
  const ollamaService = new OllamaServiceExample();
  const documentProcessor = new DocumentProcessorExample();
  const workflowEngine = new WorkflowEngineExample();
  const fileSystem = new FileSystemExample();
  const config = new ConfigurationExample();

  try {
    // Load configuration
    await config.loadConfiguration("./config.json");

    // Connect to Ollama
    const connected = await ollamaService.connect();
    if (!connected) {
      logger.error("Failed to connect to Ollama");
      return;
    }

    // Load model
    const modelLoaded = await ollamaService.loadModel("llama2");
    if (!modelLoaded) {
      logger.error("Failed to load model");
      return;
    }

    // Process document
    const result = await documentProcessor.processDocument(
      "./test-document.pdf"
    );
    logger.info("Document processed", { result });

    // Execute workflow
    const workflowResult = await workflowEngine.executeWorkflow(
      "test-workflow",
      [
        { id: "step1", type: "analysis", optional: false },
        { id: "step2", type: "extraction", optional: true },
        { id: "step3", type: "summary", optional: false },
      ]
    );

    // Save results
    await fileSystem.writeFile(
      "./results.json",
      JSON.stringify(workflowResult)
    );

    logger.info("All operations completed successfully");
  } catch (error) {
    logger.error("Demonstration failed", { error: (error as Error).message });
  }
}
