import { AnalysisType } from './common.js';
import { AnalysisResult } from './analysis.js';
import { Requirement } from './document.js';
import { ProjectEstimate } from './estimation.js';

export interface Model {
  name: string;
  size: string;
  digest: string;
  modified: Date;
  capabilities: ModelCapability[];
}

export type ModelCapability = 
  | 'text-generation'
  | 'code-analysis'
  | 'document-analysis'
  | 'summarization'
  | 'translation';

export interface GenerationOptions {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxTokens?: number;
  stop?: string[];
  stream?: boolean;
}

export interface OllamaResponse {
  model: string;
  response: string;
  done: boolean;
  context?: number[];
  totalDuration?: number;
  loadDuration?: number;
  promptEvalCount?: number;
  promptEvalDuration?: number;
  evalCount?: number;
  evalDuration?: number;
}

export interface ConnectionConfig {
  host: string;
  port: number;
  timeout: number;
  retries: number;
}

export interface ModelInfo {
  name: string;
  details: {
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
  size: number;
  digest: string;
  modified_at: string;
}