import { describe, it, expect, beforeEach } from 'vitest';
import { CloudLLMServiceFactoryImpl } from '../CloudLLMServiceFactory.js';
import { OpenAIService } from '../OpenAIService.js';
import { AnthropicService } from '../AnthropicService.js';

describe('CloudLLMServiceFactory', () => {
  let factory: CloudLLMServiceFactoryImpl;

  beforeEach(() => {
    factory = CloudLLMServiceFactoryImpl.getInstance();
    factory.clearCache();
  });

  it('should create OpenAI service', () => {
    const service = factory.createService('openai');
    expect(service).toBeInstanceOf(OpenAIService);
    expect(service.getProvider()).toBe('openai');
  });

  it('should create Anthropic service', () => {
    const service = factory.createService('anthropic');
    expect(service).toBeInstanceOf(AnthropicService);
    expect(service.getProvider()).toBe('anthropic');
  });

  it('should return same instance for same provider (singleton)', () => {
    const service1 = factory.createService('openai');
    const service2 = factory.createService('openai');
    expect(service1).toBe(service2);
  });

  it('should throw error for unsupported provider', () => {
    expect(() => factory.createService('ollama' as any)).toThrow('Ollama service should be created through OllamaService');
    expect(() => factory.createService('unsupported' as any)).toThrow('Unsupported provider: unsupported');
  });

  it('should return supported providers', () => {
    const providers = factory.getSupportedProviders();
    expect(providers).toEqual(['openai', 'anthropic']);
  });

  it('should clear cache', () => {
    factory.createService('openai');
    expect(factory.getActiveServices().size).toBe(1);
    
    factory.clearCache();
    expect(factory.getActiveServices().size).toBe(0);
  });
});