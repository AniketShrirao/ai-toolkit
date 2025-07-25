// Mock shared types and interfaces
export type DocumentType = "pdf" | "markdown" | "text" | "docx" | "unknown";

export interface ProcessedDocument {
  id: string;
  originalPath: string;
  type: DocumentType;
  content: ExtractedContent;
  metadata: DocumentMetadata;
  analysis?: DocumentAnalysis;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExtractedContent {
  text: string;
  metadata?: {
    source?: string;
    extractedAt?: Date;
    confidence?: number;
    url?: string;
  };
  tables?: any[];
  images?: any[];
}

export interface DocumentMetadata {
  title?: string;
  fileName?: string;
  fileSize?: number;
  createdAt?: Date;
  source?: string;
  url?: string;
}

export interface DocumentAnalysis {
  structure?: DocumentStructure;
  requirements?: RequirementSet;
  keyPoints?: KeyPoint[];
  actionItems?: ActionItem[];
  summary?: Summary;
  contentCategories?: ContentCategory[];
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
}

export interface Heading {
  level: number;
  text: string;
  page?: number;
}

export interface RequirementSet {
  functional: Requirement[];
  nonFunctional: Requirement[];
  totalCount: number;
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

export type RequirementType = "functional" | "non-functional";
export type Priority = "critical" | "high" | "medium" | "low";

export interface ContentCategory {
  type: string;
  confidence: number;
  description: string;
}

export interface ActionItem {
  id: string;
  description: string;
  priority: Priority;
  deadline?: Date;
  assignee?: string;
  status: "pending" | "in-progress" | "completed";
}

export interface KeyPoint {
  id: string;
  text: string;
  importance: "high" | "medium" | "low";
  category: string;
  context?: string;
}

export interface Summary {
  length: SummaryLength;
  content: string;
  keyPoints: string[];
  wordCount: number;
}

export type SummaryLength = "short" | "medium" | "long";

export interface ProcessingOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}
