import fs from "fs-extra";
import * as path from "path";
import { DatabaseManager } from "./interfaces/DatabaseManager.js";
import {
  DatabaseConfig,
  Project,
  Document,
  WorkflowExecution,
  SystemConfig,
  BackupRecord,
} from "./types/database.js";

interface DatabaseData {
  projects: Record<string, Project>;
  documents: Record<string, Document>;
  workflowExecutions: Record<string, WorkflowExecution>;
  systemConfig: Record<string, SystemConfig>;
  backupRecords: Record<string, BackupRecord>;
}

export class JSONDatabaseManager implements DatabaseManager {
  private config?: DatabaseConfig;
  private data: DatabaseData = {
    projects: {},
    documents: {},
    workflowExecutions: {},
    systemConfig: {},
    backupRecords: {},
  };
  private dataFilePath?: string;

  async initialize(config: DatabaseConfig): Promise<void> {
    this.config = config;
    this.dataFilePath = config.databasePath.replace(".db", ".json");

    // Ensure database directory exists
    const dbDir = path.dirname(this.dataFilePath);
    await fs.ensureDir(dbDir);

    // Load existing data if file exists
    if (await fs.pathExists(this.dataFilePath)) {
      try {
        const fileContent = await fs.readFile(this.dataFilePath, "utf-8");
        this.data = JSON.parse(fileContent);
      } catch (error) {
        console.warn(
          "Could not load existing database file, starting fresh:",
          error
        );
      }
    }

    // Run initial migration (ensure all collections exist)
    await this.migrate();
  }

  async close(): Promise<void> {
    await this.saveData();
  }

  async migrate(): Promise<void> {
    // Ensure all collections exist
    if (!this.data.projects) this.data.projects = {};
    if (!this.data.documents) this.data.documents = {};
    if (!this.data.workflowExecutions) this.data.workflowExecutions = {};
    if (!this.data.systemConfig) this.data.systemConfig = {};
    if (!this.data.backupRecords) this.data.backupRecords = {};

    await this.saveData();
  }

  private async saveData(): Promise<void> {
    if (this.dataFilePath) {
      await fs.writeFile(this.dataFilePath, JSON.stringify(this.data, null, 2));
    }
  }

  private getCurrentTimestamp(): string {
    return new Date().toISOString();
  }

  // Project operations
  async createProject(
    project: Omit<Project, "created_at" | "updated_at">
  ): Promise<Project> {
    const now = this.getCurrentTimestamp();
    const newProject: Project = {
      ...project,
      created_at: now,
      updated_at: now,
    };

    this.data.projects[project.id] = newProject;
    await this.saveData();
    return newProject;
  }

  async getProject(id: string): Promise<Project | null> {
    return this.data.projects[id] || null;
  }

  async updateProject(
    id: string,
    updates: Partial<Omit<Project, "id" | "created_at">>
  ): Promise<Project> {
    const existing = this.data.projects[id];
    if (!existing) {
      throw new Error(`Project ${id} not found`);
    }

    const updated: Project = {
      ...existing,
      ...updates,
      id,
      created_at: existing.created_at,
      updated_at: this.getCurrentTimestamp(),
    };

    this.data.projects[id] = updated;
    await this.saveData();
    return updated;
  }

  async deleteProject(id: string): Promise<void> {
    if (!this.data.projects[id]) {
      throw new Error(`Project ${id} not found`);
    }

    delete this.data.projects[id];

    // Delete associated documents
    Object.keys(this.data.documents).forEach((docId) => {
      if (this.data.documents[docId].project_id === id) {
        delete this.data.documents[docId];
      }
    });

    // Delete associated backup records
    Object.keys(this.data.backupRecords).forEach((backupId) => {
      if (this.data.backupRecords[backupId].project_id === id) {
        delete this.data.backupRecords[backupId];
      }
    });

    await this.saveData();
  }

  async listProjects(limit = 100, offset = 0): Promise<Project[]> {
    const projects = Object.values(this.data.projects)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(offset, offset + limit);

    return projects;
  }

  // Document operations
  async createDocument(
    document: Omit<Document, "created_at">
  ): Promise<Document> {
    const newDocument: Document = {
      ...document,
      created_at: this.getCurrentTimestamp(),
    };

    this.data.documents[document.id] = newDocument;
    await this.saveData();
    return newDocument;
  }

  async getDocument(id: string): Promise<Document | null> {
    return this.data.documents[id] || null;
  }

  async updateDocument(
    id: string,
    updates: Partial<Omit<Document, "id" | "created_at">>
  ): Promise<Document> {
    const existing = this.data.documents[id];
    if (!existing) {
      throw new Error(`Document ${id} not found`);
    }

    const updated: Document = {
      ...existing,
      ...updates,
      id,
      created_at: existing.created_at,
    };

    this.data.documents[id] = updated;
    await this.saveData();
    return updated;
  }

