import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs-extra";
import * as path from "path";
import * as os from "os";
import { JSONDatabaseManager } from "../JSONDatabaseManager.js";
import {
  DatabaseConfig,
  Project,
  Document,
  WorkflowExecution,
} from "../types/database.js";

describe("JSONDatabaseManager", () => {
  let dbManager: JSONDatabaseManager;
  let testDir: string;
  let config: DatabaseConfig;

  beforeEach(async () => {
    // Create temporary directory for testing
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), "json-db-test-"));

    config = {
      databasePath: path.join(testDir, "test.db"),
      enableWAL: true,
      enableForeignKeys: true,
      busyTimeout: 5000,
      maxConnections: 10,
    };

    dbManager = new JSONDatabaseManager();
    await dbManager.initialize(config);
  });

  afterEach(async () => {
    await dbManager.close();
    await fs.remove(testDir);
  });

  describe("Initialization", () => {
    it("should initialize database with correct schema", async () => {
      // Database should be initialized and tables should exist
      const stats = await dbManager.getStats();
      expect(stats.projectCount).toBe(0);
      expect(stats.documentCount).toBe(0);
      expect(stats.workflowExecutionCount).toBe(0);
    });

    it("should create database file", async () => {
      const jsonPath = config.databasePath.replace(".db", ".json");
      expect(await fs.pathExists(jsonPath)).toBe(true);
    });
  });

  describe("Project Operations", () => {
    it("should create a project", async () => {
      const projectData = {
        id: "test-project-1",
        name: "Test Project",
        description: "A test project",
      };

      const project = await dbManager.createProject(projectData);

      expect(project.id).toBe(projectData.id);
      expect(project.name).toBe(projectData.name);
      expect(project.description).toBe(projectData.description);
      expect(project.created_at).toBeTruthy();
      expect(project.updated_at).toBeTruthy();
    });

    it("should retrieve a project", async () => {
      const projectData = {
        id: "test-project-2",
        name: "Test Project 2",
      };

      await dbManager.createProject(projectData);
      const retrieved = await dbManager.getProject(projectData.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(projectData.id);
      expect(retrieved!.name).toBe(projectData.name);
    });

    it("should return null for non-existent project", async () => {
      const project = await dbManager.getProject("non-existent");
      expect(project).toBeNull();
    });

    it("should update a project", async () => {
      const projectData = {
        id: "test-project-3",
        name: "Original Name",
      };

      await dbManager.createProject(projectData);

      const updated = await dbManager.updateProject(projectData.id, {
        name: "Updated Name",
        description: "Updated description",
      });

      expect(updated.name).toBe("Updated Name");
      expect(updated.description).toBe("Updated description");
    });

    it("should delete a project", async () => {
      const projectData = {
        id: "test-project-4",
        name: "To Delete",
      };

      await dbManager.createProject(projectData);
      await dbManager.deleteProject(projectData.id);

      const retrieved = await dbManager.getProject(projectData.id);
      expect(retrieved).toBeNull();
    });

    it("should list projects", async () => {
      await dbManager.createProject({ id: "proj-1", name: "Project 1" });
      await dbManager.createProject({ id: "proj-2", name: "Project 2" });

      const projects = await dbManager.listProjects();
      expect(projects).toHaveLength(2);
      expect(projects.map((p) => p.id)).toContain("proj-1");
      expect(projects.map((p) => p.id)).toContain("proj-2");
    });
  });

  describe("Document Operations", () => {
    let projectId: string;

    beforeEach(async () => {
      projectId = "doc-test-project";
      await dbManager.createProject({
        id: projectId,
        name: "Document Test Project",
      });
    });

    it("should create a document", async () => {
      const documentData = {
        id: "test-doc-1",
        project_id: projectId,
        original_path: "/test/document.pdf",
        type: "pdf",
        status: "pending" as const,
      };

      const document = await dbManager.createDocument(documentData);

      expect(document.id).toBe(documentData.id);
      expect(document.project_id).toBe(documentData.project_id);
      expect(document.original_path).toBe(documentData.original_path);
      expect(document.type).toBe(documentData.type);
      expect(document.status).toBe(documentData.status);
      expect(document.created_at).toBeTruthy();
    });

    it("should retrieve a document", async () => {
      const documentData = {
        id: "test-doc-2",
        project_id: projectId,
        original_path: "/test/document2.pdf",
        type: "pdf",
        status: "completed" as const,
        analysis_result: JSON.stringify({ summary: "Test summary" }),
      };

      await dbManager.createDocument(documentData);
      const retrieved = await dbManager.getDocument(documentData.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.analysis_result).toBe(documentData.analysis_result);
    });

    it("should update a document", async () => {
      const documentData = {
        id: "test-doc-3",
        project_id: projectId,
        original_path: "/test/document3.pdf",
        type: "pdf",
        status: "pending" as const,
      };

      await dbManager.createDocument(documentData);

      const updated = await dbManager.updateDocument(documentData.id, {
        status: "completed",
        analysis_result: JSON.stringify({ summary: "Analysis complete" }),
        processed_at: new Date().toISOString(),
      });

      expect(updated.status).toBe("completed");
      expect(updated.analysis_result).toBeTruthy();
      expect(updated.processed_at).toBeTruthy();
    });

    it("should list documents by project", async () => {
      await dbManager.createDocument({
        id: "doc-1",
        project_id: projectId,
        original_path: "/test/doc1.pdf",
        type: "pdf",
        status: "pending",
      });

      await dbManager.createDocument({
        id: "doc-2",
        project_id: projectId,
        original_path: "/test/doc2.pdf",
        type: "pdf",
        status: "completed",
      });

      const allDocs = await dbManager.listDocuments(projectId);
      expect(allDocs).toHaveLength(2);

      const pendingDocs = await dbManager.listDocuments(projectId, "pending");
      expect(pendingDocs).toHaveLength(1);
      expect(pendingDocs[0].status).toBe("pending");
    });

    it("should delete a document", async () => {
      const documentData = {
        id: "test-doc-delete",
        project_id: projectId,
        original_path: "/test/delete.pdf",
        type: "pdf",
        status: "pending" as const,
      };

      await dbManager.createDocument(documentData);
      await dbManager.deleteDocument(documentData.id);

      const retrieved = await dbManager.getDocument(documentData.id);
      expect(retrieved).toBeNull();
    });
  });

  describe("Workflow Execution Operations", () => {
    it("should create a workflow execution", async () => {
      const executionData = {
        id: "workflow-1",
        workflow_name: "test-workflow",
        status: "running" as const,
        input_data: JSON.stringify({ input: "test" }),
      };

      const execution = await dbManager.createWorkflowExecution(executionData);

      expect(execution.id).toBe(executionData.id);
      expect(execution.workflow_name).toBe(executionData.workflow_name);
      expect(execution.status).toBe(executionData.status);
      expect(execution.started_at).toBeTruthy();
    });

    it("should update workflow execution status", async () => {
      const executionData = {
        id: "workflow-2",
        workflow_name: "test-workflow-2",
        status: "running" as const,
      };

      await dbManager.createWorkflowExecution(executionData);

      const updated = await dbManager.updateWorkflowExecution(
        executionData.id,
        {
          status: "completed",
          result_data: JSON.stringify({ result: "success" }),
          completed_at: new Date().toISOString(),
        }
      );

      expect(updated.status).toBe("completed");
      expect(updated.result_data).toBeTruthy();
      expect(updated.completed_at).toBeTruthy();
    });

    it("should list workflow executions by status", async () => {
      await dbManager.createWorkflowExecution({
        id: "wf-1",
        workflow_name: "test-wf",
        status: "running",
      });

      await dbManager.createWorkflowExecution({
        id: "wf-2",
        workflow_name: "test-wf",
        status: "completed",
      });

      const runningExecutions =
        await dbManager.listWorkflowExecutions("running");
      expect(runningExecutions).toHaveLength(1);
      expect(runningExecutions[0].status).toBe("running");

      const allExecutions = await dbManager.listWorkflowExecutions();
      expect(allExecutions).toHaveLength(2);
    });
  });

  describe("System Configuration Operations", () => {
    it("should set and get configuration", async () => {
      await dbManager.setConfig("test-key", "test-value");
      const value = await dbManager.getConfig("test-key");

      expect(value).toBe("test-value");
    });

    it("should return null for non-existent config", async () => {
      const value = await dbManager.getConfig("non-existent");
      expect(value).toBeNull();
    });

    it("should update existing configuration", async () => {
      await dbManager.setConfig("update-key", "original-value");
      await dbManager.setConfig("update-key", "updated-value");

      const value = await dbManager.getConfig("update-key");
      expect(value).toBe("updated-value");
    });

    it("should delete configuration", async () => {
      await dbManager.setConfig("delete-key", "delete-value");
      await dbManager.deleteConfig("delete-key");

      const value = await dbManager.getConfig("delete-key");
      expect(value).toBeNull();
    });

    it("should list all configurations", async () => {
      await dbManager.setConfig("config-1", "value-1");
      await dbManager.setConfig("config-2", "value-2");

      const configs = await dbManager.listConfig();
      expect(configs.length).toBeGreaterThanOrEqual(2);

      const configKeys = configs.map((c) => c.key);
      expect(configKeys).toContain("config-1");
      expect(configKeys).toContain("config-2");
    });
  });

  describe("Backup Operations", () => {
    let projectId: string;

    beforeEach(async () => {
      projectId = "backup-test-project";
      await dbManager.createProject({
        id: projectId,
        name: "Backup Test Project",
      });
    });

    it("should create backup record", async () => {
      const backupData = {
        id: "backup-1",
        project_id: projectId,
        backup_path: "/backups/backup-1.tar.gz",
        size: 1024,
        checksum: "abc123",
      };

      const backup = await dbManager.createBackupRecord(backupData);

      expect(backup.id).toBe(backupData.id);
      expect(backup.project_id).toBe(backupData.project_id);
      expect(backup.backup_path).toBe(backupData.backup_path);
      expect(backup.size).toBe(backupData.size);
      expect(backup.checksum).toBe(backupData.checksum);
      expect(backup.created_at).toBeTruthy();
    });

    it("should list backup records by project", async () => {
      await dbManager.createBackupRecord({
        id: "backup-2",
        project_id: projectId,
        backup_path: "/backups/backup-2.tar.gz",
        size: 2048,
        checksum: "def456",
      });

      const backups = await dbManager.listBackupRecords(projectId);
      expect(backups).toHaveLength(1);
      expect(backups[0].project_id).toBe(projectId);
    });
  });

  describe("Utility Operations", () => {
    it("should get database statistics", async () => {
      // Create some test data
      await dbManager.createProject({
        id: "stats-project",
        name: "Stats Project",
      });
      await dbManager.createDocument({
        id: "stats-doc",
        project_id: "stats-project",
        original_path: "/test/stats.pdf",
        type: "pdf",
        status: "pending",
      });
      await dbManager.createWorkflowExecution({
        id: "stats-workflow",
        workflow_name: "stats-test",
        status: "running",
      });

      const stats = await dbManager.getStats();

      expect(stats.projectCount).toBe(1);
      expect(stats.documentCount).toBe(1);
      expect(stats.workflowExecutionCount).toBe(1);
      expect(stats.databaseSize).toBeGreaterThan(0);
    });

    it("should vacuum database", async () => {
      // This should not throw an error
      await expect(dbManager.vacuum()).resolves.not.toThrow();
    });
  });

  describe("Error Handling", () => {
    it("should throw error when updating non-existent project", async () => {
      await expect(
        dbManager.updateProject("non-existent", { name: "Updated" })
      ).rejects.toThrow("Project non-existent not found");
    });

    it("should throw error when deleting non-existent project", async () => {
      await expect(dbManager.deleteProject("non-existent")).rejects.toThrow(
        "Project non-existent not found"
      );
    });

    it("should throw error when updating non-existent document", async () => {
      await expect(
        dbManager.updateDocument("non-existent", { status: "completed" })
      ).rejects.toThrow("Document non-existent not found");
    });
  });
});
