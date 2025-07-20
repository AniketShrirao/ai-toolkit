import { Model, GenerationOptions, ConnectionConfig, ModelInfo, AnalysisType, AnalysisResult, Requirement, ProjectEstimate } from '@ai-toolkit/shared';
import { OllamaService } from '../interfaces/OllamaService.js';
export declare class OllamaServiceImpl implements OllamaService {
    private config;
    private connected;
    private currentModel;
    private connectionPool;
    private readonly maxPoolSize;
    constructor(config?: Partial<ConnectionConfig>);
    private get baseUrl();
    private makeRequest;
    connect(config?: Partial<ConnectionConfig>): Promise<boolean>;
    disconnect(): Promise<void>;
    isConnected(): boolean;
    getConnectionStatus(): Promise<{
        connected: boolean;
        version?: string;
        models?: number;
    }>;
    getAvailableModels(): Promise<Model[]>;
    private inferCapabilities;
    private formatBytes;
    getModelInfo(modelName: string): Promise<ModelInfo>;
    loadModel(modelName: string): Promise<void>;
    unloadModel(modelName: string): Promise<void>;
    getCurrentModel(): string | null;
    switchModel(modelName: string): Promise<void>;
    healthCheck(): Promise<boolean>;
    getSystemInfo(): Promise<{
        version: string;
        uptime: number;
        memory: number;
        gpu?: boolean;
    }>;
    generateText(prompt: string, options?: GenerationOptions): Promise<string>;
    generateTextStream(prompt: string, options?: GenerationOptions): AsyncGenerator<string, void, unknown>;
    analyzeDocument(content: string, analysisType: AnalysisType, options?: GenerationOptions): Promise<AnalysisResult>;
    extractRequirements(content: string, options?: GenerationOptions): Promise<Requirement[]>;
    generateEstimate(requirements: Requirement[], options?: GenerationOptions): Promise<ProjectEstimate>;
    summarizeContent(content: string, length: 'short' | 'medium' | 'long', options?: GenerationOptions): Promise<string>;
    retry<T>(operation: () => Promise<T>, maxRetries?: number): Promise<T>;
    updateConfig(config: Partial<ConnectionConfig>): void;
    getConfig(): ConnectionConfig;
}
//# sourceMappingURL=OllamaServiceImpl.d.ts.map