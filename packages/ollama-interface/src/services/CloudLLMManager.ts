import { 
  LLMProvider, 
  CloudLLMConfig, 
  FallbackConfig,
  CloudLLMResponse,
  CloudGenerationOptions,
  AnalysisType,
  AnalysisResult,
  Requirement,
  ProjectEstimate
} from '@ai-toolkit/shared';
import { ApiKeyManager, createApiKeyManager } from '@ai-toolkit/secure-storage';
import { CloudLLMService } from '../interfaces/CloudLLMService.js';
import { CloudLLMServiceFactoryImpl } from './CloudLLMServiceFactory.js';
import { OllamaService } from '../interfaces/OllamaService.js';

/**
 * Manages cloud LLM services with secure API key storage and fallback support
 */
export class CloudLLMManager {
  private apiKeyManager: ApiKeyManager;
  private serviceFactory: CloudLLMServiceFactoryImpl;
  private services: Map<LLMProvider, CloudLLMService> = new Map();
  private ollamaService?: OllamaService;
  private fallbackConfig: FallbackConfig = {
    enabled: false,
    primaryProvider: 'ollama',
    fallbackProviders: ['ollama'],
    fallbackTriggers: {
      onError: true,
      onTimeout: true,
      onRateLimit: true
    }
  };
  private currentProvider: LLMProvider = 'ollama';

  constructor(ollamaService?: OllamaService) {
    this.apiKeyManager = createApiKeyManager();
    this.serviceFactory = CloudLLMServiceFactoryImpl.getInstance();
    this.ollamaService = ollamaService;
  }

  async initialize(): Promise<void> {
    await this.apiKeyManager.initialize();
    
    // Load API keys from environment if available
    await this.apiKeyManager.loadFromEnvironment();
    
    // Initialize configured services
    const configuredProviders = await this.apiKeyManager.listConfiguredProviders();
    for (const provider of configuredProviders) {
      if (provider !== 'ollama') {
        await this.initializeCloudService(provider);
      }
    }
  }

  async configureProvider(config: CloudLLMConfig): Promise<void> {
    // Store API key securely
    await this.apiKeyManager.storeApiKey({
      provider: config.provider,
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      metadata: {
        defaultModel: config.defaultModel,
        timeout: config.timeout,
        maxRetries: config.maxRetries
      }
    });

    // Initialize the service
    if (config.provider !== 'ollama') {
      await this.initializeCloudService(config.provider);
    }
  }

  async setFallbackConfig(config: FallbackConfig): Promise<void> {
    this.fallbackConfig = { ...config };
    this.currentProvider = config.primaryProvider;
  }

  async setPrimaryProvider(provider: LLMProvider): Promise<void> {
    this.currentProvider = provider;
    this.fallbackConfig.primaryProvider = provider;
  }

  async generateText(
    prompt: string,
    options?: CloudGenerationOptions
  ): Promise<CloudLLMResponse> {
    return await this.executeWithFallback(
      async (service, provider) => {
        if (provider === 'ollama' && this.ollamaService) {
          const response = await this.ollamaService.generateText(prompt, options);
          return {
            content: response,
            model: this.ollamaService.getCurrentModel() || 'unknown',
            provider: 'ollama',
            usage: {
              inputTokens: Math.ceil(prompt.length / 4),
              outputTokens: Math.ceil(response.length / 4),
              totalTokens: Math.ceil((prompt.length + response.length) / 4)
            },
            cost: { inputCost: 0, outputCost: 0, totalCost: 0, currency: 'USD' },
            finishReason: 'stop'
          };
        } else if (service) {
          return await service.generateText(prompt, options);
        }
        throw new Error(`No service available for provider: ${provider}`);
      }
    );
  }

  async *generateTextStream(
    prompt: string,
    options?: CloudGenerationOptions
  ): AsyncGenerator<{ content: string }, CloudLLMResponse, unknown> {
    const provider = this.currentProvider;
    
    if (provider === 'ollama' && this.ollamaService) {
      let fullContent = '';
      for await (const chunk of this.ollamaService.generateTextStream(prompt, options)) {
        fullContent += chunk;
        yield { content: chunk };
      }
      
      return {
        content: fullContent,
        model: this.ollamaService.getCurrentModel() || 'unknown',
        provider: 'ollama',
        usage: {
          inputTokens: Math.ceil(prompt.length / 4),
          outputTokens: Math.ceil(fullContent.length / 4),
          totalTokens: Math.ceil((prompt.length + fullContent.length) / 4)
        },
        cost: { inputCost: 0, outputCost: 0, totalCost: 0, currency: 'USD' },
        finishReason: 'stop'
      };
    } else {
      const service = this.services.get(provider);
      if (service) {
        return yield* service.generateTextStream(prompt, options);
      }
    }
    
    throw new Error(`No streaming service available for provider: ${provider}`);
  }

  async analyzeDocument(
    content: string,
    analysisType: AnalysisType,
    options?: CloudGenerationOptions
  ): Promise<AnalysisResult> {
    return await this.executeWithFallback(
      async (service, provider) => {
        if (provider === 'ollama' && this.ollamaService) {
          return await this.ollamaService.analyzeDocument(content, analysisType, options);
        } else if (service) {
          return await service.analyzeDocument(content, analysisType, options);
        }
        throw new Error(`No service available for provider: ${provider}`);
      }
    );
  }

