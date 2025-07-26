export interface DocumentProcessingIssue {
    type: 'EXTRACTION_FAILURE' | 'INCOMPLETE_SUMMARY' | 'EMPTY_FIELD' | 'INVALID_DATA' | 'MISSING_METADATA';
    severity: 'low' | 'medium' | 'high' | 'critical';
    documentPath: string;
    field?: string;
    message: string;
    expectedValue?: any;
    actualValue?: any;
}
export interface VerifiableDocument {
    id: string;
    originalPath: string;
    type: string;
    content?: {
        text?: string;
        metadata?: Record<string, any>;
        extractedData?: Record<string, any>;
    };
    analysis?: {
        summary?: string;
        keyPoints?: string[];
        actionItems?: string[];
        requirements?: any[];
    };
    status: 'pending' | 'processing' | 'completed' | 'failed';
    createdAt: Date;
    processedAt?: Date;
    error?: string;
}
export interface DocumentProcessingReport {
    timestamp: Date;
    totalDocuments: number;
    processedDocuments: number;
    failedDocuments: number;
    totalIssues: number;
    issuesByType: Record<string, number>;
    issuesBySeverity: Record<string, number>;
    issues: DocumentProcessingIssue[];
    summary: {
        processingSuccessRate: number;
        dataQualityScore: number;
        recommendations: string[];
    };
}
export interface DocumentProcessingVerifierOptions {
    documentsPath?: string;
    checkExtractionFailures?: boolean;
    checkIncompleteSummaries?: boolean;
    checkEmptyFields?: boolean;
    checkInvalidData?: boolean;
    checkMissingMetadata?: boolean;
    requiredFields?: string[];
    minSummaryLength?: number;
    maxProcessingAge?: number;
}
export declare class DocumentProcessingVerifier {
    private options;
    constructor(options?: DocumentProcessingVerifierOptions);
    verifyDocumentProcessing(): Promise<DocumentProcessingReport>;
    private loadProcessedDocuments;
    private isProcessedDocument;
    private verifyDocument;
    private getNestedValue;
    private generateReport;
    private calculateDataQualityScore;
    private generateRecommendations;
}
//# sourceMappingURL=DocumentProcessingVerifier.d.ts.map