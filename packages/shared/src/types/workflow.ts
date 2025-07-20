import { BaseEntity, WorkflowStatus, Priority } from './common.js';

export interface WorkflowDefinition extends BaseEntity {
  name: string;
  description: string;
  steps: WorkflowStep[];
  triggers: WorkflowTrigger[];
  schedule?: CronSchedule;
  enabled: boolean;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: WorkflowStepType;
  config: Record<string, any>;
  dependencies: string[];
  retryPolicy?: RetryPolicy;
}

export type WorkflowStepType = 
  | 'document-analysis'
  | 'requirement-extraction'
  | 'estimation'
  | 'communication-generation'
  | 'codebase-analysis'
  | 'file-operation'
  | 'notification';

export interface WorkflowTrigger {
  type: TriggerType;
  config: Record<string, any>;
}

export type TriggerType = 'file-watch' | 'schedule' | 'manual' | 'api';

export interface CronSchedule {
  expression: string;
  timezone?: string;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: 'linear' | 'exponential';
  initialDelay: number;
  maxDelay: number;
}

export interface WorkflowInput {
  files?: string[];
  parameters?: Record<string, any>;
  context?: Record<string, any>;
}

export interface WorkflowResult {
  executionId: string;
  status: WorkflowStatus;
  outputs: Record<string, any>;
  errors?: string[];
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
}

export interface WorkflowExecution extends BaseEntity {
  workflowId: string;
  status: WorkflowStatus;
  input: WorkflowInput;
  result?: WorkflowResult;
  currentStep?: string;
  progress: number;
  logs: WorkflowLog[];
}

export interface WorkflowLog {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  stepId?: string;
  data?: any;
}

export interface Workflow {
  definition: WorkflowDefinition;
  execute(input: WorkflowInput): Promise<WorkflowResult>;
  getStatus(executionId: string): Promise<WorkflowStatus>;
  cancel(executionId: string): Promise<void>;
}