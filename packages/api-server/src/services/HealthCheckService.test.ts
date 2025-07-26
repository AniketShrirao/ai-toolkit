import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HealthCheckService } from './HealthCheckService';

// Mock the dependencies
vi.mock('@ai-toolkit/ollama-interface', () => ({
  OllamaServiceImpl: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(true),
    getAvailableModels: vi.fn().mockResolvedValue(['llama2:7b', 'codellama:7b']),
    getCurrentModel: vi.fn().mockReturnValue('llama2:7b'),
  })),
}));

vi.mock('@ai-toolkit/core', () => ({
  environmentConfig: {
    getEnvironment: vi.fn().mockReturnValue('test'),
    getConfig: vi.fn().mockReturnValue({
      database: { path: './test.db' },
      redis: { host: 'localhost', port: 6379, db: 0 },
      storage: {
        inputPath: './test/input',
        outputPath: './test/output',
        tempPath: './test/temp',
      },
      logging: { level: 'debug' },
      features: { apiDocumentation: true },
      ollama: { host: 'localhost' },
      processing: { maxConcurrentJobs: 5 },
    }),
  },
}));

vi.mock('fs', () => ({
  existsSync: vi.fn().mockReturnValue(true),
  statSync: vi.fn().mockReturnValue({
    size: 1024,
    mtime: new Date('2024-01-01'),
  }),
}));

vi.mock('redis', () => ({
  createClient: vi.fn().mockReturnValue({
    connect: vi.fn().mockResolvedValue(undefined),
    ping: vi.fn().mockResolvedValue('PONG'),
    info: vi.fn().mockResolvedValue('used_memory:1048576'),
    disconnect: vi.fn().mockResolvedValue(undefined),
  }),
}));

