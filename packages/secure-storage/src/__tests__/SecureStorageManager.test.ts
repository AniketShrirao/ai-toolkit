import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "fs-extra";
import * as path from "path";
import * as os from "os";
import { SecureStorageManagerImpl } from "../SecureStorageManagerImpl.js";
import { StorageConfig } from "../types/storage.js";

describe("SecureStorageManager", () => {
  let storageManager: SecureStorageManagerImpl;
  let testDir: string;
  let config: StorageConfig;

  beforeEach(async () => {
    // Create temporary directory for testing
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), "secure-storage-test-"));

    config = {
      baseDirectory: testDir,
      encryptionEnabled: true,
      encryptionKey: "test-encryption-key-32-characters",
      filePermissions: {
        directories: "0755",
        files: "0644",
      },
      tempCleanupInterval: 60000,
      maxTempFileAge: 3600000,
    };

    storageManager = new SecureStorageManagerImpl();
    await storageManager.initialize(config);
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.remove(testDir);
  });

  describe("Initialization", () => {
    it("should initialize with correct configuration", () => {
      const retrievedConfig = storageManager.getConfig();
      expect(retrievedConfig.baseDirectory).toBe(testDir);
      expect(retrievedConfig.encryptionEnabled).toBe(true);
    });

    it("should create required directory structure", async () => {
      const projectsDir = path.join(testDir, "projects");
      const tempDir = path.join(testDir, "temp");
      const backupDir = path.join(testDir, "backups");

      expect(await fs.pathExists(projectsDir)).toBe(true);
      expect(await fs.pathExists(tempDir)).toBe(true);
      expect(await fs.pathExists(backupDir)).toBe(true);
    });

    it("should update configuration", async () => {
      await storageManager.updateConfig({ encryptionEnabled: false });
      const updatedConfig = storageManager.getConfig();
      expect(updatedConfig.encryptionEnabled).toBe(false);
    });
  });

  describe("Project Management", () => {
    it("should create a new project", async () => {
      const projectId = "test-project-1";
      const projectName = "Test Project";

      const project = await storageManager.createProject(
        projectId,
        projectName
      );

      expect(project.projectId).toBe(projectId);
      expect(await fs.pathExists(project.projectPath)).toBe(true);
      expect(await fs.pathExists(project.documentsPath)).toBe(true);
      expect(await fs.pathExists(project.resultsPath)).toBe(true);
      expect(await fs.pathExists(project.tempPath)).toBe(true);
      expect(await fs.pathExists(project.backupPath)).toBe(true);
    });

    it("should retrieve an existing project", async () => {
      const projectId = "test-project-2";
      await storageManager.createProject(projectId, "Test Project 2");

      const retrievedProject = await storageManager.getProject(projectId);
      expect(retrievedProject).not.toBeNull();
      expect(retrievedProject!.projectId).toBe(projectId);
    });

    it("should return null for non-existent project", async () => {
      const project = await storageManager.getProject("non-existent");
      expect(project).toBeNull();
    });

    it("should list all projects", async () => {
      await storageManager.createProject("project-1", "Project 1");
      await storageManager.createProject("project-2", "Project 2");

      const projects = await storageManager.listProjects();
      expect(projects).toHaveLength(2);
      expect(projects.map((p) => p.projectId)).toContain("project-1");
      expect(projects.map((p) => p.projectId)).toContain("project-2");
    });

    it("should delete a project", async () => {
      const projectId = "project-to-delete";
      await storageManager.createProject(projectId, "Project to Delete");

      await storageManager.deleteProject(projectId);

      const project = await storageManager.getProject(projectId);
      expect(project).toBeNull();
    });

    it("should throw error when deleting non-existent project", async () => {
      await expect(
        storageManager.deleteProject("non-existent")
      ).rejects.toThrow("Project non-existent not found");
    });
  });

  describe("File Operations", () => {
    let projectId: string;

    beforeEach(async () => {
      projectId = "file-test-project";
      await storageManager.createProject(projectId, "File Test Project");
    });

    it("should store and retrieve a file", async () => {
      const content = "Test file content";
      const filePath = "/test/document.txt";
      const metadata = { type: "text", size: content.length };

      const secureFile = await storageManager.storeFile(
        projectId,
        filePath,
        content,
        metadata
      );

      expect(secureFile.originalPath).toBe(filePath);
      expect(secureFile.encrypted).toBe(true);
      expect(secureFile.metadata).toEqual(metadata);

      const retrievedContent = await storageManager.retrieveFile(
        projectId,
        secureFile.id
      );
      expect(retrievedContent.toString()).toBe(content);
    });

    it("should store file without encryption when disabled", async () => {
      await storageManager.updateConfig({ encryptionEnabled: false });

      const content = "Unencrypted content";
      const secureFile = await storageManager.storeFile(
        projectId,
        "/test.txt",
        content
      );

      expect(secureFile.encrypted).toBe(false);
    });

    it("should list files for a project", async () => {
      await storageManager.storeFile(projectId, "/file1.txt", "Content 1");
      await storageManager.storeFile(projectId, "/file2.txt", "Content 2");

      const files = await storageManager.listFiles(projectId);
      expect(files).toHaveLength(2);
    });

    it("should delete a file", async () => {
      const secureFile = await storageManager.storeFile(
        projectId,
        "/delete-me.txt",
        "Delete this"
      );

      await storageManager.deleteFile(projectId, secureFile.id);

      await expect(
        storageManager.retrieveFile(projectId, secureFile.id)
      ).rejects.toThrow(`File ${secureFile.id} not found`);
    });

    it("should throw error when retrieving non-existent file", async () => {
      await expect(
        storageManager.retrieveFile(projectId, "non-existent")
      ).rejects.toThrow("File non-existent not found");
    });
  });

  describe("Encryption Operations", () => {
    it("should encrypt and decrypt data", async () => {
      const originalData = "Sensitive data to encrypt";

      const encrypted = await storageManager.encryptData(originalData);
      expect(encrypted).not.toEqual(Buffer.from(originalData));

      const decrypted = await storageManager.decryptData(encrypted);
      expect(decrypted.toString()).toBe(originalData);
    });

    it("should generate encryption key", () => {
      const key = storageManager.generateEncryptionKey();
      expect(key).toHaveLength(64); // 32 bytes in hex = 64 characters
      expect(/^[a-f0-9]+$/i.test(key)).toBe(true);
    });

    it("should throw error when encrypting without key", async () => {
      await storageManager.updateConfig({ encryptionKey: undefined });

      await expect(storageManager.encryptData("test")).rejects.toThrow(
        "Encryption key not configured"
      );
    });
  });

  describe("Temporary File Management", () => {
    it("should create and retrieve temporary file", async () => {
      const content = "Temporary content";
      const purpose = "testing";

      const tempFile = await storageManager.createTempFile(purpose, content);

      expect(tempFile.purpose).toBe(purpose);
      expect(tempFile.createdAt).toBeInstanceOf(Date);
      expect(tempFile.expiresAt).toBeInstanceOf(Date);

      const retrievedContent = await storageManager.getTempFile(tempFile.path);
      expect(retrievedContent.toString()).toBe(content);
    });

    it("should clean up expired temporary files", async () => {
      const tempFile = await storageManager.createTempFile(
        "test",
        "content",
        1
      ); // 1ms TTL

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 10));

      await storageManager.cleanupTempFiles();

      await expect(storageManager.getTempFile(tempFile.path)).rejects.toThrow(
        "Temporary file"
      );
    });

    it("should throw error when accessing expired temp file", async () => {
      const tempFile = await storageManager.createTempFile(
        "test",
        "content",
        1
      );

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 10));

      await expect(storageManager.getTempFile(tempFile.path)).rejects.toThrow(
        "has expired"
      );
    });
  });

  describe("Permission Management", () => {
    it("should check file permissions", async () => {
      const projectId = "perm-test";
      await storageManager.createProject(projectId, "Permission Test");
      const secureFile = await storageManager.storeFile(
        projectId,
        "/test.txt",
        "content"
      );

      const hasReadPermission = await storageManager.checkPermissions(
        secureFile.securePath,
        { read: true, write: false, delete: false, admin: false }
      );

      expect(hasReadPermission).toBe(true);
    });

    it("should return false for non-existent file permissions", async () => {
      const hasPermission = await storageManager.checkPermissions(
        "/non/existent/file",
        { read: true, write: false, delete: false, admin: false }
      );

      expect(hasPermission).toBe(false);
    });
  });

  describe("Storage Health and Maintenance", () => {
    it("should validate storage", async () => {
      const isValid = await storageManager.validateStorage();
      expect(isValid).toBe(true);
    });

    it("should repair storage", async () => {
      // Remove a directory to simulate corruption
      const projectId = "repair-test";
      const project = await storageManager.createProject(
        projectId,
        "Repair Test"
      );
      await fs.remove(project.documentsPath);

      await storageManager.repairStorage();

      expect(await fs.pathExists(project.documentsPath)).toBe(true);
    });

    it("should get storage statistics", async () => {
      const projectId = "stats-test";
      await storageManager.createProject(projectId, "Stats Test");
      await storageManager.storeFile(projectId, "/test.txt", "test content");

      const stats = await storageManager.getStorageStats();

      expect(stats.projectCount).toBe(1);
      expect(stats.fileCount).toBe(1);
      expect(stats.totalSize).toBeGreaterThan(0);
    });
  });

  describe("Backup Operations", () => {
    it("should create backup", async () => {
      const projectId = "backup-test";
      await storageManager.createProject(projectId, "Backup Test");
      await storageManager.storeFile(projectId, "/test.txt", "backup content");

      const backup = await storageManager.createBackup(projectId);

      expect(backup.projectId).toBe(projectId);
      expect(backup.backupId).toContain(projectId);
      expect(backup.size).toBeGreaterThan(0);
      expect(backup.checksum).toBeTruthy();
    });

    it("should throw error when creating backup for non-existent project", async () => {
      await expect(storageManager.createBackup("non-existent")).rejects.toThrow(
        "Project non-existent not found"
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle file system errors gracefully", async () => {
      // Test with invalid base directory
      const invalidConfig = {
        ...config,
        baseDirectory: "/invalid/path/that/does/not/exist",
      };

      const invalidStorageManager = new SecureStorageManagerImpl();

      // Should not throw during initialization (creates directory)
      await expect(
        invalidStorageManager.initialize(invalidConfig)
      ).resolves.not.toThrow();
    });

    it("should handle permission errors on Windows", async () => {
      // This test mainly ensures the permission setting doesn't crash on Windows
      const projectId = "permission-test";
      await expect(
        storageManager.createProject(projectId, "Permission Test")
      ).resolves.not.toThrow();
    });
  });
});
