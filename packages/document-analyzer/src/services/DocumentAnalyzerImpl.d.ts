import { ProcessedDocument, DocumentStructure, RequirementSet, ContentCategory, ActionItem, KeyPoint, Summary, DocumentAnalysis, SummaryLength, ProcessingOptions } from "@ai-toolkit/shared";
import { OllamaService } from "@ai-toolkit/ollama-interface";
import { DocumentAnalyzer } from "../interfaces/DocumentAnalyzer.js";
export declare class DocumentAnalyzerImpl implements DocumentAnalyzer {
    private ollamaService;
    private analysisPreferences;
    constructor(ollamaService: OllamaService);
    analyzeStructure(document: ProcessedDocument, options?: ProcessingOptions): Promise<DocumentStructure>;
    extractRequirements(document: ProcessedDocument, options?: ProcessingOptions): Promise<RequirementSet>;
    categorizeContent(content: string, options?: ProcessingOptions): Promise<ContentCategory[]>;
    identifyActionItems(content: string, options?: ProcessingOptions): Promise<ActionItem[]>;
    extractKeyPoints(content: string, options?: ProcessingOptions): Promise<KeyPoint[]>;
    generateSummary(content: string, length: SummaryLength, options?: ProcessingOptions): Promise<Summary>;
    performFullAnalysis(document: ProcessedDocument, options?: ProcessingOptions): Promise<DocumentAnalysis>;
    buildContext(documents: ProcessedDocument[], options?: ProcessingOptions): Promise<string>;
    maintainContext(previousContext: string, newDocument: ProcessedDocument, options?: ProcessingOptions): Promise<string>;
    private analyzeDocumentRelationships;
    private analyzeContextRelationship;
    private detectDocumentRelationship;
    private inferDocumentType;
    assessDocumentQuality(document: ProcessedDocument): Promise<{
        clarity: number;
        completeness: number;
        structure: number;
        overall: number;
        suggestions: string[];
    }>;
    analyzeBatch(documents: ProcessedDocument[], options?: ProcessingOptions): Promise<DocumentAnalysis[]>;
    setAnalysisPreferences(preferences: {
        requirementTypes?: string[];
        summaryStyle?: "technical" | "business" | "executive";
        detailLevel?: "minimal" | "standard" | "comprehensive";
    }): void;
    private parseJsonResponse;
    private performBasicStructureAnalysis;
    private performBasicRequirementExtraction;
    private performBasicContentCategorization;
    private performBasicActionItemExtraction;
    private performEnhancedActionItemExtraction;
    private performBasicKeyPointExtraction;
    private performBasicSummarization;
    private validateRequirements;
    private validateActionItems;
    private validateKeyPoints;
    private countParagraphs;
    private countLists;
    private countWords;
}
//# sourceMappingURL=DocumentAnalyzerImpl.d.ts.map