describe('HealthCheckService', () => {
  let healthCheckService: HealthCheckService;

  beforeEach(() => {
    healthCheckService = new HealthCheckService();
    vi.clearAllMocks();
  });

  describe('getHealthStatus', () => {
    it('should return comprehensive health status', async () => {
      const healthStatus = await healthCheckService.getHealthStatus();

      expect(healthStatus).toHaveProperty('status');
      expect(healthStatus).toHaveProperty('timestamp');
      expect(healthStatus).toHaveProperty('environment');
      expect(healthStatus).toHaveProperty('uptime');
      expect(healthStatus).toHaveProperty('version');
      expect(healthStatus).toHaveProperty('components');
      expect(healthStatus).toHaveProperty('diagnostics');

      expect(healthStatus.components).toHaveProperty('ollama');
      expect(healthStatus.components).toHaveProperty('database');
      expect(healthStatus.components).toHaveProperty('redis');
      expect(healthStatus.components).toHaveProperty('storage');
      expect(healthStatus.components).toHaveProperty('system');
    });

    it('should include environment information', async () => {
      const healthStatus = await healthCheckService.getHealthStatus();

      expect(healthStatus.environment).toBe('test');
      expect(typeof healthStatus.uptime).toBe('number');
      expect(healthStatus.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should check Ollama connectivity', async () => {
      const healthStatus = await healthCheckService.getHealthStatus();

      expect(healthStatus.components.ollama.connected).toBe(true);
      expect(healthStatus.components.ollama.availableModels).toContain('llama2:7b');
      expect(healthStatus.components.ollama.loadedModel).toBe('llama2:7b');
      expect(typeof healthStatus.components.ollama.responseTime).toBe('number');
    });

    it('should check database status', async () => {
      const healthStatus = await healthCheckService.getHealthStatus();

      expect(healthStatus.components.database.connected).toBe(true);
      expect(healthStatus.components.database.exists).toBe(true);
      expect(healthStatus.components.database.path).toBe('./test.db');
      expect(typeof healthStatus.components.database.size).toBe('number');
    });

    it('should check Redis connectivity', async () => {
      const healthStatus = await healthCheckService.getHealthStatus();

      expect(healthStatus.components.redis.connected).toBe(true);
      expect(healthStatus.components.redis.host).toBe('localhost');
      expect(healthStatus.components.redis.port).toBe(6379);
      expect(typeof healthStatus.components.redis.responseTime).toBe('number');
    });

    it('should check storage paths', async () => {
      const healthStatus = await healthCheckService.getHealthStatus();

      expect(healthStatus.components.storage.paths.input.exists).toBe(true);
      expect(healthStatus.components.storage.paths.output.exists).toBe(true);
      expect(healthStatus.components.storage.paths.temp.exists).toBe(true);
    });

    it('should include system information', async () => {
      const healthStatus = await healthCheckService.getHealthStatus();

      expect(healthStatus.components.system.memory).toBeDefined();
      expect(healthStatus.components.system.cpu).toBeDefined();
      expect(healthStatus.components.system.platform).toBe(process.platform);
      expect(healthStatus.components.system.nodeVersion).toBe(process.version);
    });

    it('should include diagnostics', async () => {
      const healthStatus = await healthCheckService.getHealthStatus();

      expect(Array.isArray(healthStatus.diagnostics)).toBe(true);
      expect(healthStatus.diagnostics.length).toBeGreaterThan(0);
      
      const diagnostic = healthStatus.diagnostics[0];
      expect(diagnostic).toHaveProperty('category');
      expect(diagnostic).toHaveProperty('level');
      expect(diagnostic).toHaveProperty('message');
    });
  });

  describe('error handling', () => {
    it('should handle Ollama connection failures gracefully', async () => {
      const { OllamaServiceImpl } = await import('@ai-toolkit/ollama-interface');
      vi.mocked(OllamaServiceImpl).mockImplementation(() => ({
        connect: vi.fn().mockRejectedValue(new Error('Connection failed')),
        getAvailableModels: vi.fn(),
        getCurrentModel: vi.fn(),
      }) as any);

      const healthStatus = await healthCheckService.getHealthStatus();

      expect(healthStatus.components.ollama.status).toBe('unhealthy');
      expect(healthStatus.components.ollama.connected).toBe(false);
      expect(healthStatus.components.ollama.error).toBe('Connection failed');
    });

    it('should handle Redis connection failures gracefully', async () => {
      const { createClient } = await import('redis');
      vi.mocked(createClient).mockReturnValue({
        connect: vi.fn().mockRejectedValue(new Error('Redis connection failed')),
        ping: vi.fn(),
        info: vi.fn(),
        disconnect: vi.fn(),
      } as any);

      const healthStatus = await healthCheckService.getHealthStatus();

      expect(healthStatus.components.redis.status).toBe('unhealthy');
      expect(healthStatus.components.redis.connected).toBe(false);
      expect(healthStatus.components.redis.error).toBe('Redis connection failed');
    });
  });

  describe('status determination', () => {
    it('should return unhealthy if any component is unhealthy', async () => {
      const { OllamaServiceImpl } = await import('@ai-toolkit/ollama-interface');
      vi.mocked(OllamaServiceImpl).mockImplementation(() => ({
        connect: vi.fn().mockRejectedValue(new Error('Connection failed')),
        getAvailableModels: vi.fn(),
        getCurrentModel: vi.fn(),
      }) as any);

      const healthStatus = await healthCheckService.getHealthStatus();

      expect(healthStatus.status).toBe('unhealthy');
    });

    it('should return degraded if any component is degraded', async () => {
      const { OllamaServiceImpl } = await import('@ai-toolkit/ollama-interface');
      vi.mocked(OllamaServiceImpl).mockImplementation(() => ({
        connect: vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(true), 6000))),
        getAvailableModels: vi.fn().mockResolvedValue(['llama2:7b']),
        getCurrentModel: vi.fn().mockReturnValue('llama2:7b'),
      }) as any);

      const healthStatus = await healthCheckService.getHealthStatus();

      expect(healthStatus.components.ollama.status).toBe('degraded');
    });
  });
});