export declare const DEFAULT_TIMEOUT = 30000;
export declare const MAX_RETRIES = 3;
export declare const DEFAULT_OLLAMA_HOST = "localhost";
export declare const DEFAULT_OLLAMA_PORT = 11434;
export declare const SUPPORTED_DOCUMENT_TYPES: readonly ["pdf", "docx", "txt", "md", "html", "xlsx", "csv"];
export declare const ANALYSIS_TYPES: readonly ["requirements", "summary", "structure", "estimation", "codebase"];
export declare const PRIORITY_LEVELS: readonly ["low", "medium", "high"];
export declare const WORKFLOW_STATUSES: readonly ["pending", "running", "completed", "failed", "cancelled"];
export declare const MODEL_CAPABILITIES: readonly ["text-generation", "code-analysis", "document-analysis", "summarization", "translation"];
export declare const COMPLEXITY_FACTORS: {
    readonly SIMPLE: 1;
    readonly MODERATE: 2;
    readonly COMPLEX: 3;
    readonly VERY_COMPLEX: 5;
};
export declare const DEFAULT_HOURLY_RATE = 100;
export declare const DEFAULT_OVERHEAD = 0.3;
export declare const DEFAULT_PROFIT_MARGIN = 0.2;
//# sourceMappingURL=index.d.ts.map