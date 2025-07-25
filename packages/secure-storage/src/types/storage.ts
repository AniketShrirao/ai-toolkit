export interface StorageConfig {
  baseDirectory: string;
  encryptionEnabled: boolean;
  encryptionKey?: string;
  filePermissions: {
    directories: string;
    files: string;
  };
  tempCleanupInterval: number; // in milliseconds
  maxTempFileAge: number; // in milliseconds
}

export interface ProjectStorage {
  projectId: string;
  projectPath: string;
  documentsPath: string;
  resultsPath: string;
  tempPath: string;
  backupPath: string;
}

export interface SecureFile {
  id: string;
  originalPath: string;
  securePath: string;
  encrypted: boolean;
  permissions: string;
  createdAt: Date;
  lastAccessed: Date;
  metadata: Record<string, any>;
}

export interface StoragePermissions {
  read: boolean;
  write: boolean;
  delete: boolean;
  admin: boolean;
}

export interface TempFileInfo {
  path: string;
  createdAt: Date;
  expiresAt: Date;
  purpose: string;
}

export interface BackupInfo {
  backupId: string;
  projectId: string;
  backupPath: string;
  createdAt: Date;
  size: number;
  checksum: string;
}
