import {
  CoreWorkflowDefinition as WorkflowDefinition,
  Workflow,
  WorkflowInput,
  WorkflowResult,
  WorkflowExecution,
  WorkflowStatus,
  CronSchedule,
  ProcessingOptions,
} from "@ai-toolkit/shared";

export interface WorkflowEngine {
  // Workflow management
  createWorkflow(definition: WorkflowDefinition): Promise<Workflow>;

  getWorkflow(workflowId: string): Promise<Workflow | null>;

  updateWorkflow(
    workflowId: string,
    updates: Partial<WorkflowDefinition>
  ): Promise<Workflow>;

  deleteWorkflow(workflowId: string): Promise<boolean>;

  listWorkflows(filters?: {
    enabled?: boolean;
    type?: string;
    tags?: string[];
  }): Promise<WorkflowDefinition[]>;

  // Workflow execution
  executeWorkflow(
    workflowId: string,
    input: WorkflowInput,
    options?: ProcessingOptions
  ): Promise<WorkflowResult>;

  executeWorkflowSync(
    workflowId: string,
    input: WorkflowInput,
    options?: ProcessingOptions
  ): Promise<WorkflowResult>;

  executeWorkflowAsync(
    workflowId: string,
    input: WorkflowInput,
    options?: ProcessingOptions
  ): Promise<string>; // Returns execution ID

  // Execution monitoring
  getWorkflowStatus(executionId: string): Promise<WorkflowStatus>;

  getWorkflowExecution(executionId: string): Promise<WorkflowExecution | null>;

  listActiveWorkflows(): Promise<WorkflowExecution[]>;

  getExecutionHistory(
    workflowId?: string,
    limit?: number
  ): Promise<WorkflowExecution[]>;

  // Execution control
  pauseWorkflow(executionId: string): Promise<boolean>;

  resumeWorkflow(executionId: string): Promise<boolean>;

  cancelWorkflow(executionId: string): Promise<boolean>;

  retryWorkflow(executionId: string): Promise<string>; // Returns new execution ID

  // Scheduling
  scheduleWorkflow(
    workflowId: string,
    schedule: CronSchedule
  ): Promise<boolean>;

  unscheduleWorkflow(workflowId: string): Promise<boolean>;

  listScheduledWorkflows(): Promise<
    Array<{
      workflowId: string;
      schedule: CronSchedule;
      nextRun: Date;
      enabled: boolean;
    }>
  >;

  // File watching and triggers
  addFileWatcher(
    workflowId: string,
    watchPath: string,
    options?: {
      recursive?: boolean;
      filePattern?: string;
      ignorePattern?: string;
    }
  ): Promise<string>; // Returns watcher ID

  removeFileWatcher(watcherId: string): Promise<boolean>;

  listFileWatchers(): Promise<
    Array<{
      id: string;
      workflowId: string;
      path: string;
      active: boolean;
    }>
  >;

  // Workflow validation
  validateWorkflow(definition: WorkflowDefinition): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }>;

  testWorkflow(
    definition: WorkflowDefinition,
    testInput: WorkflowInput
  ): Promise<{
    success: boolean;
    result?: WorkflowResult;
    errors?: string[];
  }>;

  // Performance and monitoring
  getWorkflowMetrics(workflowId: string): Promise<{
    totalExecutions: number;
    successRate: number;
    averageDuration: number;
    lastExecution?: Date;
    errorRate: number;
  }>;

  getSystemMetrics(): Promise<{
    activeWorkflows: number;
    queuedJobs: number;
    completedToday: number;
    failedToday: number;
    systemLoad: number;
  }>;

  // Configuration
  updateEngineConfig(config: {
    maxConcurrentWorkflows?: number;
    defaultTimeout?: number;
    retryPolicy?: {
      maxRetries: number;
      backoffStrategy: "linear" | "exponential";
    };
  }): Promise<void>;

  getEngineConfig(): Promise<{
    maxConcurrentWorkflows: number;
    defaultTimeout: number;
    retryPolicy: {
      maxRetries: number;
      backoffStrategy: "linear" | "exponential";
    };
  }>;

  // Cleanup and maintenance
  cleanupCompletedExecutions(olderThan: Date): Promise<number>;

  archiveWorkflowData(workflowId: string, olderThan: Date): Promise<boolean>;

  // Event handling
  onWorkflowStart(callback: (execution: WorkflowExecution) => void): void;
  onWorkflowComplete(callback: (execution: WorkflowExecution) => void): void;
  onWorkflowError(
    callback: (execution: WorkflowExecution, error: Error) => void
  ): void;
  onWorkflowProgress(callback: (execution: WorkflowExecution) => void): void;
}
