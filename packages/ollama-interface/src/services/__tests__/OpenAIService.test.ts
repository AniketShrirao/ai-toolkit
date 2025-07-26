import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OpenAIService } from '../OpenAIService.js';
import { CloudLLMConfig } from '@ai-toolkit/shared';

// Mock fetch globally
global.fetch = vi.fn();

describe('OpenAIService', () => {
  let service: OpenAIService;
  let mockConfig: CloudLLMConfig;

  beforeEach(() => {
    service = new OpenAIService();
    mockConfig = {
      provider: 'openai',
      apiKey: 'test-api-key',
      defaultModel: 'gpt-4o-mini',
      timeout: 30000,
      maxRetries: 3
    };
    vi.clearAllMocks();
  });

  it('should initialize with correct provider', () => {
    expect(service.getProvider()).toBe('openai');
  });

  it('should return capabilities', () => {
    const capabilities = service.getCapabilities();
    expect(capabilities.streaming).toBe(true);
    expect(capabilities.functionCalling).toBe(true);
    expect(capabilities.imageInput).toBe(true);
    expect(capabilities.maxContextLength).toBe(128000);
    expect(capabilities.supportedModels.length).toBeGreaterThan(0);
  });

  it('should configure service', () => {
    expect(service.isConfigured()).toBe(false);
    service.configure(mockConfig);
    expect(service.isConfigured()).toBe(true);
  });

  it('should get available models', async () => {
    const models = await service.getAvailableModels();
    expect(models.length).toBeGreaterThan(0);
    expect(models[0]).toHaveProperty('id');
    expect(models[0]).toHaveProperty('name');
    expect(models[0]).toHaveProperty('provider', 'openai');
  });

  it('should set and get default model', () => {
    service.setDefaultModel('gpt-4o');
    expect(service.getDefaultModel()).toBe('gpt-4o');
  });

  it('should estimate tokens', () => {
    const text = 'Hello world';
    const tokens = service.estimateTokens(text);
    expect(tokens).toBeGreaterThan(0);
    expect(typeof tokens).toBe('number');
  });

  it('should estimate cost', () => {
    const cost = service.estimateCost(1000, 500, 'gpt-4o-mini');
    expect(cost.inputCost).toBeGreaterThan(0);
    expect(cost.outputCost).toBeGreaterThan(0);
    expect(cost.totalCost).toBe(cost.inputCost + cost.outputCost);
    expect(cost.currency).toBe('USD');
  });

  it('should validate config', async () => {
    const mockResponse = { ok: true };
    (global.fetch as any).mockResolvedValueOnce(mockResponse);

    const isValid = await service.validateConfig(mockConfig);
    expect(isValid).toBe(true);
    expect(fetch).toHaveBeenCalledWith('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': 'Bearer test-api-key',
        'Content-Type': 'application/json'
      }
    });
  });

  it('should perform health check', async () => {
    service.configure(mockConfig);
    const mockResponse = { ok: true };
    (global.fetch as any).mockResolvedValueOnce(mockResponse);

    const isHealthy = await service.healthCheck();
    expect(isHealthy).toBe(true);
  });

  it('should throw error when not configured', async () => {
    await expect(service.generateText('test')).rejects.toThrow('OpenAI service not configured');
  });
});