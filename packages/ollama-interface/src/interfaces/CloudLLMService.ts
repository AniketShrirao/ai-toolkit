import {
  CloudModel,
  CloudGenerationOptions,
  CloudLLMResponse,
  CloudLLMConfig,
  ProviderCapabilities,
  LLMProvider,
  TokenUsage,
  CostEstimate,
  AnalysisType,
  AnalysisResult,
  Requirement,
  ProjectEstimate
} from '@ai-toolkit/shared';

/**
 * Base interface for all cloud LLM services
 * Uses adapter pattern to provide consistent interface across providers
 */
export interface CloudLLMService {
  // Provider identification
  getProvider(): LLMProvider;
  getCapabilities(): ProviderCapabilities;

  // Connection and configuration
  configure(config: CloudLLMConfig): void;
  isConfigured(): boolean;
  validateConfig(config: CloudLLMConfig): Promise<boolean>;

  // Model operations
  getAvailableModels(): Promise<CloudModel[]>;
  getModel(modelId: string): Promise<CloudModel>;
  setDefaultModel(modelId: string): void;
  getDefaultModel(): string;

  // Text generation
  generateText(
    prompt: string,
    options?: CloudGenerationOptions
  ): Promise<CloudLLMResponse>;

  generateTextStream(
    prompt: string,
    options?: CloudGenerationOptions
  ): AsyncGenerator<{ content: string; usage?: TokenUsage }, CloudLLMResponse, unknown>;

  // AI operations (compatible with OllamaService)
  analyzeDocument(
    content: string,
    analysisType: AnalysisType,
    options?: CloudGenerationOptions
  ): Promise<AnalysisResult>;

  extractRequirements(
    content: string,
    options?: CloudGenerationOptions
  ): Promise<Requirement[]>;

  generateEstimate(
    requirements: Requirement[],
    options?: CloudGenerationOptions
  ): Promise<ProjectEstimate>;

  summarizeContent(
    content: string,
    length: 'short' | 'medium' | 'long',
    options?: CloudGenerationOptions
  ): Promise<string>;

  // Cost and usage tracking
  estimateTokens(text: string): number;
  estimateCost(inputTokens: number, outputTokens: number, model?: string): CostEstimate;
  getUsageStats(): Promise<{
    totalRequests: number;
    totalTokens: TokenUsage;
    totalCost: CostEstimate;
    requestsToday: number;
    costToday: CostEstimate;
  }>;

  // Health and monitoring
  healthCheck(): Promise<boolean>;
  getRateLimitStatus(): Promise<{
    remaining: number;
    resetTime: Date;
    limit: number;
  }>;

  // Error handling
  retry<T>(
    operation: () => Promise<T>,
    maxRetries?: number
  ): Promise<T>;
}

/**
 * Factory interface for creating cloud LLM service instances
 */
export interface CloudLLMServiceFactory {
  createService(provider: LLMProvider): CloudLLMService;
  getSupportedProviders(): LLMProvider[];
}