import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables from .env file
config();

export type Environment = 'development' | 'production' | 'test';

export interface EnvironmentConfig {
  environment: Environment;
  server: {
    port: number;
    host: string;
    cors: {
      origin: string[];
      credentials: boolean;
    };
  };
  ollama: {
    host: string;
    port: number;
    timeout: number;
    retries: number;
    defaultModel: string;
    models: {
      text: string;
      code: string;
      analysis: string;
    };
  };
  database: {
    type: string;
    path: string;
    logging: boolean;
  };
  redis: {
    host: string;
    port: number;
    db: number;
    keyPrefix: string;
    password?: string;
  };
  storage: {
    inputPath: string;
    outputPath: string;
    tempPath: string;
    maxFileSize: string;
    allowedTypes: string[];
  };
  processing: {
    maxConcurrentJobs: number;
    jobTimeout: number;
    retryAttempts: number;
    queueName: string;
  };
  logging: {
    level: string;
    format: string;
    file: {
      enabled: boolean;
      path: string;
      maxSize: string;
      maxFiles: number;
    };
    console: {
      enabled: boolean;
      colorize: boolean;
    };
  };
  security: {
    rateLimiting: {
      enabled: boolean;
      windowMs: number;
      max: number;
    };
    fileUpload: {
      maxSize: string;
      allowedMimeTypes: string[];
    };
  };
  features: {
    webDashboard: boolean;
    apiDocumentation: boolean;
    healthChecks: boolean;
    metrics: boolean;
  };
}

class EnvironmentConfigManager {
  private static instance: EnvironmentConfigManager;
  private config: EnvironmentConfig;
  private environment: Environment;

  private constructor() {
    this.environment = this.determineEnvironment();
    this.config = this.loadConfiguration();
  }

  public static getInstance(): EnvironmentConfigManager {
    if (!EnvironmentConfigManager.instance) {
      EnvironmentConfigManager.instance = new EnvironmentConfigManager();
    }
    return EnvironmentConfigManager.instance;
  }

  private determineEnvironment(): Environment {
    // Check CLI flags first
    const envFlag = process.argv.find(arg => arg.startsWith('--env='));
    if (envFlag) {
      const env = envFlag.split('=')[1] as Environment;
      if (['development', 'production', 'test'].includes(env)) {
        return env;
      }
    }

    // Check environment variable
    const nodeEnv = process.env.NODE_ENV as Environment;
    if (['development', 'production', 'test'].includes(nodeEnv)) {
      return nodeEnv;
    }

    // Default to development
    return 'development';
  }

  private loadConfiguration(): EnvironmentConfig {
    try {
      // Load base configuration from JSON file
      const configPath = join(process.cwd(), 'config', `${this.environment}.json`);
      const baseConfig = JSON.parse(readFileSync(configPath, 'utf-8'));

      // Override with environment variables
      const envConfig = this.buildConfigFromEnv();
      
      return this.mergeConfigs(baseConfig, envConfig);
    } catch (error) {
      console.warn(`Failed to load configuration for ${this.environment}, using defaults:`, error);
      return this.getDefaultConfig();
    }
  }

