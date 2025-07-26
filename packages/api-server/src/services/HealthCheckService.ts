import { OllamaServiceImpl } from '@ai-toolkit/ollama-interface';
import { environmentConfig } from '@ai-toolkit/core';
import { existsSync, statSync } from 'fs';
import { join } from 'path';
import { createClient } from 'redis';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  environment: string;
  uptime: number;
  version: string;
  components: {
    ollama: OllamaHealthStatus;
    database: DatabaseHealthStatus;
    redis: RedisHealthStatus;
    storage: StorageHealthStatus;
    system: SystemHealthStatus;
  };
  diagnostics: DiagnosticInfo[];
}

export interface OllamaHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  connected: boolean;
  version?: string;
  availableModels: string[];
  loadedModel?: string;
  memoryUsage?: number;
  responseTime: number;
  error?: string;
}

export interface DatabaseHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  connected: boolean;
  path: string;
  exists: boolean;
  size?: number;
  lastModified?: string;
  error?: string;
}

export interface RedisHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  connected: boolean;
  host: string;
  port: number;
  responseTime: number;
  memoryUsage?: number;
  error?: string;
}

export interface StorageHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  paths: {
    input: { exists: boolean; writable: boolean; path: string };
    output: { exists: boolean; writable: boolean; path: string };
    temp: { exists: boolean; writable: boolean; path: string };
  };
  diskSpace?: {
    total: number;
    free: number;
    used: number;
  };
  error?: string;
}

export interface SystemHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  memory: {
    total: number;
    free: number;
    used: number;
    percentage: number;
  };
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  platform: string;
  nodeVersion: string;
  error?: string;
}

export interface DiagnosticInfo {
  category: 'configuration' | 'connectivity' | 'performance' | 'security' | 'environment';
  level: 'info' | 'warning' | 'error';
  message: string;
  suggestion?: string;
  details?: any;
}

export class HealthCheckService {
  private config = environmentConfig.getConfig();

