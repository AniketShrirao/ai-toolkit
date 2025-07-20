import {
  ProcessedDocument,
  DocumentStructure,
  RequirementSet,
  ContentCategory,
  ActionItem,
  KeyPoint,
  Summary,
  DocumentAnalysis,
  SummaryLength,
  ProcessingOptions
} from '@ai-toolkit/shared';

export interface DocumentAnalyzer {
  // Core analysis methods
  analyzeStructure(
    document: ProcessedDocument,
    options?: ProcessingOptions
  ): Promise<DocumentStructure>;

  extractRequirements(
    document: ProcessedDocument,
    options?: ProcessingOptions
  ): Promise<RequirementSet>;

  categorizeContent(
    content: string,
    options?: ProcessingOptions
  ): Promise<ContentCategory[]>;

  // Business intelligence methods
  identifyActionItems(
    content: string,
    options?: ProcessingOptions
  ): Promise<ActionItem[]>;

  extractKeyPoints(
    content: string,
    options?: ProcessingOptions
  ): Promise<KeyPoint[]>;

  generateSummary(
    content: string,
    length: SummaryLength,
    options?: ProcessingOptions
  ): Promise<Summary>;

  // Comprehensive analysis
  performFullAnalysis(
    document: ProcessedDocument,
    options?: ProcessingOptions
  ): Promise<DocumentAnalysis>;

  // Context management
  buildContext(
    documents: ProcessedDocument[],
    options?: ProcessingOptions
  ): Promise<string>;

  maintainContext(
    previousContext: string,
    newDocument: ProcessedDocument,
    options?: ProcessingOptions
  ): Promise<string>;

  // Quality assessment
  assessDocumentQuality(
    document: ProcessedDocument
  ): Promise<{
    clarity: number;
    completeness: number;
    structure: number;
    overall: number;
    suggestions: string[];
  }>;

  // Batch processing
  analyzeBatch(
    documents: ProcessedDocument[],
    options?: ProcessingOptions
  ): Promise<DocumentAnalysis[]>;

  // Configuration
  setAnalysisPreferences(preferences: {
    requirementTypes?: string[];
    summaryStyle?: 'technical' | 'business' | 'executive';
    detailLevel?: 'minimal' | 'standard' | 'comprehensive';
  }): void;
}