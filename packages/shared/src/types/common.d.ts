/**
 * Common types and interfaces used across all packages
 */
export type DocumentType = "pdf" | "docx" | "txt" | "md" | "html" | "xlsx" | "csv";
export type AnalysisType = "requirements" | "summary" | "structure" | "estimation" | "codebase";
export type SummaryLength = "short" | "medium" | "long";
export type RequirementType = "functional" | "non-functional";
export type Priority = "critical" | "high" | "medium" | "low";
export type WorkflowStatus = "pending" | "running" | "completed" | "failed" | "cancelled";
export type DocumentStatus = "uploading" | "processing" | "completed" | "failed" | "queued";
export interface BaseEntity {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface ProcessingOptions {
    timeout?: number;
    retries?: number;
    priority?: Priority;
}
export interface ErrorInfo {
    code: string;
    message: string;
    details?: any;
    recoverable: boolean;
    suggestions: string[];
    timestamp: Date;
}
//# sourceMappingURL=common.d.ts.map