  async getHealthStatus(): Promise<HealthStatus> {
    const startTime = Date.now();
    const diagnostics: DiagnosticInfo[] = [];

    // Check all components
    const [ollama, database, redis, storage, system] = await Promise.all([
      this.checkOllamaHealth(),
      this.checkDatabaseHealth(),
      this.checkRedisHealth(),
      this.checkStorageHealth(),
      this.checkSystemHealth(),
    ]);

    // Add environment-specific diagnostics
    this.addEnvironmentDiagnostics(diagnostics);

    // Determine overall status
    const componentStatuses = [ollama.status, database.status, redis.status, storage.status, system.status];
    const overallStatus = this.determineOverallStatus(componentStatuses);

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      environment: environmentConfig.getEnvironment(),
      uptime: process.uptime(),
      version: this.getApplicationVersion(),
      components: {
        ollama,
        database,
        redis,
        storage,
        system,
      },
      diagnostics,
    };
  }

  private async checkOllamaHealth(): Promise<OllamaHealthStatus> {
    const startTime = Date.now();
    
    try {
      const ollamaService = new OllamaServiceImpl();
      const connected = await ollamaService.connect();
      
      if (!connected) {
        return {
          status: 'unhealthy',
          connected: false,
          availableModels: [],
          responseTime: Date.now() - startTime,
          error: 'Failed to connect to Ollama server',
        };
      }

      const responseTime = Date.now() - startTime;
      let availableModels: string[] = [];
      let loadedModel: string | undefined;

      try {
        const models = await ollamaService.getAvailableModels();
        availableModels = models.map(m => typeof m === 'string' ? m : (m.name || 'Unknown Model'));
        loadedModel = ollamaService.getCurrentModel() || undefined;
      } catch (error) {
        console.warn('Failed to get Ollama model info:', error);
      }

      return {
        status: responseTime > 5000 ? 'degraded' : 'healthy',
        connected: true,
        version: '0.1.17', // Mock version for now
        availableModels,
        loadedModel,
        memoryUsage: Math.floor(Math.random() * 2000) + 1000, // Mock memory usage
        responseTime,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        connected: false,
        availableModels: [],
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkDatabaseHealth(): Promise<DatabaseHealthStatus> {
    try {
      const dbPath = this.config.database.path;
      const exists = existsSync(dbPath);
      
      let size: number | undefined;
      let lastModified: string | undefined;

      if (exists) {
        const stats = statSync(dbPath);
        size = stats.size;
        lastModified = stats.mtime.toISOString();
      }

      return {
        status: exists ? 'healthy' : 'degraded',
        connected: exists,
        path: dbPath,
        exists,
        size,
        lastModified,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        connected: false,
        path: this.config.database.path,
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkRedisHealth(): Promise<RedisHealthStatus> {
    const startTime = Date.now();
    
    try {
      const client = createClient({
        socket: {
          host: this.config.redis.host,
          port: this.config.redis.port,
          connectTimeout: 5000, // 5 second timeout
        },
        database: this.config.redis.db,
        password: this.config.redis.password,
      });

      await client.connect();
      await client.ping();
      const responseTime = Date.now() - startTime;
      
      // Get memory info if available
      let memoryUsage: number | undefined;
      try {
        const info = await client.info('memory');
        const memoryMatch = info.match(/used_memory:(\d+)/);
        if (memoryMatch) {
          memoryUsage = parseInt(memoryMatch[1]);
        }
      } catch (error) {
        console.warn('Failed to get Redis memory info:', error);
      }

      await client.disconnect();

      return {
        status: responseTime > 1000 ? 'degraded' : 'healthy',
        connected: true,
        host: this.config.redis.host,
        port: this.config.redis.port,
        responseTime,
        memoryUsage,
      };
    } catch (error) {
      // Redis is optional for basic functionality, so mark as degraded instead of unhealthy
      return {
        status: 'degraded',
        connected: false,
        host: this.config.redis.host,
        port: this.config.redis.port,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Redis not available (optional)',
      };
    }
  }

  private async checkStorageHealth(): Promise<StorageHealthStatus> {
    try {
      const paths = {
        input: this.checkPath(this.config.storage.inputPath),
        output: this.checkPath(this.config.storage.outputPath),
        temp: this.checkPath(this.config.storage.tempPath),
      };

      const allPathsHealthy = Object.values(paths).every(p => p.exists && p.writable);

      return {
        status: allPathsHealthy ? 'healthy' : 'degraded',
        paths,
        diskSpace: this.getDiskSpace(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        paths: {
          input: { exists: false, writable: false, path: this.config.storage.inputPath },
          output: { exists: false, writable: false, path: this.config.storage.outputPath },
          temp: { exists: false, writable: false, path: this.config.storage.tempPath },
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private checkPath(path: string): { exists: boolean; writable: boolean; path: string } {
    try {
      const exists = existsSync(path);
      // Simple writability check - in production, you might want more sophisticated checks
      const writable = exists; // Simplified for now
      
      return { exists, writable, path };
    } catch (error) {
      return { exists: false, writable: false, path };
    }
  }

  private getDiskSpace(): { total: number; free: number; used: number } | undefined {
    try {
      // This is a simplified implementation
      // In production, you might want to use a library like 'node-disk-info'
      return {
        total: 1000000000, // 1GB mock
        free: 500000000,   // 500MB mock
        used: 500000000,   // 500MB mock
      };
    } catch (error) {
      return undefined;
    }
  }

  private async checkSystemHealth(): Promise<SystemHealthStatus> {
    try {
      // Use ES modules import instead of require
      const os = await import('os');
      
      const memoryUsage = process.memoryUsage();
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      const memoryPercentage = (usedMemory / totalMemory) * 100;

      const loadAverage = os.loadavg();
      const cpuUsage = process.cpuUsage();

      return {
        status: memoryPercentage > 90 ? 'degraded' : 'healthy',
        memory: {
          total: totalMemory,
          free: freeMemory,
          used: usedMemory,
          percentage: memoryPercentage,
        },
        cpu: {
          usage: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to seconds
          loadAverage,
        },
        platform: process.platform,
        nodeVersion: process.version,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        memory: { total: 0, free: 0, used: 0, percentage: 0 },
        cpu: { usage: 0, loadAverage: [] },
        platform: process.platform,
        nodeVersion: process.version,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private addEnvironmentDiagnostics(diagnostics: DiagnosticInfo[]): void {
    const env = environmentConfig.getEnvironment();

    // Environment-specific checks
    if (env === 'production') {
      diagnostics.push({
        category: 'environment',
        level: 'info',
        message: 'Running in production mode',
        suggestion: 'Ensure all security settings are properly configured',
      });

      if (this.config.logging.level === 'debug') {
        diagnostics.push({
          category: 'configuration',
          level: 'warning',
          message: 'Debug logging enabled in production',
          suggestion: 'Consider setting LOG_LEVEL to "info" or "error" for production',
        });
      }

      if (this.config.features.apiDocumentation) {
        diagnostics.push({
          category: 'security',
          level: 'warning',
          message: 'API documentation is enabled in production',
          suggestion: 'Consider disabling API documentation in production for security',
        });
      }
    } else if (env === 'development') {
      diagnostics.push({
        category: 'environment',
        level: 'info',
        message: 'Running in development mode',
        suggestion: 'Use production mode for deployment',
      });
    }

    // Configuration validation
    if (this.config.ollama.host === 'localhost' && env === 'production') {
      diagnostics.push({
        category: 'configuration',
        level: 'warning',
        message: 'Ollama host is set to localhost in production',
        suggestion: 'Consider using a proper hostname or container name for production',
      });
    }

    // Performance checks
    if (this.config.processing.maxConcurrentJobs > 20) {
      diagnostics.push({
        category: 'performance',
        level: 'warning',
        message: 'High number of concurrent jobs configured',
        suggestion: 'Monitor system resources to ensure stability',
      });
    }
  }

  private determineOverallStatus(componentStatuses: string[]): 'healthy' | 'degraded' | 'unhealthy' {
    // Get individual component statuses
    const [ollamaStatus, databaseStatus, redisStatus, storageStatus, systemStatus] = componentStatuses;
    
    // Core functionality requires Ollama to be healthy
    if (ollamaStatus === 'unhealthy') {
      return 'unhealthy';
    }
    
    // System health is critical
    if (systemStatus === 'unhealthy') {
      return 'unhealthy';
    }
    
    // If any component is degraded, overall is degraded
    if (componentStatuses.includes('degraded')) {
      return 'degraded';
    }
    
    // If core components are healthy, system is healthy
    return 'healthy';
  }

  private getApplicationVersion(): string {
    try {
      const packageJson = require('../../../../package.json');
      return packageJson.version || '1.0.0';
    } catch (error) {
      return '1.0.0';
    }
  }
}