  async deleteDocument(id: string): Promise<void> {
    if (!this.data.documents[id]) {
      throw new Error(`Document ${id} not found`);
    }

    delete this.data.documents[id];
    await this.saveData();
  }

  async listDocuments(
    projectId?: string,
    status?: Document["status"],
    limit = 100,
    offset = 0
  ): Promise<Document[]> {
    let documents = Object.values(this.data.documents);

    if (projectId) {
      documents = documents.filter((doc) => doc.project_id === projectId);
    }

    if (status) {
      documents = documents.filter((doc) => doc.status === status);
    }

    return documents
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(offset, offset + limit);
  }

  // Workflow execution operations
  async createWorkflowExecution(
    execution: Omit<WorkflowExecution, "started_at">
  ): Promise<WorkflowExecution> {
    const newExecution: WorkflowExecution = {
      ...execution,
      started_at: this.getCurrentTimestamp(),
    };

    this.data.workflowExecutions[execution.id] = newExecution;
    await this.saveData();
    return newExecution;
  }

  async getWorkflowExecution(id: string): Promise<WorkflowExecution | null> {
    return this.data.workflowExecutions[id] || null;
  }

  async updateWorkflowExecution(
    id: string,
    updates: Partial<Omit<WorkflowExecution, "id" | "started_at">>
  ): Promise<WorkflowExecution> {
    const existing = this.data.workflowExecutions[id];
    if (!existing) {
      throw new Error(`Workflow execution ${id} not found`);
    }

    const updated: WorkflowExecution = {
      ...existing,
      ...updates,
      id,
      started_at: existing.started_at,
    };

    this.data.workflowExecutions[id] = updated;
    await this.saveData();
    return updated;
  }

  async deleteWorkflowExecution(id: string): Promise<void> {
    if (!this.data.workflowExecutions[id]) {
      throw new Error(`Workflow execution ${id} not found`);
    }

    delete this.data.workflowExecutions[id];
    await this.saveData();
  }

  async listWorkflowExecutions(
    status?: WorkflowExecution["status"],
    limit = 100,
    offset = 0
  ): Promise<WorkflowExecution[]> {
    let executions = Object.values(this.data.workflowExecutions);

    if (status) {
      executions = executions.filter((exec) => exec.status === status);
    }

    return executions
      .sort(
        (a, b) =>
          new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
      )
      .slice(offset, offset + limit);
  }

  // System configuration operations
  async setConfig(key: string, value: string): Promise<void> {
    this.data.systemConfig[key] = {
      key,
      value,
      updated_at: this.getCurrentTimestamp(),
    };
    await this.saveData();
  }

  async getConfig(key: string): Promise<string | null> {
    const config = this.data.systemConfig[key];
    return config ? config.value : null;
  }

  async deleteConfig(key: string): Promise<void> {
    delete this.data.systemConfig[key];
    await this.saveData();
  }

  async listConfig(): Promise<SystemConfig[]> {
    return Object.values(this.data.systemConfig).sort((a, b) =>
      a.key.localeCompare(b.key)
    );
  }

  // Backup operations
  async createBackupRecord(
    backup: Omit<BackupRecord, "created_at">
  ): Promise<BackupRecord> {
    const newBackup: BackupRecord = {
      ...backup,
      created_at: this.getCurrentTimestamp(),
    };

    this.data.backupRecords[backup.id] = newBackup;
    await this.saveData();
    return newBackup;
  }

  async getBackupRecord(id: string): Promise<BackupRecord | null> {
    return this.data.backupRecords[id] || null;
  }

  async deleteBackupRecord(id: string): Promise<void> {
    if (!this.data.backupRecords[id]) {
      throw new Error(`Backup record ${id} not found`);
    }

    delete this.data.backupRecords[id];
    await this.saveData();
  }

  async listBackupRecords(
    projectId?: string,
    limit = 100,
    offset = 0
  ): Promise<BackupRecord[]> {
    let backups = Object.values(this.data.backupRecords);

    if (projectId) {
      backups = backups.filter((backup) => backup.project_id === projectId);
    }

    return backups
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(offset, offset + limit);
  }

  // Utility operations
  async vacuum(): Promise<void> {
    // For JSON database, this is essentially a no-op
    // In a real implementation, this might compact the file
    await this.saveData();
  }

  async getStats(): Promise<{
    projectCount: number;
    documentCount: number;
    workflowExecutionCount: number;
    databaseSize: number;
  }> {
    let databaseSize = 0;

    if (this.dataFilePath && (await fs.pathExists(this.dataFilePath))) {
      try {
        const stats = await fs.stat(this.dataFilePath);
        databaseSize = stats.size;
      } catch (error) {
        // File might not exist yet
      }
    }

    return {
      projectCount: Object.keys(this.data.projects).length,
      documentCount: Object.keys(this.data.documents).length,
      workflowExecutionCount: Object.keys(this.data.workflowExecutions).length,
      databaseSize,
    };
  }
}
