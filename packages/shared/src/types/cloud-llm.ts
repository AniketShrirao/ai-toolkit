/**
 * Cloud LLM service types and interfaces
 */

import { GenerationOptions, ModelCapability } from './ollama.js';
import { AnalysisType } from './common.js';
import { AnalysisResult } from './analysis.js';
import { Requirement } from './document.js';
import { ProjectEstimate } from './estimation.js';

export type LLMProvider = 'ollama' | 'openai' | 'anthropic';

export interface CloudModel {
  id: string;
  name: string;
  provider: LLMProvider;
  capabilities: ModelCapability[];
  contextLength: number;
  costPer1kTokens: {
    input: number;
    output: number;
  };
  description?: string;
}

export interface CloudGenerationOptions extends GenerationOptions {
  model?: string;
  systemPrompt?: string;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface CostEstimate {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  currency: string;
}

export interface CloudLLMResponse {
  content: string;
  model: string;
  provider: LLMProvider;
  usage: TokenUsage;
  cost: CostEstimate;
  finishReason: 'stop' | 'length' | 'content_filter' | 'function_call';
  requestId?: string;
}

export interface CloudLLMConfig {
  provider: LLMProvider;
  apiKey: string;
  baseUrl?: string;
  defaultModel: string;
  timeout?: number;
  maxRetries?: number;
}

export interface ProviderCapabilities {
  streaming: boolean;
  functionCalling: boolean;
  imageInput: boolean;
  maxContextLength: number;
  supportedModels: CloudModel[];
}

export interface FallbackConfig {
  enabled: boolean;
  primaryProvider: LLMProvider;
  fallbackProviders: LLMProvider[];
  fallbackTriggers: {
    onError: boolean;
    onTimeout: boolean;
    onRateLimit: boolean;
  };
}