  private buildConfigFromEnv(): any {
    const env = process.env;
    
    const envConfig: any = {};
    
    // Server configuration
    if (env.PORT || env.HOST) {
      envConfig.server = {};
      if (env.PORT) envConfig.server.port = parseInt(env.PORT);
      if (env.HOST) envConfig.server.host = env.HOST;
    }
    
    // Ollama configuration
    if (env.OLLAMA_HOST || env.OLLAMA_PORT || env.OLLAMA_TIMEOUT || env.OLLAMA_DEFAULT_MODEL) {
      envConfig.ollama = {};
      if (env.OLLAMA_HOST) envConfig.ollama.host = env.OLLAMA_HOST;
      if (env.OLLAMA_PORT) envConfig.ollama.port = parseInt(env.OLLAMA_PORT);
      if (env.OLLAMA_TIMEOUT) envConfig.ollama.timeout = parseInt(env.OLLAMA_TIMEOUT);
      if (env.OLLAMA_DEFAULT_MODEL) envConfig.ollama.defaultModel = env.OLLAMA_DEFAULT_MODEL;
    }
    
    // Database configuration
    if (env.DATABASE_PATH || env.DATABASE_LOGGING) {
      envConfig.database = {};
      if (env.DATABASE_PATH) envConfig.database.path = env.DATABASE_PATH;
      if (env.DATABASE_LOGGING) envConfig.database.logging = env.DATABASE_LOGGING === 'true';
    }
    
    // Redis configuration
    if (env.REDIS_HOST || env.REDIS_PORT || env.REDIS_DB || env.REDIS_KEY_PREFIX || env.REDIS_PASSWORD) {
      envConfig.redis = {};
      if (env.REDIS_HOST) envConfig.redis.host = env.REDIS_HOST;
      if (env.REDIS_PORT) envConfig.redis.port = parseInt(env.REDIS_PORT);
      if (env.REDIS_DB) envConfig.redis.db = parseInt(env.REDIS_DB);
      if (env.REDIS_KEY_PREFIX) envConfig.redis.keyPrefix = env.REDIS_KEY_PREFIX;
      if (env.REDIS_PASSWORD) envConfig.redis.password = env.REDIS_PASSWORD;
    }
    
    // Storage configuration
    if (env.STORAGE_INPUT_PATH || env.STORAGE_OUTPUT_PATH || env.STORAGE_TEMP_PATH || env.STORAGE_MAX_FILE_SIZE) {
      envConfig.storage = {};
      if (env.STORAGE_INPUT_PATH) envConfig.storage.inputPath = env.STORAGE_INPUT_PATH;
      if (env.STORAGE_OUTPUT_PATH) envConfig.storage.outputPath = env.STORAGE_OUTPUT_PATH;
      if (env.STORAGE_TEMP_PATH) envConfig.storage.tempPath = env.STORAGE_TEMP_PATH;
      if (env.STORAGE_MAX_FILE_SIZE) envConfig.storage.maxFileSize = env.STORAGE_MAX_FILE_SIZE;
    }
    
    // Processing configuration
    if (env.MAX_CONCURRENT_JOBS || env.JOB_TIMEOUT || env.RETRY_ATTEMPTS) {
      envConfig.processing = {};
      if (env.MAX_CONCURRENT_JOBS) envConfig.processing.maxConcurrentJobs = parseInt(env.MAX_CONCURRENT_JOBS);
      if (env.JOB_TIMEOUT) envConfig.processing.jobTimeout = parseInt(env.JOB_TIMEOUT);
      if (env.RETRY_ATTEMPTS) envConfig.processing.retryAttempts = parseInt(env.RETRY_ATTEMPTS);
    }
    
    // Logging configuration
    if (env.LOG_LEVEL || env.LOG_FILE_ENABLED || env.LOG_FILE_PATH || env.LOG_CONSOLE_ENABLED) {
      envConfig.logging = {};
      if (env.LOG_LEVEL) envConfig.logging.level = env.LOG_LEVEL;
      
      if (env.LOG_FILE_ENABLED || env.LOG_FILE_PATH) {
        envConfig.logging.file = {};
        if (env.LOG_FILE_ENABLED) envConfig.logging.file.enabled = env.LOG_FILE_ENABLED === 'true';
        if (env.LOG_FILE_PATH) envConfig.logging.file.path = env.LOG_FILE_PATH;
      }
      
      if (env.LOG_CONSOLE_ENABLED) {
        envConfig.logging.console = {};
        envConfig.logging.console.enabled = env.LOG_CONSOLE_ENABLED === 'true';
      }
    }
    
    // Security configuration
    if (env.RATE_LIMITING_ENABLED || env.RATE_LIMITING_WINDOW_MS || env.RATE_LIMITING_MAX) {
      envConfig.security = {
        rateLimiting: {}
      };
      if (env.RATE_LIMITING_ENABLED) envConfig.security.rateLimiting.enabled = env.RATE_LIMITING_ENABLED === 'true';
      if (env.RATE_LIMITING_WINDOW_MS) envConfig.security.rateLimiting.windowMs = parseInt(env.RATE_LIMITING_WINDOW_MS);
      if (env.RATE_LIMITING_MAX) envConfig.security.rateLimiting.max = parseInt(env.RATE_LIMITING_MAX);
    }
    
    // Features configuration
    if (env.WEB_DASHBOARD_ENABLED || env.API_DOCUMENTATION_ENABLED || env.HEALTH_CHECKS_ENABLED || env.METRICS_ENABLED) {
      envConfig.features = {};
      if (env.WEB_DASHBOARD_ENABLED) envConfig.features.webDashboard = env.WEB_DASHBOARD_ENABLED === 'true';
      if (env.API_DOCUMENTATION_ENABLED) envConfig.features.apiDocumentation = env.API_DOCUMENTATION_ENABLED === 'true';
      if (env.HEALTH_CHECKS_ENABLED) envConfig.features.healthChecks = env.HEALTH_CHECKS_ENABLED === 'true';
      if (env.METRICS_ENABLED) envConfig.features.metrics = env.METRICS_ENABLED === 'true';
    }
    
    return envConfig;
  }

