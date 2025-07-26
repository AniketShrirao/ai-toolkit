import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EnvironmentConfigManager } from './EnvironmentConfig';

describe('EnvironmentConfig', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let originalArgv: string[];

  beforeEach(() => {
    originalEnv = { ...process.env };
    originalArgv = [...process.argv];
  });

  afterEach(() => {
    process.env = originalEnv;
    process.argv = originalArgv;
  });

  describe('Environment Detection', () => {
    it('should detect environment from CLI flag', () => {
      process.argv = ['node', 'script.js', '--env=production'];
      const config = new (EnvironmentConfigManager as any)();
      expect(config.getEnvironment()).toBe('production');
    });

    it('should detect environment from NODE_ENV', () => {
      process.env.NODE_ENV = 'production';
      const config = new (EnvironmentConfigManager as any)();
      expect(config.getEnvironment()).toBe('production');
    });

    it('should default to development', () => {
      delete process.env.NODE_ENV;
      process.argv = ['node', 'script.js'];
      const config = new (EnvironmentConfigManager as any)();
      expect(config.getEnvironment()).toBe('development');
    });

    it('should prioritize CLI flag over NODE_ENV', () => {
      process.env.NODE_ENV = 'development';
      process.argv = ['node', 'script.js', '--env=production'];
      const config = new (EnvironmentConfigManager as any)();
      expect(config.getEnvironment()).toBe('production');
    });
  });

  describe('Environment Variables Override', () => {
    it('should override port from environment variable', () => {
      process.env.PORT = '8080';
      const config = new (EnvironmentConfigManager as any)();
      expect(config.getConfig().server.port).toBe(8080);
    });

    it('should override Ollama host from environment variable', () => {
      process.env.OLLAMA_HOST = 'remote-ollama';
      const config = new (EnvironmentConfigManager as any)();
      expect(config.getConfig().ollama.host).toBe('remote-ollama');
    });

    it('should override boolean values correctly', () => {
      process.env.DATABASE_LOGGING = 'false';
      const config = new (EnvironmentConfigManager as any)();
      expect(config.getConfig().database.logging).toBe(false);
    });
  });

  describe('Environment Helpers', () => {
    it('should correctly identify production environment', () => {
      process.env.NODE_ENV = 'production';
      const config = new (EnvironmentConfigManager as any)();
      expect(config.isProduction()).toBe(true);
      expect(config.isDevelopment()).toBe(false);
      expect(config.isTest()).toBe(false);
    });

    it('should correctly identify development environment', () => {
      process.env.NODE_ENV = 'development';
      const config = new (EnvironmentConfigManager as any)();
      expect(config.isProduction()).toBe(false);
      expect(config.isDevelopment()).toBe(true);
      expect(config.isTest()).toBe(false);
    });

    it('should correctly identify test environment', () => {
      process.env.NODE_ENV = 'test';
      const config = new (EnvironmentConfigManager as any)();
      expect(config.isProduction()).toBe(false);
      expect(config.isDevelopment()).toBe(false);
      expect(config.isTest()).toBe(true);
    });
  });

  describe('Configuration Loading', () => {
    it('should load default configuration when JSON file is missing', () => {
      // This test assumes the config file might not exist
      const config = new (EnvironmentConfigManager as any)();
      const configData = config.getConfig();
      
      expect(configData).toBeDefined();
      expect(configData.server).toBeDefined();
      expect(configData.ollama).toBeDefined();
      expect(configData.database).toBeDefined();
    });

    it('should reload configuration when requested', () => {
      const config = new (EnvironmentConfigManager as any)();
      const originalPort = config.getConfig().server.port;
      
      process.env.PORT = '9000';
      config.reload();
      
      expect(config.getConfig().server.port).toBe(9000);
    });
  });
});