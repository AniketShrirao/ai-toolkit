import {
  StorageConfig,
  ProjectStorage,
  SecureFile,
  StoragePermissions,
  TempFileInfo,
  BackupInfo,
} from "../types/storage.js";

export interface SecureStorageManager {
  // Initialization and configuration
  initialize(config: StorageConfig): Promise<void>;
  getConfig(): StorageConfig;
  updateConfig(config: Partial<StorageConfig>): Promise<void>;

  // Project management
  createProject(
    projectId: string,
    projectName: string
  ): Promise<ProjectStorage>;
  getProject(projectId: string): Promise<ProjectStorage | null>;
  deleteProject(projectId: string): Promise<void>;
  listProjects(): Promise<ProjectStorage[]>;

  // File operations
  storeFile(
    projectId: string,
    filePath: string,
    content: Buffer | string,
    metadata?: Record<string, any>
  ): Promise<SecureFile>;
  retrieveFile(projectId: string, fileId: string): Promise<Buffer>;
  deleteFile(projectId: string, fileId: string): Promise<void>;
  listFiles(projectId: string): Promise<SecureFile[]>;

  // Encryption operations
  encryptData(data: Buffer | string): Promise<Buffer>;
  decryptData(encryptedData: Buffer): Promise<Buffer>;
  generateEncryptionKey(): string;

  // Permission management
  setFilePermissions(filePath: string, permissions: string): Promise<void>;
  checkPermissions(
    filePath: string,
    requiredPermissions: StoragePermissions
  ): Promise<boolean>;

  // Temporary file management
  createTempFile(
    purpose: string,
    content: Buffer | string,
    ttl?: number
  ): Promise<TempFileInfo>;
  getTempFile(tempPath: string): Promise<Buffer>;
  cleanupTempFiles(): Promise<void>;
  scheduleTempCleanup(): void;

  // Backup and recovery
  createBackup(projectId: string): Promise<BackupInfo>;
  restoreBackup(backupId: string): Promise<void>;
  listBackups(projectId?: string): Promise<BackupInfo[]>;
  deleteBackup(backupId: string): Promise<void>;

  // Health and maintenance
  validateStorage(): Promise<boolean>;
  repairStorage(): Promise<void>;
  getStorageStats(): Promise<{
    totalSize: number;
    projectCount: number;
    fileCount: number;
    tempFileCount: number;
    backupCount: number;
  }>;
}