  async extractRequirements(
    content: string,
    options?: CloudGenerationOptions
  ): Promise<Requirement[]> {
    return await this.executeWithFallback(
      async (service, provider) => {
        if (provider === 'ollama' && this.ollamaService) {
          return await this.ollamaService.extractRequirements(content, options);
        } else if (service) {
          return await service.extractRequirements(content, options);
        }
        throw new Error(`No service available for provider: ${provider}`);
      }
    );
  }

  async generateEstimate(
    requirements: Requirement[],
    options?: CloudGenerationOptions
  ): Promise<ProjectEstimate> {
    return await this.executeWithFallback(
      async (service, provider) => {
        if (provider === 'ollama' && this.ollamaService) {
          return await this.ollamaService.generateEstimate(requirements, options);
        } else if (service) {
          return await service.generateEstimate(requirements, options);
        }
        throw new Error(`No service available for provider: ${provider}`);
      }
    );
  }

  async summarizeContent(
    content: string,
    length: 'short' | 'medium' | 'long',
    options?: CloudGenerationOptions
  ): Promise<string> {
    const response = await this.executeWithFallback(
      async (service, provider) => {
        if (provider === 'ollama' && this.ollamaService) {
          return { content: await this.ollamaService.summarizeContent(content, length, options) };
        } else if (service) {
          return { content: await service.summarizeContent(content, length, options) };
        }
        throw new Error(`No service available for provider: ${provider}`);
      }
    );
    
    return response.content;
  }

  async validateApiKey(provider: LLMProvider): Promise<boolean> {
    const result = await this.apiKeyManager.validateApiKey(provider);
    return result.valid;
  }

  async getProviderStatus(): Promise<Record<LLMProvider, { connected: boolean; available: boolean }>> {
    const status: Record<LLMProvider, { connected: boolean; available: boolean }> = {
      ollama: { connected: false, available: true },
      openai: { connected: false, available: false },
      anthropic: { connected: false, available: false }
    };

    // Check Ollama
    if (this.ollamaService) {
      status.ollama.connected = this.ollamaService.isConnected();
    }

    // Check cloud providers
    for (const provider of ['openai', 'anthropic'] as const) {
      const hasKey = await this.apiKeyManager.hasApiKey(provider);
      status[provider].available = hasKey;
      
      if (hasKey) {
        const validationResult = await this.apiKeyManager.validateApiKey(provider);
        status[provider].connected = validationResult.valid;
      }
    }

    return status;
  }

  async getCurrentProvider(): Promise<LLMProvider> {
    return this.currentProvider;
  }

  async getUsageStats(provider: LLMProvider) {
    return await this.apiKeyManager.getUsageStats(provider);
  }

  async removeProvider(provider: LLMProvider): Promise<void> {
    await this.apiKeyManager.removeApiKey(provider);
    this.services.delete(provider);
  }

  private async initializeCloudService(provider: LLMProvider): Promise<void> {
    if (provider === 'ollama') return;

    const service = this.serviceFactory.createService(provider);
    const apiKeyConfig = await this.apiKeyManager.getApiKeyConfig(provider);
    
    if (apiKeyConfig) {
      const config: CloudLLMConfig = {
        provider,
        apiKey: apiKeyConfig.apiKey,
        baseUrl: apiKeyConfig.baseUrl,
        defaultModel: apiKeyConfig.metadata?.defaultModel || (provider === 'openai' ? 'gpt-4o-mini' : 'claude-3-5-sonnet-20241022'),
        timeout: apiKeyConfig.metadata?.timeout || 30000,
        maxRetries: apiKeyConfig.metadata?.maxRetries || 3
      };

      service.configure(config);
      this.services.set(provider, service);
    }
  }

  private async executeWithFallback<T>(
    operation: (service: CloudLLMService | undefined, provider: LLMProvider) => Promise<T>
  ): Promise<T> {
    const providers = this.fallbackConfig.enabled 
      ? [this.currentProvider, ...this.fallbackConfig.fallbackProviders]
      : [this.currentProvider];

    let lastError: Error | undefined;

    for (const provider of providers) {
      try {
        const service = provider === 'ollama' ? undefined : this.services.get(provider);
        const result = await operation(service, provider);
        
        // Update usage stats for successful requests
        if (provider !== 'ollama') {
          await this.apiKeyManager.updateUsageStats(provider, false);
        }
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        // Check if this error should trigger fallback
        if (!this.shouldFallback(error as Error)) {
          throw error;
        }
        
        // Update usage stats for rate limit hits
        if (provider !== 'ollama' && this.isRateLimitError(error as Error)) {
          await this.apiKeyManager.updateUsageStats(provider, true);
        }
        
        console.warn(`Provider ${provider} failed, trying next fallback:`, error);
      }
    }

    throw lastError || new Error('All providers failed');
  }

  private shouldFallback(error: Error): boolean {
    if (!this.fallbackConfig.enabled) return false;

    const errorMessage = error.message.toLowerCase();
    
    return (
      (this.fallbackConfig.fallbackTriggers.onError) ||
      (this.fallbackConfig.fallbackTriggers.onTimeout && errorMessage.includes('timeout')) ||
      (this.fallbackConfig.fallbackTriggers.onRateLimit && this.isRateLimitError(error))
    );
  }

  private isRateLimitError(error: Error): boolean {
    const errorMessage = error.message.toLowerCase();
    return errorMessage.includes('rate limit') || 
           errorMessage.includes('429') ||
           errorMessage.includes('quota exceeded');
  }
}