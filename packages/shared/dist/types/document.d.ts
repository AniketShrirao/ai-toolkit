import { BaseEntity, DocumentType, RequirementType, Priority, SummaryLength, DocumentStatus } from './common.js';
export interface ExtractedContent {
    text: string;
    metadata: Record<string, any>;
    images?: ImageData[];
    tables?: TableData[];
}
export interface ImageData {
    id: string;
    data: ArrayBuffer | Uint8Array;
    format: string;
    width: number;
    height: number;
}
export interface TableData {
    id: string;
    headers: string[];
    rows: string[][];
}
export interface DocumentMetadata {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
    pageCount?: number;
    wordCount?: number;
    language?: string;
}
export interface ProcessedDocument extends BaseEntity {
    originalPath: string;
    type: DocumentType;
    content: ExtractedContent;
    metadata: DocumentMetadata;
    analysis?: DocumentAnalysis;
}
export interface DocumentStructure {
    sections: DocumentSection[];
    headings: Heading[];
    paragraphs: number;
    lists: number;
    tables: number;
    images: number;
}
export interface DocumentSection {
    id: string;
    title: string;
    level: number;
    content: string;
    startPage?: number;
    endPage?: number;
}
export interface Heading {
    level: number;
    text: string;
    page?: number;
}
export interface ContentCategory {
    type: string;
    confidence: number;
    description: string;
}
export interface KeyPoint {
    id: string;
    text: string;
    importance: Priority;
    category: string;
    context?: string;
}
export interface ActionItem {
    id: string;
    description: string;
    priority: Priority;
    deadline?: Date;
    assignee?: string;
    status: 'pending' | 'in-progress' | 'completed';
}
export interface Summary {
    length: SummaryLength;
    content: string;
    keyPoints: string[];
    wordCount: number;
}
export interface Requirement {
    id: string;
    type: RequirementType;
    priority: Priority;
    description: string;
    acceptanceCriteria: string[];
    complexity: number;
    estimatedHours: number;
    source?: string;
    category?: string;
}
export interface RequirementSet {
    functional: Requirement[];
    nonFunctional: Requirement[];
    totalCount: number;
}
export interface DocumentAnalysis {
    structure: DocumentStructure;
    requirements: RequirementSet;
    keyPoints: KeyPoint[];
    actionItems: ActionItem[];
    summary: Summary;
    contentCategories: ContentCategory[];
}
export interface DocumentUpload {
    id: string;
    file: File;
    name: string;
    size: number;
    type: DocumentType;
    status: DocumentStatus;
    progress: number;
    error?: string;
    uploadedAt: Date;
}
export interface DocumentListItem {
    id: string;
    name: string;
    type: DocumentType;
    size: number;
    status: DocumentStatus;
    progress?: number;
    uploadedAt: Date;
    processedAt?: Date;
    error?: string;
    hasAnalysis: boolean;
}
export interface DocumentFilter {
    type?: DocumentType;
    status?: DocumentStatus;
    search?: string;
    dateFrom?: Date;
    dateTo?: Date;
}
export interface DocumentProcessingResult {
    documentId: string;
    status: DocumentStatus;
    progress: number;
    analysis?: DocumentAnalysis;
    error?: string;
    completedAt?: Date;
}
//# sourceMappingURL=document.d.ts.map