import { LLMProvider } from '@ai-toolkit/shared';
import { CloudLLMService, CloudLLMServiceFactory } from '../interfaces/CloudLLMService.js';
import { OpenAIService } from './OpenAIService.js';
import { AnthropicService } from './AnthropicService.js';

/**
 * Factory for creating cloud LLM service instances
 */
export class CloudLLMServiceFactoryImpl implements CloudLLMServiceFactory {
  private static instance: CloudLLMServiceFactoryImpl;
  private services: Map<LLMProvider, CloudLLMService> = new Map();

  private constructor() {}

  static getInstance(): CloudLLMServiceFactoryImpl {
    if (!CloudLLMServiceFactoryImpl.instance) {
      CloudLLMServiceFactoryImpl.instance = new CloudLLMServiceFactoryImpl();
    }
    return CloudLLMServiceFactoryImpl.instance;
  }

  createService(provider: LLMProvider): CloudLLMService {
    // Return existing instance if available (singleton pattern per provider)
    if (this.services.has(provider)) {
      return this.services.get(provider)!;
    }

    let service: CloudLLMService;

    switch (provider) {
      case 'openai':
        service = new OpenAIService();
        break;
      case 'anthropic':
        service = new AnthropicService();
        break;
      case 'ollama':
        throw new Error('Ollama service should be created through OllamaService, not CloudLLMService');
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    this.services.set(provider, service);
    return service;
  }

  getSupportedProviders(): LLMProvider[] {
    return ['openai', 'anthropic'];
  }

  /**
   * Clear all cached service instances
   */
  clearCache(): void {
    this.services.clear();
  }

  /**
   * Get all active service instances
   */
  getActiveServices(): Map<LLMProvider, CloudLLMService> {
    return new Map(this.services);
  }
}