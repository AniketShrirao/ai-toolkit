import {
  Model,
  GenerationOptions,
  OllamaResponse,
  ConnectionConfig,
  ModelInfo,
  AnalysisType,
  AnalysisResult,
  Requirement,
  ProjectEstimate
} from '@ai-toolkit/shared';

export interface OllamaService {
  // Connection management
  connect(config?: Partial<ConnectionConfig>): Promise<boolean>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getConnectionStatus(): Promise<{
    connected: boolean;
    version?: string;
    models?: number;
  }>;

  // Model operations
  getAvailableModels(): Promise<Model[]>;
  getModelInfo(modelName: string): Promise<ModelInfo>;
  loadModel(modelName: string): Promise<void>;
  unloadModel(modelName: string): Promise<void>;
  getCurrentModel(): string | null;
  switchModel(modelName: string): Promise<void>;

  // Health checks
  healthCheck(): Promise<boolean>;
  getSystemInfo(): Promise<{
    version: string;
    uptime: number;
    memory: number;
    gpu?: boolean;
  }>;

  // AI operations
  generateText(
    prompt: string,
    options?: GenerationOptions
  ): Promise<string>;

  generateTextStream(
    prompt: string,
    options?: GenerationOptions
  ): AsyncGenerator<string, void, unknown>;

  analyzeDocument(
    content: string,
    analysisType: AnalysisType,
    options?: GenerationOptions
  ): Promise<AnalysisResult>;

  extractRequirements(
    content: string,
    options?: GenerationOptions
  ): Promise<Requirement[]>;

  generateEstimate(
    requirements: Requirement[],
    options?: GenerationOptions
  ): Promise<ProjectEstimate>;

  summarizeContent(
    content: string,
    length: 'short' | 'medium' | 'long',
    options?: GenerationOptions
  ): Promise<string>;

  // Error handling and recovery
  retry<T>(
    operation: () => Promise<T>,
    maxRetries?: number
  ): Promise<T>;

  // Configuration
  updateConfig(config: Partial<ConnectionConfig>): void;
  getConfig(): ConnectionConfig;
}