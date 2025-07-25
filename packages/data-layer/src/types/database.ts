export interface DatabaseConfig {
  databasePath: string;
  enableWAL: boolean;
  enableForeignKeys: boolean;
  busyTimeout: number;
  maxConnections: number;
}

export interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  database: number;
  keyPrefix: string;
  defaultTTL: number; // in seconds
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  project_id: string;
  original_path: string;
  type: string;
  status: "pending" | "processing" | "completed" | "failed";
  analysis_result?: string; // JSON string
  created_at: string;
  processed_at?: string;
}

export interface WorkflowExecution {
  id: string;
  workflow_name: string;
  status: "running" | "completed" | "failed" | "cancelled";
  input_data?: string; // JSON string
  result_data?: string; // JSON string
  started_at: string;
  completed_at?: string;
  error_message?: string;
}

export interface SystemConfig {
  key: string;
  value: string;
  updated_at: string;
}

export interface BackupRecord {
  id: string;
  project_id: string;
  backup_path: string;
  size: number;
  checksum: string;
  created_at: string;
}

export interface CacheEntry {
  key: string;
  value: any;
  ttl?: number;
  tags?: string[];
}
