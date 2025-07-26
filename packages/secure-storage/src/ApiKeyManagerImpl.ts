import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import { LLMProvider } from '@ai-toolkit/shared';
import { ApiKeyManager, ApiKeyConfig, ApiKeyValidationResult } from './interfaces/ApiKeyManager.js';
import { SecureStorageManagerImpl } from './SecureStorageManagerImpl.js';

interface StoredApiKeyData {
  provider: LLMProvider;
  encryptedApiKey: string;
  baseUrl?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  lastUsed?: Date;
  usageStats: {
    totalRequests: number;
    rateLimitHits: number;
  };
}

export class ApiKeyManagerImpl implements ApiKeyManager {
  private secureStorage: SecureStorageManagerImpl;
  private configPath: string;
  private apiKeys: Map<LLMProvider, StoredApiKeyData> = new Map();
  private initialized = false;

  constructor(secureStorage?: SecureStorageManagerImpl) {
    this.secureStorage = secureStorage || new SecureStorageManagerImpl();
    this.configPath = path.join(os.homedir(), '.ai-toolkit', 'api-keys.json');
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Initialize secure storage if not already done
    if (!this.secureStorage.getConfig) {
      await this.secureStorage.initialize({
        baseDirectory: path.join(os.homedir(), '.ai-toolkit', 'secure'),
        encryptionEnabled: true,
        encryptionKey: this.getOrCreateEncryptionKey(),
        filePermissions: {
          files: '600',
          directories: '700'
        },
        tempCleanupInterval: 3600000, // 1 hour
        maxTempFileAge: 3600000 // 1 hour
      });
    }

    await this.loadApiKeys();
    this.initialized = true;
  }

  async storeApiKey(config: ApiKeyConfig): Promise<void> {
    await this.ensureInitialized();

    const encryptedApiKey = await this.secureStorage.encryptData(config.apiKey);
    
    const storedData: StoredApiKeyData = {
      provider: config.provider,
      encryptedApiKey: encryptedApiKey.toString('base64'),
      baseUrl: config.baseUrl,
      metadata: config.metadata,
      createdAt: new Date(),
      usageStats: {
        totalRequests: 0,
        rateLimitHits: 0
      }
    };

    this.apiKeys.set(config.provider, storedData);
    await this.saveApiKeys();
  }

  async getApiKey(provider: LLMProvider): Promise<string | null> {
    await this.ensureInitialized();

    const storedData = this.apiKeys.get(provider);
    if (!storedData) {
      return null;
    }

    try {
      const encryptedBuffer = Buffer.from(storedData.encryptedApiKey, 'base64');
      const decryptedBuffer = await this.secureStorage.decryptData(encryptedBuffer);
      
      // Update last used timestamp
      storedData.lastUsed = new Date();
      await this.saveApiKeys();
      
      return decryptedBuffer.toString('utf-8');
    } catch (error) {
      console.error(`Failed to decrypt API key for ${provider}:`, error);
      return null;
    }
  }

  async getApiKeyConfig(provider: LLMProvider): Promise<ApiKeyConfig | null> {
    await this.ensureInitialized();

    const apiKey = await this.getApiKey(provider);
    if (!apiKey) {
      return null;
    }

    const storedData = this.apiKeys.get(provider)!;
    return {
      provider,
      apiKey,
      baseUrl: storedData.baseUrl,
      metadata: storedData.metadata
    };
  }

  async removeApiKey(provider: LLMProvider): Promise<void> {
    await this.ensureInitialized();

    this.apiKeys.delete(provider);
    await this.saveApiKeys();
  }

  async listConfiguredProviders(): Promise<LLMProvider[]> {
    await this.ensureInitialized();
    return Array.from(this.apiKeys.keys());
  }

