import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ApiKeyManagerImpl } from '../ApiKeyManagerImpl.js';
import { SecureStorageManagerImpl } from '../SecureStorageManagerImpl.js';
import { LLMProvider } from '@ai-toolkit/shared';

// Mock fs operations
vi.mock('fs', () => ({
  promises: {
    mkdir: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    unlink: vi.fn()
  }
}));

// Mock fetch for API validation
global.fetch = vi.fn();

// Mock SecureStorageManagerImpl
vi.mock('../SecureStorageManagerImpl.js', () => ({
  SecureStorageManagerImpl: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    encryptData: vi.fn().mockImplementation((data) => Promise.resolve(Buffer.from(`encrypted_${data}`))),
    decryptData: vi.fn().mockImplementation((data) => Promise.resolve(Buffer.from(data.toString().replace('encrypted_', '')))),
    generateEncryptionKey: vi.fn().mockReturnValue('test-encryption-key'),
    getConfig: vi.fn().mockReturnValue({ encryptionKey: 'test-key' })
  }))
}));

describe('ApiKeyManagerImpl', () => {
  let apiKeyManager: ApiKeyManagerImpl;
  let tempDir: string;
  let mockSecureStorage: any;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), 'ai-toolkit-test-' + Date.now());
    
    // Create mock secure storage
    mockSecureStorage = new SecureStorageManagerImpl();
    apiKeyManager = new ApiKeyManagerImpl(mockSecureStorage);
    
    // Mock the config path to use temp directory
    (apiKeyManager as any).configPath = path.join(tempDir, 'api-keys.json');
    
    vi.clearAllMocks();
  });

  afterEach(async () => {
    vi.clearAllMocks();
  });

  describe('storeApiKey', () => {
    it('should store an API key securely', async () => {
      const config = {
        provider: 'openai' as LLMProvider,
        apiKey: 'sk-test-key-123',
        metadata: { source: 'test' }
      };

      (fs.mkdir as any).mockResolvedValue(undefined);
      (fs.writeFile as any).mockResolvedValue(undefined);
      (fs.readFile as any).mockRejectedValue(new Error('File not found'));

      await apiKeyManager.initialize();
      await apiKeyManager.storeApiKey(config);

      expect(fs.writeFile).toHaveBeenCalled();
      const writeCall = (fs.writeFile as any).mock.calls[0];
      expect(writeCall[0]).toContain('api-keys.json');
      
      // Verify the data is encrypted (not plain text)
      const writtenData = JSON.parse(writeCall[1]);
      expect(writtenData.openai.encryptedApiKey).toBeDefined();
      expect(writtenData.openai.encryptedApiKey).not.toBe('sk-test-key-123');
    });

    it('should update existing API key', async () => {
      const existingData = {
        openai: {
          provider: 'openai',
          encryptedApiKey: 'existing-encrypted-key',
          createdAt: new Date().toISOString(),
          usageStats: { totalRequests: 5, rateLimitHits: 0 }
        }
      };

      (fs.mkdir as any).mockResolvedValue(undefined);
      (fs.readFile as any).mockResolvedValue(JSON.stringify(existingData));
      (fs.writeFile as any).mockResolvedValue(undefined);

      await apiKeyManager.initialize();
      
      const newConfig = {
        provider: 'openai' as LLMProvider,
        apiKey: 'sk-new-key-456'
      };

      await apiKeyManager.storeApiKey(newConfig);

      expect(fs.writeFile).toHaveBeenCalled();
      const writeCall = (fs.writeFile as any).mock.calls[0];
      const writtenData = JSON.parse(writeCall[1]);
      
      // Should have new encrypted key but preserve usage stats
      expect(writtenData.openai.encryptedApiKey).not.toBe('existing-encrypted-key');
      expect(writtenData.openai.usageStats.totalRequests).toBe(0); // Reset for new key
    });
  });

  describe('getApiKey', () => {
    it('should retrieve and decrypt API key', async () => {
      // Mock successful initialization and decryption
      (fs.mkdir as any).mockResolvedValue(undefined);
      (fs.readFile as any).mockRejectedValue(new Error('File not found'));
      (fs.writeFile as any).mockResolvedValue(undefined);

      await apiKeyManager.initialize();

      // First store a key
      await apiKeyManager.storeApiKey({
        provider: 'openai' as LLMProvider,
        apiKey: 'sk-test-key-123'
      });

      // Then retrieve it
      const retrievedKey = await apiKeyManager.getApiKey('openai');
      expect(retrievedKey).toBe('sk-test-key-123');
    });

    it('should return null for non-existent key', async () => {
      (fs.mkdir as any).mockResolvedValue(undefined);
      (fs.readFile as any).mockRejectedValue(new Error('File not found'));

      await apiKeyManager.initialize();

      const retrievedKey = await apiKeyManager.getApiKey('anthropic');
      expect(retrievedKey).toBeNull();
    });
  });

  describe('validateApiKey', () => {
    it('should validate OpenAI API key', async () => {
      const mockResponse = {
        ok: true,
        headers: {
          get: vi.fn().mockReturnValue('1000')
        }
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      (fs.mkdir as any).mockResolvedValue(undefined);
      (fs.readFile as any).mockRejectedValue(new Error('File not found'));

      await apiKeyManager.initialize();

      const result = await apiKeyManager.validateApiKey('openai', 'sk-test-key');
      
      expect(result.valid).toBe(true);
      expect(result.metadata?.rateLimitRemaining).toBe(1000);
      expect(fetch).toHaveBeenCalledWith('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': 'Bearer sk-test-key',
          'Content-Type': 'application/json'
        }
      });
    });

    it('should validate Anthropic API key', async () => {
      const mockResponse = {
        ok: true,
        headers: {
          get: vi.fn().mockReturnValue('500')
        }
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      (fs.mkdir as any).mockResolvedValue(undefined);
      (fs.readFile as any).mockRejectedValue(new Error('File not found'));

      await apiKeyManager.initialize();

      const result = await apiKeyManager.validateApiKey('anthropic', 'sk-ant-test-key');
      
      expect(result.valid).toBe(true);
      expect(result.metadata?.rateLimitRemaining).toBe(500);
      expect(fetch).toHaveBeenCalledWith('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': 'sk-ant-test-key',
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: expect.any(String)
      });
    });

    it('should handle invalid API key', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: vi.fn().mockResolvedValue({
          error: { message: 'Invalid API key' }
        })
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      (fs.mkdir as any).mockResolvedValue(undefined);
      (fs.readFile as any).mockRejectedValue(new Error('File not found'));

      await apiKeyManager.initialize();

      const result = await apiKeyManager.validateApiKey('openai', 'invalid-key');
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid API key');
    });
  });

  describe('listConfiguredProviders', () => {
    it('should list all configured providers', async () => {
      (fs.mkdir as any).mockResolvedValue(undefined);
      (fs.readFile as any).mockRejectedValue(new Error('File not found'));
      (fs.writeFile as any).mockResolvedValue(undefined);

      await apiKeyManager.initialize();

      await apiKeyManager.storeApiKey({
        provider: 'openai' as LLMProvider,
        apiKey: 'sk-openai-key'
      });

      await apiKeyManager.storeApiKey({
        provider: 'anthropic' as LLMProvider,
        apiKey: 'sk-ant-key'
      });

      const providers = await apiKeyManager.listConfiguredProviders();
      expect(providers).toContain('openai');
      expect(providers).toContain('anthropic');
      expect(providers).toHaveLength(2);
    });
  });

  describe('removeApiKey', () => {
    it('should remove an API key', async () => {
      (fs.mkdir as any).mockResolvedValue(undefined);
      (fs.readFile as any).mockRejectedValue(new Error('File not found'));
      (fs.writeFile as any).mockResolvedValue(undefined);

      await apiKeyManager.initialize();

      await apiKeyManager.storeApiKey({
        provider: 'openai' as LLMProvider,
        apiKey: 'sk-test-key'
      });

      let providers = await apiKeyManager.listConfiguredProviders();
      expect(providers).toContain('openai');

      await apiKeyManager.removeApiKey('openai');

      providers = await apiKeyManager.listConfiguredProviders();
      expect(providers).not.toContain('openai');
    });
  });

  describe('loadFromEnvironment', () => {
    it('should load API keys from environment variables', async () => {
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        OPENAI_API_KEY: 'sk-env-openai-key',
        ANTHROPIC_API_KEY: 'sk-env-anthropic-key'
      };

      (fs.mkdir as any).mockResolvedValue(undefined);
      (fs.readFile as any).mockRejectedValue(new Error('File not found'));
      (fs.writeFile as any).mockResolvedValue(undefined);

      await apiKeyManager.initialize();
      await apiKeyManager.loadFromEnvironment();

      const providers = await apiKeyManager.listConfiguredProviders();
      expect(providers).toContain('openai');
      expect(providers).toContain('anthropic');

      const openaiKey = await apiKeyManager.getApiKey('openai');
      const anthropicKey = await apiKeyManager.getApiKey('anthropic');
      
      expect(openaiKey).toBe('sk-env-openai-key');
      expect(anthropicKey).toBe('sk-env-anthropic-key');

      process.env = originalEnv;
    });
  });
});