  private mergeConfigs(base: any, override: any): EnvironmentConfig {
    const merged = { ...base };
    
    for (const key in override) {
      if (override[key] !== undefined) {
        if (typeof override[key] === 'object' && !Array.isArray(override[key])) {
          merged[key] = { ...merged[key], ...override[key] };
        } else {
          merged[key] = override[key];
        }
      }
    }
    
    return merged;
  }

  private getDefaultConfig(): EnvironmentConfig {
    return {
      environment: this.environment,
      server: {
        port: 3000,
        host: '0.0.0.0',
        cors: {
          origin: ['http://localhost:3000'],
          credentials: true,
        },
      },
      ollama: {
        host: 'localhost',
        port: 11434,
        timeout: 30000,
        retries: 3,
        defaultModel: 'llama2:7b',
        models: {
          text: 'llama2:7b',
          code: 'codellama:7b',
          analysis: 'mistral:7b',
        },
      },
      database: {
        type: 'sqlite',
        path: './data/ai-toolkit-dev.db',
        logging: true,
      },
      redis: {
        host: 'localhost',
        port: 6379,
        db: 0,
        keyPrefix: 'ai-toolkit:dev:',
      },
      storage: {
        inputPath: './data/input',
        outputPath: './data/output',
        tempPath: './temp',
        maxFileSize: '100MB',
        allowedTypes: ['pdf', 'docx', 'txt', 'md', 'xlsx'],
      },
      processing: {
        maxConcurrentJobs: 3,
        jobTimeout: 300000,
        retryAttempts: 2,
        queueName: 'ai-toolkit-jobs',
      },
      logging: {
        level: 'debug',
        format: 'combined',
        file: {
          enabled: true,
          path: './logs/ai-toolkit.log',
          maxSize: '10MB',
          maxFiles: 5,
        },
        console: {
          enabled: true,
          colorize: true,
        },
      },
      security: {
        rateLimiting: {
          enabled: true,
          windowMs: 900000,
          max: 100,
        },
        fileUpload: {
          maxSize: '100MB',
          allowedMimeTypes: [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'text/markdown',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          ],
        },
      },
      features: {
        webDashboard: true,
        apiDocumentation: true,
        healthChecks: true,
        metrics: true,
      },
    };
  }

  public getConfig(): EnvironmentConfig {
    return this.config;
  }

  public getEnvironment(): Environment {
    return this.environment;
  }

  public isProduction(): boolean {
    return this.environment === 'production';
  }

  public isDevelopment(): boolean {
    return this.environment === 'development';
  }

  public isTest(): boolean {
    return this.environment === 'test';
  }

  public reload(): void {
    this.environment = this.determineEnvironment();
    this.config = this.loadConfiguration();
  }
}

export const environmentConfig = EnvironmentConfigManager.getInstance();
export default environmentConfig;