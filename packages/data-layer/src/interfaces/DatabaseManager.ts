import {
  DatabaseConfig,
  Project,
  Document,
  WorkflowExecution,
  SystemConfig,
  BackupRecord,
} from "../types/database.js";

export interface DatabaseManager {
  // Initialization and configuration
  initialize(config: DatabaseConfig): Promise<void>;
  close(): Promise<void>;
  migrate(): Promise<void>;

  // Project operations
  createProject(
    project: Omit<Project, "created_at" | "updated_at">
  ): Promise<Project>;
  getProject(id: string): Promise<Project | null>;
  updateProject(
    id: string,
    updates: Partial<Omit<Project, "id" | "created_at">>
  ): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  listProjects(limit?: number, offset?: number): Promise<Project[]>;

  // Document operations
  createDocument(document: Omit<Document, "created_at">): Promise<Document>;
  getDocument(id: string): Promise<Document | null>;
  updateDocument(
    id: string,
    updates: Partial<Omit<Document, "id" | "created_at">>
  ): Promise<Document>;
  deleteDocument(id: string): Promise<void>;
  listDocuments(
    projectId?: string,
    status?: Document["status"],
    limit?: number,
    offset?: number
  ): Promise<Document[]>;

  // Workflow execution operations
  createWorkflowExecution(
    execution: Omit<WorkflowExecution, "started_at">
  ): Promise<WorkflowExecution>;
  getWorkflowExecution(id: string): Promise<WorkflowExecution | null>;
  updateWorkflowExecution(
    id: string,
    updates: Partial<Omit<WorkflowExecution, "id" | "started_at">>
  ): Promise<WorkflowExecution>;
  deleteWorkflowExecution(id: string): Promise<void>;
  listWorkflowExecutions(
    status?: WorkflowExecution["status"],
    limit?: number,
    offset?: number
  ): Promise<WorkflowExecution[]>;

  // System configuration operations
  setConfig(key: string, value: string): Promise<void>;
  getConfig(key: string): Promise<string | null>;
  deleteConfig(key: string): Promise<void>;
  listConfig(): Promise<SystemConfig[]>;

  // Backup operations
  createBackupRecord(
    backup: Omit<BackupRecord, "created_at">
  ): Promise<BackupRecord>;
  getBackupRecord(id: string): Promise<BackupRecord | null>;
  deleteBackupRecord(id: string): Promise<void>;
  listBackupRecords(
    projectId?: string,
    limit?: number,
    offset?: number
  ): Promise<BackupRecord[]>;

  // Utility operations
  vacuum(): Promise<void>;
  getStats(): Promise<{
    projectCount: number;
    documentCount: number;
    workflowExecutionCount: number;
    databaseSize: number;
  }>;
}