  async validateApiKey(provider: LLMProvider, apiKey?: string): Promise<ApiKeyValidationResult> {
    await this.ensureInitialized();

    const keyToValidate = apiKey || await this.getApiKey(provider);
    if (!keyToValidate) {
      return {
        valid: false,
        error: 'API key not found'
      };
    }

    try {
      switch (provider) {
        case 'openai':
          return await this.validateOpenAIKey(keyToValidate);
        case 'anthropic':
          return await this.validateAnthropicKey(keyToValidate);
        case 'ollama':
          return { valid: true }; // Ollama doesn't require API keys
        default:
          return {
            valid: false,
            error: `Unsupported provider: ${provider}`
          };
      }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown validation error'
      };
    }
  }

  async hasApiKey(provider: LLMProvider): Promise<boolean> {
    await this.ensureInitialized();
    return this.apiKeys.has(provider);
  }

  async loadFromEnvironment(): Promise<void> {
    await this.ensureInitialized();

    const envMappings = {
      openai: 'OPENAI_API_KEY',
      anthropic: 'ANTHROPIC_API_KEY'
    };

    for (const [provider, envVar] of Object.entries(envMappings)) {
      const apiKey = process.env[envVar];
      if (apiKey) {
        await this.storeApiKey({
          provider: provider as LLMProvider,
          apiKey,
          metadata: { source: 'environment' }
        });
      }
    }
  }

  async exportToEnvironment(): Promise<Record<string, string>> {
    await this.ensureInitialized();

    const envVars: Record<string, string> = {};
    const envMappings = {
      openai: 'OPENAI_API_KEY',
      anthropic: 'ANTHROPIC_API_KEY'
    };

    for (const [provider, envVar] of Object.entries(envMappings)) {
      const apiKey = await this.getApiKey(provider as LLMProvider);
      if (apiKey) {
        envVars[envVar] = apiKey;
      }
    }

    return envVars;
  }

  async clearAllApiKeys(): Promise<void> {
    await this.ensureInitialized();

    this.apiKeys.clear();
    await this.saveApiKeys();
  }

  async getUsageStats(provider: LLMProvider): Promise<{
    totalRequests: number;
    lastUsed: Date | null;
    rateLimitHits: number;
  }> {
    await this.ensureInitialized();

    const storedData = this.apiKeys.get(provider);
    if (!storedData) {
      return {
        totalRequests: 0,
        lastUsed: null,
        rateLimitHits: 0
      };
    }

    return {
      totalRequests: storedData.usageStats.totalRequests,
      lastUsed: storedData.lastUsed || null,
      rateLimitHits: storedData.usageStats.rateLimitHits
    };
  }

  /**
   * Update usage statistics for a provider
   */
  async updateUsageStats(provider: LLMProvider, rateLimitHit: boolean = false): Promise<void> {
    await this.ensureInitialized();

    const storedData = this.apiKeys.get(provider);
    if (storedData) {
      storedData.usageStats.totalRequests++;
      if (rateLimitHit) {
        storedData.usageStats.rateLimitHits++;
      }
      storedData.lastUsed = new Date();
      await this.saveApiKeys();
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  private async loadApiKeys(): Promise<void> {
    try {
      // Ensure config directory exists
      const configDir = path.dirname(this.configPath);
      await fs.mkdir(configDir, { recursive: true, mode: 0o700 });

      // Try to read existing config
      const configData = await fs.readFile(this.configPath, 'utf-8');
      const parsedData = JSON.parse(configData);

      for (const [provider, data] of Object.entries(parsedData)) {
        this.apiKeys.set(provider as LLMProvider, {
          ...data as StoredApiKeyData,
          createdAt: new Date((data as any).createdAt),
          lastUsed: (data as any).lastUsed ? new Date((data as any).lastUsed) : undefined
        });
      }
    } catch (error) {
      // Config file doesn't exist or is corrupted, start fresh
      this.apiKeys.clear();
    }
  }

  private async saveApiKeys(): Promise<void> {
    const configDir = path.dirname(this.configPath);
    await fs.mkdir(configDir, { recursive: true, mode: 0o700 });

    const dataToSave: Record<string, any> = {};
    for (const [provider, data] of this.apiKeys.entries()) {
      dataToSave[provider] = {
        ...data,
        createdAt: data.createdAt.toISOString(),
        lastUsed: data.lastUsed?.toISOString()
      };
    }

    await fs.writeFile(this.configPath, JSON.stringify(dataToSave, null, 2), { mode: 0o600 });
  }

  private getOrCreateEncryptionKey(): string {
    const keyPath = path.join(os.homedir(), '.ai-toolkit', 'encryption.key');
    
    try {
      return require('fs').readFileSync(keyPath, 'utf-8').trim();
    } catch (error) {
      // Generate new key
      const newKey = this.secureStorage.generateEncryptionKey();
      
      // Ensure directory exists
      const keyDir = path.dirname(keyPath);
      require('fs').mkdirSync(keyDir, { recursive: true, mode: 0o700 });
      
      // Save key with restricted permissions
      require('fs').writeFileSync(keyPath, newKey, { mode: 0o600 });
      
      return newKey;
    }
  }

  private async validateOpenAIKey(apiKey: string): Promise<ApiKeyValidationResult> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const rateLimitRemaining = response.headers.get('x-ratelimit-remaining-requests');
        return {
          valid: true,
          metadata: {
            rateLimitRemaining: rateLimitRemaining ? parseInt(rateLimitRemaining) : undefined
          }
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          valid: false,
          error: errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  private async validateAnthropicKey(apiKey: string): Promise<ApiKeyValidationResult> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'test' }]
        })
      });

      if (response.ok || response.status === 400) {
        // 400 is expected for this minimal test request
        const rateLimitRemaining = response.headers.get('anthropic-ratelimit-requests-remaining');
        return {
          valid: true,
          metadata: {
            rateLimitRemaining: rateLimitRemaining ? parseInt(rateLimitRemaining) : undefined
          }
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          valid: false,
          error: errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }
}