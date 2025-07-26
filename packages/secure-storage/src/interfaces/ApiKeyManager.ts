import { LLMProvider } from '@ai-toolkit/shared';

export interface ApiKeyConfig {
  provider: LLMProvider;
  apiKey: string;
  baseUrl?: string;
  metadata?: Record<string, any>;
}

export interface ApiKeyValidationResult {
  valid: boolean;
  error?: string;
  metadata?: {
    rateLimitRemaining?: number;
    accountInfo?: any;
  };
}

export interface ApiKeyManager {
  /**
   * Store an API key securely
   */
  storeApiKey(config: ApiKeyConfig): Promise<void>;

  /**
   * Retrieve an API key
   */
  getApiKey(provider: LLMProvider): Promise<string | null>;

  /**
   * Get full API key configuration
   */
  getApiKeyConfig(provider: LLMProvider): Promise<ApiKeyConfig | null>;

  /**
   * Remove an API key
   */
  removeApiKey(provider: LLMProvider): Promise<void>;

  /**
   * List all configured providers
   */
  listConfiguredProviders(): Promise<LLMProvider[]>;

  /**
   * Validate an API key by making a test request
   */
  validateApiKey(provider: LLMProvider, apiKey?: string): Promise<ApiKeyValidationResult>;

  /**
   * Check if API key exists for provider
   */
  hasApiKey(provider: LLMProvider): Promise<boolean>;

  /**
   * Load API keys from environment variables
   */
  loadFromEnvironment(): Promise<void>;

  /**
   * Export API keys to environment format (for backup/migration)
   */
  exportToEnvironment(): Promise<Record<string, string>>;

  /**
   * Clear all stored API keys
   */
  clearAllApiKeys(): Promise<void>;

  /**
   * Get API key usage statistics
   */
  getUsageStats(provider: LLMProvider): Promise<{
    totalRequests: number;
    lastUsed: Date | null;
    rateLimitHits: number;
  }>;
}