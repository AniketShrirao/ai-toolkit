import * as fs from 'fs/promises';
import * as path from 'path';

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
  maxProcessingAge?: number; // in hours
}

export class DocumentProcessingVerifier {
  private options: Required<DocumentProcessingVerifierOptions>;

  constructor(options: DocumentProcessingVerifierOptions = {}) {
    this.options = {
      documentsPath: options.documentsPath || './data/processed',
      checkExtractionFailures: options.checkExtractionFailures ?? true,
      checkIncompleteSummaries: options.checkIncompleteSummaries ?? true,
      checkEmptyFields: options.checkEmptyFields ?? true,
      checkInvalidData: options.checkInvalidData ?? true,
      checkMissingMetadata: options.checkMissingMetadata ?? true,
      requiredFields: options.requiredFields || ['content.text', 'type', 'status'],
      minSummaryLength: options.minSummaryLength || 50,
      maxProcessingAge: options.maxProcessingAge || 24
    };
  }

  async verifyDocumentProcessing(): Promise<DocumentProcessingReport> {
    const issues: DocumentProcessingIssue[] = [];
    
    try {
      const documents = await this.loadProcessedDocuments();
      
      for (const document of documents) {
        const documentIssues = await this.verifyDocument(document);
        issues.push(...documentIssues);
      }

      return this.generateReport(documents, issues);
    } catch (error) {
      throw new Error(`Document processing verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async loadProcessedDocuments(): Promise<VerifiableDocument[]> {
    const documents: VerifiableDocument[] = [];
    
    try {
      // Check if documents path exists
      await fs.access(this.options.documentsPath);
      
      // Look for JSON files containing processed document data
      const files = await fs.readdir(this.options.documentsPath, { recursive: true });
      
      for (const file of files) {
        if (typeof file === 'string' && file.endsWith('.json')) {
          try {
            const filePath = path.join(this.options.documentsPath, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const data = JSON.parse(content);
            
            // Check if this looks like a processed document
            if (this.isProcessedDocument(data)) {
              documents.push(data);
            }
          } catch (error) {
            // Skip files that can't be parsed
            continue;
          }
        }
      }
    } catch (error) {
      // Documents path doesn't exist or can't be read
      // This is not necessarily an error - might be a fresh installation
    }

    return documents;
  }

  private isProcessedDocument(data: any): data is VerifiableDocument {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.id === 'string' &&
      typeof data.originalPath === 'string' &&
      typeof data.type === 'string' &&
      typeof data.status === 'string' &&
      data.createdAt
    );
  }

  private async verifyDocument(document: VerifiableDocument): Promise<DocumentProcessingIssue[]> {
    const issues: DocumentProcessingIssue[] = [];

    // Check for extraction failures
    if (this.options.checkExtractionFailures) {
      if (document.status === 'failed') {
        issues.push({
          type: 'EXTRACTION_FAILURE',
          severity: 'high',
          documentPath: document.originalPath,
          message: `Document processing failed: ${document.error || 'Unknown error'}`,
          actualValue: document.status
        });
      }

      // Check if processing took too long or is stuck
      if (document.status === 'processing') {
        const createdAt = new Date(document.createdAt);
        const hoursSinceCreated = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceCreated > this.options.maxProcessingAge) {
          issues.push({
            type: 'EXTRACTION_FAILURE',
            severity: 'medium',
            documentPath: document.originalPath,
            message: `Document has been processing for ${Math.round(hoursSinceCreated)} hours - may be stuck`,
            actualValue: document.status
          });
        }
      }
    }

    // Check for empty required fields
    if (this.options.checkEmptyFields) {
      for (const fieldPath of this.options.requiredFields) {
        const value = this.getNestedValue(document, fieldPath);
        
        if (value === undefined || value === null || value === '') {
          issues.push({
            type: 'EMPTY_FIELD',
            severity: 'medium',
            documentPath: document.originalPath,
            field: fieldPath,
            message: `Required field '${fieldPath}' is empty or missing`,
            actualValue: value
          });
        }
      }
    }

    // Check for incomplete summaries
    if (this.options.checkIncompleteSummaries && document.analysis?.summary) {
      const summary = document.analysis.summary;
      
      if (summary.length < this.options.minSummaryLength) {
        issues.push({
          type: 'INCOMPLETE_SUMMARY',
          severity: 'low',
          documentPath: document.originalPath,
          field: 'analysis.summary',
          message: `Summary is too short (${summary.length} chars, minimum ${this.options.minSummaryLength})`,
          actualValue: summary.length,
          expectedValue: this.options.minSummaryLength
        });
      }

      // Check for placeholder text in summaries
      const placeholderPatterns = [
        /\[.*\]/,
        /placeholder/i,
        /not available/i,
        /coming soon/i
      ];

      for (const pattern of placeholderPatterns) {
        if (pattern.test(summary)) {
          issues.push({
            type: 'INCOMPLETE_SUMMARY',
            severity: 'medium',
            documentPath: document.originalPath,
            field: 'analysis.summary',
            message: `Summary contains placeholder text: ${summary.substring(0, 100)}...`,
            actualValue: summary
          });
          break;
        }
      }
    }

    // Check for missing metadata
    if (this.options.checkMissingMetadata) {
      if (!document.content?.metadata) {
        issues.push({
          type: 'MISSING_METADATA',
          severity: 'low',
          documentPath: document.originalPath,
          field: 'content.metadata',
          message: 'Document metadata is missing',
          actualValue: document.content?.metadata
        });
      } else {
        // Check for essential metadata fields
        const essentialFields = ['fileSize', 'mimeType', 'lastModified'];
        
        for (const field of essentialFields) {
          if (!document.content.metadata[field]) {
            issues.push({
              type: 'MISSING_METADATA',
              severity: 'low',
              documentPath: document.originalPath,
              field: `content.metadata.${field}`,
              message: `Essential metadata field '${field}' is missing`,
              actualValue: document.content.metadata[field]
            });
          }
        }
      }
    }

    // Check for invalid data types
    if (this.options.checkInvalidData) {
      // Check if arrays are actually arrays
      if (document.analysis?.keyPoints && !Array.isArray(document.analysis.keyPoints)) {
        issues.push({
          type: 'INVALID_DATA',
          severity: 'medium',
          documentPath: document.originalPath,
          field: 'analysis.keyPoints',
          message: 'Key points should be an array',
          actualValue: typeof document.analysis.keyPoints,
          expectedValue: 'array'
        });
      }

      if (document.analysis?.actionItems && !Array.isArray(document.analysis.actionItems)) {
        issues.push({
          type: 'INVALID_DATA',
          severity: 'medium',
          documentPath: document.originalPath,
          field: 'analysis.actionItems',
          message: 'Action items should be an array',
          actualValue: typeof document.analysis.actionItems,
          expectedValue: 'array'
        });
      }

      // Check date fields
      if (document.processedAt && isNaN(new Date(document.processedAt).getTime())) {
        issues.push({
          type: 'INVALID_DATA',
          severity: 'low',
          documentPath: document.originalPath,
          field: 'processedAt',
          message: 'Invalid processedAt date format',
          actualValue: document.processedAt
        });
      }
    }

    return issues;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  private generateReport(documents: VerifiableDocument[], issues: DocumentProcessingIssue[]): DocumentProcessingReport {
    const totalDocuments = documents.length;
    const processedDocuments = documents.filter(d => d.status === 'completed').length;
    const failedDocuments = documents.filter(d => d.status === 'failed').length;

    const issuesByType: Record<string, number> = {};
    const issuesBySeverity: Record<string, number> = {};

    for (const issue of issues) {
      issuesByType[issue.type] = (issuesByType[issue.type] || 0) + 1;
      issuesBySeverity[issue.severity] = (issuesBySeverity[issue.severity] || 0) + 1;
    }

    const processingSuccessRate = totalDocuments > 0 ? (processedDocuments / totalDocuments) * 100 : 100;
    const dataQualityScore = this.calculateDataQualityScore(issues, totalDocuments);
    const recommendations = this.generateRecommendations(issues, documents);

    return {
      timestamp: new Date(),
      totalDocuments,
      processedDocuments,
      failedDocuments,
      totalIssues: issues.length,
      issuesByType,
      issuesBySeverity,
      issues,
      summary: {
        processingSuccessRate,
        dataQualityScore,
        recommendations
      }
    };
  }

  private calculateDataQualityScore(issues: DocumentProcessingIssue[], totalDocuments: number): number {
    if (totalDocuments === 0) return 100;
    if (issues.length === 0) return 100;

    const severityWeights = {
      low: 1,
      medium: 3,
      high: 7,
      critical: 15
    };

    const totalWeight = issues.reduce((sum, issue) => {
      return sum + severityWeights[issue.severity];
    }, 0);

    // Calculate score based on issues per document
    const averageIssuesPerDocument = totalWeight / totalDocuments;
    const maxExpectedIssues = 10; // Threshold for "acceptable" quality
    
    const score = Math.max(0, 100 - (averageIssuesPerDocument / maxExpectedIssues) * 100);
    return Math.round(score);
  }

  private generateRecommendations(issues: DocumentProcessingIssue[], documents: VerifiableDocument[]): string[] {
    const recommendations: string[] = [];
    const issuesByType = issues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    if (issuesByType.EXTRACTION_FAILURE > 0) {
      recommendations.push(`Fix ${issuesByType.EXTRACTION_FAILURE} document extraction failures - check file formats and processing pipeline`);
    }

    if (issuesByType.INCOMPLETE_SUMMARY > 0) {
      recommendations.push(`Improve summary generation - ${issuesByType.INCOMPLETE_SUMMARY} summaries are incomplete or contain placeholders`);
    }

    if (issuesByType.EMPTY_FIELD > 0) {
      recommendations.push(`Address ${issuesByType.EMPTY_FIELD} missing required fields - ensure all processing steps complete successfully`);
    }

    if (issuesByType.INVALID_DATA > 0) {
      recommendations.push(`Fix ${issuesByType.INVALID_DATA} data type issues - validate data structure after processing`);
    }

    if (issuesByType.MISSING_METADATA > 0) {
      recommendations.push(`Enhance metadata extraction - ${issuesByType.MISSING_METADATA} documents are missing essential metadata`);
    }

    const stuckDocuments = documents.filter(d => d.status === 'processing').length;
    if (stuckDocuments > 0) {
      recommendations.push(`Review ${stuckDocuments} documents stuck in processing state - may need manual intervention`);
    }

    const failedDocuments = documents.filter(d => d.status === 'failed').length;
    if (failedDocuments > documents.length * 0.1) {
      recommendations.push('High failure rate detected - review document processing pipeline and error handling');
    }

    if (recommendations.length === 0) {
      recommendations.push('Document processing quality looks good! Continue monitoring for consistency.');
    }

    return recommendations;
  }
}