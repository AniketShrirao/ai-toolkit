import {
  createHash,
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "crypto";
import { promises as fs, constants } from "fs";
import * as path from "path";
import * as fsExtra from "fs-extra";
import { SecureStorageManager } from "./interfaces/SecureStorageManager.js";
import {
  StorageConfig,
  ProjectStorage,
  SecureFile,
  StoragePermissions,
  TempFileInfo,
  BackupInfo,
} from "./types/storage.js";

export class SecureStorageManagerImpl implements SecureStorageManager {
  private config!: StorageConfig;
  private tempCleanupTimer?: NodeJS.Timeout;
  private projects: Map<string, ProjectStorage> = new Map();
  private secureFiles: Map<string, SecureFile> = new Map();
  private tempFiles: Map<string, TempFileInfo> = new Map();

  async initialize(config: StorageConfig): Promise<void> {
    this.config = { ...config };

    // Ensure base directory exists
    await fsExtra.ensureDir(this.config.baseDirectory);

    // Set directory permissions
    await this.setFilePermissions(
      this.config.baseDirectory,
      this.config.filePermissions.directories
    );

    // Initialize project directories
    const projectsDir = path.join(this.config.baseDirectory, "projects");
    const tempDir = path.join(this.config.baseDirectory, "temp");
    const backupDir = path.join(this.config.baseDirectory, "backups");

    await Promise.all([
      fsExtra.ensureDir(projectsDir),
      fsExtra.ensureDir(tempDir),
      fsExtra.ensureDir(backupDir),
    ]);

    // Load existing projects
    await this.loadExistingProjects();

    // Schedule temp file cleanup
    this.scheduleTempCleanup();
  }

  getConfig(): StorageConfig {
    return { ...this.config };
  }

  async updateConfig(config: Partial<StorageConfig>): Promise<void> {
    this.config = { ...this.config, ...config };

    // Reschedule cleanup if interval changed
    if (config.tempCleanupInterval) {
      this.scheduleTempCleanup();
    }
  }

  async createProject(
    projectId: string,
    projectName: string
  ): Promise<ProjectStorage> {
    const projectPath = path.join(
      this.config.baseDirectory,
      "projects",
      projectId
    );
    const documentsPath = path.join(projectPath, "documents");
    const resultsPath = path.join(projectPath, "results");
    const tempPath = path.join(projectPath, "temp");
    const backupPath = path.join(
      this.config.baseDirectory,
      "backups",
      projectId
    );

    // Create directory structure
    await Promise.all([
      fsExtra.ensureDir(documentsPath),
      fsExtra.ensureDir(resultsPath),
      fsExtra.ensureDir(tempPath),
      fsExtra.ensureDir(backupPath),
    ]);

    // Set permissions
    await Promise.all([
      this.setFilePermissions(
        projectPath,
        this.config.filePermissions.directories
      ),
      this.setFilePermissions(
        documentsPath,
        this.config.filePermissions.directories
      ),
      this.setFilePermissions(
        resultsPath,
        this.config.filePermissions.directories
      ),
      this.setFilePermissions(
        tempPath,
        this.config.filePermissions.directories
      ),
      this.setFilePermissions(
        backupPath,
        this.config.filePermissions.directories
      ),
    ]);

    // Create project metadata
    const projectStorage: ProjectStorage = {
      projectId,
      projectPath,
      documentsPath,
      resultsPath,
      tempPath,
      backupPath,
    };

    // Save project metadata
    const metadataPath = path.join(projectPath, "project.json");
    await fs.writeFile(
      metadataPath,
      JSON.stringify(
        {
          projectName,
          createdAt: new Date().toISOString(),
          ...projectStorage,
        },
        null,
        2
      )
    );

    await this.setFilePermissions(
      metadataPath,
      this.config.filePermissions.files
    );

    this.projects.set(projectId, projectStorage);
    return projectStorage;
  }

  async getProject(projectId: string): Promise<ProjectStorage | null> {
    return this.projects.get(projectId) || null;
  }

  async deleteProject(projectId: string): Promise<void> {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // Remove all files associated with the project
    const projectFiles = Array.from(this.secureFiles.values()).filter((file) =>
      file.securePath.startsWith(project.projectPath)
    );

    for (const file of projectFiles) {
      this.secureFiles.delete(file.id);
    }

    // Remove project directory
    await fsExtra.remove(project.projectPath);
    await fsExtra.remove(project.backupPath);

    this.projects.delete(projectId);
  }

  async listProjects(): Promise<ProjectStorage[]> {
    return Array.from(this.projects.values());
  }

  async storeFile(
    projectId: string,
    filePath: string,
    content: Buffer | string,
    metadata: Record<string, any> = {}
  ): Promise<SecureFile> {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const fileId = this.generateFileId();
    const fileName = path.basename(filePath);
    const securePath = path.join(
      project.documentsPath,
      `${fileId}_${fileName}`
    );

    // Convert content to Buffer if it's a string
    const contentBuffer = Buffer.isBuffer(content)
      ? content
      : Buffer.from(content);

    // Encrypt if enabled
    let finalContent = contentBuffer;
    let encrypted = false;
    if (this.config.encryptionEnabled && this.config.encryptionKey) {
      finalContent = await this.encryptData(contentBuffer);
      encrypted = true;
    }

    // Write file
    await fs.writeFile(securePath, finalContent);
    await this.setFilePermissions(
      securePath,
      this.config.filePermissions.files
    );

    const secureFile: SecureFile = {
      id: fileId,
      originalPath: filePath,
      securePath,
      encrypted,
      permissions: this.config.filePermissions.files,
      createdAt: new Date(),
      lastAccessed: new Date(),
      metadata,
    };

    this.secureFiles.set(fileId, secureFile);

    // Save file metadata
    const metadataPath = path.join(
      project.documentsPath,
      `${fileId}.meta.json`
    );
    await fs.writeFile(metadataPath, JSON.stringify(secureFile, null, 2));
    await this.setFilePermissions(
      metadataPath,
      this.config.filePermissions.files
    );

    return secureFile;
  }

  async retrieveFile(projectId: string, fileId: string): Promise<Buffer> {
    const secureFile = this.secureFiles.get(fileId);
    if (!secureFile) {
      throw new Error(`File ${fileId} not found`);
    }

    // Update last accessed time
    secureFile.lastAccessed = new Date();

    // Read file content
    const content = await fs.readFile(secureFile.securePath);

    // Decrypt if necessary
    if (secureFile.encrypted) {
      return await this.decryptData(content);
    }

    return content;
  }

  async deleteFile(projectId: string, fileId: string): Promise<void> {
    const secureFile = this.secureFiles.get(fileId);
    if (!secureFile) {
      throw new Error(`File ${fileId} not found`);
    }

    // Construct metadata file path
    const metadataPath = path.join(
      path.dirname(secureFile.securePath),
      `${secureFile.id}.meta.json`
    );

    // Remove file and metadata
    await Promise.all([
      fs.unlink(secureFile.securePath),
      fs.unlink(metadataPath),
    ]);

    this.secureFiles.delete(fileId);
  }

  async listFiles(projectId: string): Promise<SecureFile[]> {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    return Array.from(this.secureFiles.values()).filter((file) =>
      file.securePath.startsWith(project.documentsPath)
    );
  }

  async encryptData(data: Buffer | string): Promise<Buffer> {
    if (!this.config.encryptionKey) {
      throw new Error("Encryption key not configured");
    }

    const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data);

    // Generate a random IV for each encryption
    const iv = randomBytes(16);

    // Create key from the configured key (ensure it's 32 bytes for AES-256)
    const key = createHash("sha256").update(this.config.encryptionKey).digest();

    const cipher = createCipheriv("aes-256-cbc", key, iv);

    const encrypted = Buffer.concat([
      iv, // Prepend IV to encrypted data
      cipher.update(dataBuffer),
      cipher.final(),
    ]);

    return encrypted;
  }

  async decryptData(encryptedData: Buffer): Promise<Buffer> {
    if (!this.config.encryptionKey) {
      throw new Error("Encryption key not configured");
    }

    // Extract IV from the beginning of encrypted data
    const iv = encryptedData.subarray(0, 16);
    const encrypted = encryptedData.subarray(16);

    // Create key from the configured key (ensure it's 32 bytes for AES-256)
    const key = createHash("sha256").update(this.config.encryptionKey).digest();

    const decipher = createDecipheriv("aes-256-cbc", key, iv);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted;
  }

  generateEncryptionKey(): string {
    return randomBytes(32).toString("hex");
  }

  async setFilePermissions(
    filePath: string,
    permissions: string
  ): Promise<void> {
    try {
      // Convert string permissions to octal
      const mode = parseInt(permissions, 8);
      await fs.chmod(filePath, mode);
    } catch (error) {
      // On Windows, file permissions might not work as expected
      // Log the error but don't fail the operation
      console.warn(`Could not set permissions for ${filePath}:`, error);
    }
  }

  async checkPermissions(
    filePath: string,
    requiredPermissions: StoragePermissions
  ): Promise<boolean> {
    try {
      // Check if file exists and is accessible
      await fs.access(filePath, constants.F_OK);

      if (requiredPermissions.read) {
        await fs.access(filePath, constants.R_OK);
      }

      if (requiredPermissions.write) {
        await fs.access(filePath, constants.W_OK);
      }

      return true;
    } catch {
      return false;
    }
  }

  async createTempFile(
    purpose: string,
    content: Buffer | string,
    ttl: number = 3600000
  ): Promise<TempFileInfo> {
    const tempId = this.generateFileId();
    const tempPath = path.join(
      this.config.baseDirectory,
      "temp",
      `${tempId}.tmp`
    );

    const contentBuffer = Buffer.isBuffer(content)
      ? content
      : Buffer.from(content);
    await fs.writeFile(tempPath, contentBuffer);
    await this.setFilePermissions(tempPath, this.config.filePermissions.files);

    const tempFileInfo: TempFileInfo = {
      path: tempPath,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + ttl),
      purpose,
    };

    this.tempFiles.set(tempPath, tempFileInfo);
    return tempFileInfo;
  }

  async getTempFile(tempPath: string): Promise<Buffer> {
    const tempInfo = this.tempFiles.get(tempPath);
    if (!tempInfo) {
      throw new Error(`Temporary file ${tempPath} not found`);
    }

    if (new Date() > tempInfo.expiresAt) {
      await this.deleteTempFile(tempPath);
      throw new Error(`Temporary file ${tempPath} has expired`);
    }

    return await fs.readFile(tempPath);
  }

  async cleanupTempFiles(): Promise<void> {
    const now = new Date();
    const expiredFiles: string[] = [];

    for (const [tempPath, tempInfo] of this.tempFiles.entries()) {
      if (now > tempInfo.expiresAt) {
        expiredFiles.push(tempPath);
      }
    }

    await Promise.all(
      expiredFiles.map((tempPath) => this.deleteTempFile(tempPath))
    );
  }

  scheduleTempCleanup(): void {
    if (this.tempCleanupTimer) {
      clearInterval(this.tempCleanupTimer);
    }

    this.tempCleanupTimer = setInterval(() => {
      this.cleanupTempFiles().catch(console.error);
    }, this.config.tempCleanupInterval);
  }

  async createBackup(projectId: string): Promise<BackupInfo> {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const backupId = `${projectId}_${Date.now()}`;
    const backupPath = path.join(project.backupPath, `${backupId}.tar.gz`);

    // Create compressed backup (simplified - in real implementation, use tar/gzip)
    const backupData = await this.createProjectArchive(project);
    await fs.writeFile(backupPath, backupData);

    const stats = await fs.stat(backupPath);
    const checksum = createHash("sha256").update(backupData).digest("hex");

    const backupInfo: BackupInfo = {
      backupId,
      projectId,
      backupPath,
      createdAt: new Date(),
      size: stats.size,
      checksum,
    };

    return backupInfo;
  }

  async restoreBackup(backupId: string): Promise<void> {
    // Implementation would extract and restore the backup
    throw new Error("Backup restoration not yet implemented");
  }

  async listBackups(projectId?: string): Promise<BackupInfo[]> {
    // Implementation would scan backup directories and return backup info
    return [];
  }

  async deleteBackup(backupId: string): Promise<void> {
    // Implementation would delete the specified backup
    throw new Error("Backup deletion not yet implemented");
  }

  async validateStorage(): Promise<boolean> {
    try {
      // Check if base directory exists and is accessible
      await fs.access(
        this.config.baseDirectory,
        constants.R_OK | constants.W_OK
      );

      // Validate each project
      for (const project of this.projects.values()) {
        await fs.access(project.projectPath, constants.R_OK | constants.W_OK);
      }

      return true;
    } catch {
      return false;
    }
  }

  async repairStorage(): Promise<void> {
    // Ensure all required directories exist
    await fsExtra.ensureDir(this.config.baseDirectory);

    for (const project of this.projects.values()) {
      await Promise.all([
        fsExtra.ensureDir(project.documentsPath),
        fsExtra.ensureDir(project.resultsPath),
        fsExtra.ensureDir(project.tempPath),
        fsExtra.ensureDir(project.backupPath),
      ]);
    }
  }

  async getStorageStats(): Promise<{
    totalSize: number;
    projectCount: number;
    fileCount: number;
    tempFileCount: number;
    backupCount: number;
  }> {
    const stats = await this.calculateDirectorySize(this.config.baseDirectory);

    return {
      totalSize: stats,
      projectCount: this.projects.size,
      fileCount: this.secureFiles.size,
      tempFileCount: this.tempFiles.size,
      backupCount: 0, // Would be calculated from backup directory
    };
  }

  private async loadExistingProjects(): Promise<void> {
    const projectsDir = path.join(this.config.baseDirectory, "projects");

    try {
      const projectDirs = await fs.readdir(projectsDir);

      for (const projectDir of projectDirs) {
        const projectPath = path.join(projectsDir, projectDir);
        const metadataPath = path.join(projectPath, "project.json");

        try {
          const metadata = JSON.parse(await fs.readFile(metadataPath, "utf-8"));
          this.projects.set(metadata.projectId, {
            projectId: metadata.projectId,
            projectPath,
            documentsPath: path.join(projectPath, "documents"),
            resultsPath: path.join(projectPath, "results"),
            tempPath: path.join(projectPath, "temp"),
            backupPath: path.join(
              this.config.baseDirectory,
              "backups",
              metadata.projectId
            ),
          });

          // Load file metadata
          await this.loadProjectFiles(metadata.projectId);
        } catch (error) {
          console.warn(
            `Could not load project metadata for ${projectDir}:`,
            error
          );
        }
      }
    } catch (error) {
      // Projects directory doesn't exist yet
    }
  }

  private async loadProjectFiles(projectId: string): Promise<void> {
    const project = this.projects.get(projectId);
    if (!project) return;

    try {
      const files = await fs.readdir(project.documentsPath);

      for (const file of files) {
        if (file.endsWith(".meta.json")) {
          try {
            const metadataPath = path.join(project.documentsPath, file);
            const metadata = JSON.parse(
              await fs.readFile(metadataPath, "utf-8")
            );
            this.secureFiles.set(metadata.id, metadata);
          } catch (error) {
            console.warn(`Could not load file metadata ${file}:`, error);
          }
        }
      }
    } catch (error) {
      // Documents directory might not exist
    }
  }

  private generateFileId(): string {
    return randomBytes(16).toString("hex");
  }

  private async deleteTempFile(tempPath: string): Promise<void> {
    try {
      await fs.unlink(tempPath);
      this.tempFiles.delete(tempPath);
    } catch (error) {
      console.warn(`Could not delete temp file ${tempPath}:`, error);
    }
  }

  private async createProjectArchive(project: ProjectStorage): Promise<Buffer> {
    // Simplified implementation - in real scenario, would use tar/gzip
    const files: Record<string, Buffer> = {};

    // Read all project files
    const documentsFiles = await fs.readdir(project.documentsPath);
    for (const file of documentsFiles) {
      const filePath = path.join(project.documentsPath, file);
      files[`documents/${file}`] = await fs.readFile(filePath);
    }

    const resultsFiles = await fs.readdir(project.resultsPath);
    for (const file of resultsFiles) {
      const filePath = path.join(project.resultsPath, file);
      files[`results/${file}`] = await fs.readFile(filePath);
    }

    // Create a simple JSON archive (in real implementation, use proper archiving)
    return Buffer.from(JSON.stringify(files));
  }

  private async calculateDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0;

    try {
      const items = await fs.readdir(dirPath);

      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = await fs.stat(itemPath);

        if (stats.isDirectory()) {
          totalSize += await this.calculateDirectorySize(itemPath);
        } else {
          totalSize += stats.size;
        }
      }
    } catch (error) {
      // Directory might not exist or be accessible
    }

    return totalSize;
  }
}
