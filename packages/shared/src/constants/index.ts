export const DEFAULT_TIMEOUT = 30000; // 30 seconds
export const MAX_RETRIES = 3;
export const DEFAULT_OLLAMA_HOST = 'localhost';
export const DEFAULT_OLLAMA_PORT = 11434;

export const SUPPORTED_DOCUMENT_TYPES = [
  'pdf',
  'docx',
  'txt',
  'md',
  'html',
  'xlsx',
  'csv'
] as const;

export const ANALYSIS_TYPES = [
  'requirements',
  'summary',
  'structure',
  'estimation',
  'codebase'
] as const;

export const PRIORITY_LEVELS = [
  'low',
  'medium',
  'high'
] as const;

export const WORKFLOW_STATUSES = [
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled'
] as const;

export const MODEL_CAPABILITIES = [
  'text-generation',
  'code-analysis',
  'document-analysis',
  'summarization',
  'translation'
] as const;

export const COMPLEXITY_FACTORS = {
  SIMPLE: 1,
  MODERATE: 2,
  COMPLEX: 3,
  VERY_COMPLEX: 5
} as const;

export const DEFAULT_HOURLY_RATE = 100;
export const DEFAULT_OVERHEAD = 0.3; // 30%
export const DEFAULT_PROFIT_MARGIN = 0.2; // 20%