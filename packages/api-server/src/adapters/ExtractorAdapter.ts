import path from "path";
import {
  ProcessedDocument,
  DocumentMetadata,
  ExtractedContent,
  DocumentType,
  DocumentAnalysis,
  KeyPoint,
  RequirementSet,
  Summary,
} from "@ai-toolkit/shared";
import { DocumentAnalyzer } from "@ai-toolkit/document-analyzer";

// Import existing extractors - using dynamic imports to avoid path issues
// These will be loaded dynamically when needed

export interface ExtractorAdapterOptions {
  enableAIAnalysis?: boolean;
  analysisType?: "requirements" | "estimation" | "summary" | "full";
  preserveOriginalFormat?: boolean;
}

export class ExtractorAdapter {
  private documentAnalyzer: DocumentAnalyzer;

  constructor(documentAnalyzer: DocumentAnalyzer) {
    this.documentAnalyzer = documentAnalyzer;
  }

  /**
   * Enhanced document processing that combines existing extractors with AI analysis
   */
  async processDocument(
    filePath: string,
    options: ExtractorAdapterOptions = {}
  ): Promise<ProcessedDocument> {
    const { enableAIAnalysis = true, analysisType = "full" } = options;

    // Step 1: Extract content using existing extractors
    const extractedContent = await this.extractContent(filePath);

    // Step 2: Create base processed document
    const processedDocument: ProcessedDocument = {
      id: this.generateDocumentId(),
      originalPath: filePath,
      type: this.getDocumentType(filePath),
      content: extractedContent,
      metadata: this.extractMetadata(filePath, extractedContent),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Step 3: Enhance with AI analysis if enabled
    if (enableAIAnalysis) {
      try {
        const analysis = await this.performAIAnalysis(
          processedDocument,
          analysisType
        );
        processedDocument.analysis = analysis;
      } catch (error) {
        console.warn(
          "AI analysis failed, continuing with basic extraction:",
          error
        );
        // Document processing continues without AI analysis
      }
    }

    return processedDocument;
  }

  /**
   * Process multiple documents with batch optimization
   */
  async processDocuments(
    filePaths: string[],
    options: ExtractorAdapterOptions = {}
  ): Promise<ProcessedDocument[]> {
    const { enableAIAnalysis = true } = options;

    // Step 1: Extract content from all documents
    const documents = await Promise.all(
      filePaths.map((filePath) =>
        this.processDocument(filePath, { ...options, enableAIAnalysis: false })
      )
    );

    // Step 2: Perform batch AI analysis if enabled
    if (enableAIAnalysis) {
      try {
        const analyses = await this.documentAnalyzer.analyzeBatch(documents);
        documents.forEach((doc, index) => {
          if (analyses[index]) {
            doc.analysis = analyses[index];
            doc.updatedAt = new Date();
          }
        });
      } catch (error) {
        console.warn("Batch AI analysis failed:", error);
      }
    }

    return documents;
  }

  /**
   * Process URL content with enhanced analysis
   */
  async processURL(
    url: string,
    options: ExtractorAdapterOptions = {}
  ): Promise<ProcessedDocument> {
    const { enableAIAnalysis = true, analysisType = "full" } = options;

    // Extract content using existing URL crawler
    const { extractFromURL } = await import("../../../url-crawler/crawler.js");
    const extractedData = await extractFromURL(url);

    const extractedContent: ExtractedContent = {
      text: extractedData.content,
      metadata: {
        source: "url",
        url: url,
        extractedAt: new Date(),
      },
    };

    const processedDocument: ProcessedDocument = {
      id: this.generateDocumentId(),
      originalPath: url,
      type: this.getDocumentType(url),
      content: extractedContent,
      metadata: {
        title: this.extractTitleFromURL(url),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Enhance with AI analysis
    if (enableAIAnalysis) {
      try {
        const analysis = await this.performAIAnalysis(
          processedDocument,
          analysisType
        );
        processedDocument.analysis = analysis;
      } catch (error) {
        console.warn("AI analysis failed for URL:", error);
      }
    }

    return processedDocument;
  }

  /**
   * Enhanced OCR processing with AI analysis
   */
  async processImage(
    imagePath: string,
    options: ExtractorAdapterOptions = {}
  ): Promise<ProcessedDocument> {
    const { enableAIAnalysis = true, analysisType = "full" } = options;

    // Extract text using existing OCR
    const { extractOCR } = await import("../../../extractor/ocr.js");
    const extractedData = await extractOCR(imagePath);

    const extractedContent: ExtractedContent = {
      text: extractedData.content,
      metadata: {
        source: "ocr",
        confidence: 0.8, // Default OCR confidence
        extractedAt: new Date(),
      },
    };

    const processedDocument: ProcessedDocument = {
      id: this.generateDocumentId(),
      originalPath: imagePath,
      type: this.getDocumentType(imagePath),
      content: extractedContent,
      metadata: this.extractMetadata(imagePath, extractedContent),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Enhance with AI analysis
    if (enableAIAnalysis) {
      try {
        const analysis = await this.performAIAnalysis(
          processedDocument,
          analysisType
        );
        processedDocument.analysis = analysis;
      } catch (error) {
        console.warn("AI analysis failed for image:", error);
      }
    }

    return processedDocument;
  }

  /**
   * Create context-aware analysis across multiple documents
   */
  async buildDocumentContext(documents: ProcessedDocument[]): Promise<string> {
    try {
      return await this.documentAnalyzer.buildContext(documents);
    } catch (error) {
      console.warn("Context building failed:", error);
      return this.buildBasicContext(documents);
    }
  }

  /**
   * Maintain context when adding new documents
   */
  async maintainContext(
    previousContext: string,
    newDocument: ProcessedDocument
  ): Promise<string> {
    try {
      return await this.documentAnalyzer.maintainContext(
        previousContext,
        newDocument
      );
    } catch (error) {
      console.warn("Context maintenance failed:", error);
      return `${previousContext}\n---\nNew Document: ${newDocument.metadata.title || newDocument.id}`;
    }
  }

  /**
   * Backward compatibility method for existing CLI usage
   */
  async extractLegacy(
    filePath: string
  ): Promise<{ type: string; content: string }> {
    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
      case ".pdf":
        const { extractPDF } = await import("../../../extractor/pdf.js");
        return await extractPDF(filePath);
      case ".md":
        const { extractMarkdown } = await import(
          "../../../extractor/markdown.js"
        );
        return await extractMarkdown(filePath);
      case ".jpg":
      case ".jpeg":
      case ".png":
      case ".gif":
        const { extractOCR } = await import("../../../extractor/ocr.js");
        return await extractOCR(filePath);
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
  }

  // Private helper methods
  private async extractContent(filePath: string): Promise<ExtractedContent> {
    const ext = path.extname(filePath).toLowerCase();
    let extractedData: { type: string; content: string };

    switch (ext) {
      case ".pdf":
        const { extractPDF } = await import("../../../extractor/pdf.js");
        extractedData = await extractPDF(filePath);
        break;
      case ".md":
        const { extractMarkdown } = await import(
          "../../../extractor/markdown.js"
        );
        extractedData = await extractMarkdown(filePath);
        break;
      case ".jpg":
      case ".jpeg":
      case ".png":
      case ".gif":
        const { extractOCR } = await import("../../../extractor/ocr.js");
        extractedData = await extractOCR(filePath);
        break;
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }

    return {
      text: extractedData.content,
      metadata: {
        source: extractedData.type,
        extractedAt: new Date(),
      },
    };
  }

  private async performAIAnalysis(
    document: ProcessedDocument,
    analysisType: string
  ): Promise<DocumentAnalysis> {
    switch (analysisType) {
      case "requirements":
        const requirements =
          await this.documentAnalyzer.extractRequirements(document);
        const structure =
          await this.documentAnalyzer.analyzeStructure(document);
        return {
          structure,
          requirements,
          keyPoints: [],
          actionItems: [],
          summary: {
            length: "medium",
            content: "Requirements analysis completed",
            keyPoints: [],
            wordCount: 0,
          },
          contentCategories: [],
        };

      case "estimation":
        const requirements2 =
          await this.documentAnalyzer.extractRequirements(document);
        const keyPoints = await this.documentAnalyzer.extractKeyPoints(
          document.content.text
        );
        const structure2 =
          await this.documentAnalyzer.analyzeStructure(document);
        return {
          structure: structure2,
          requirements: requirements2,
          keyPoints,
          actionItems: [],
          summary: {
            length: "medium",
            content: "Estimation analysis completed",
            keyPoints: keyPoints.map((kp: any) => kp.text),
            wordCount: 0,
          },
          contentCategories: [],
        };

      case "summary":
        const summary = await this.documentAnalyzer.generateSummary(
          document.content.text,
          "medium"
        );
        const keyPoints2 = await this.documentAnalyzer.extractKeyPoints(
          document.content.text
        );
        const structure3 =
          await this.documentAnalyzer.analyzeStructure(document);
        return {
          structure: structure3,
          requirements: { functional: [], nonFunctional: [], totalCount: 0 },
          keyPoints: keyPoints2,
          actionItems: [],
          summary,
          contentCategories: [],
        };

      case "full":
      default:
        return await this.documentAnalyzer.performFullAnalysis(document);
    }
  }

  private extractMetadata(
    filePath: string,
    content: ExtractedContent
  ): DocumentMetadata {
    const fileName = path.basename(filePath);
    const title = fileName.replace(path.extname(fileName), "");

    return {
      title,
    };
  }

  private getDocumentType(filePath: string): DocumentType {
    // Handle URLs
    if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
      return "html";
    }

    const ext = path.extname(filePath).toLowerCase();
    const typeMap: { [key: string]: DocumentType } = {
      ".pdf": "pdf",
      ".md": "md",
      ".txt": "txt",
      ".docx": "docx",
      ".html": "html",
      ".xlsx": "xlsx",
      ".csv": "csv",
      // Images and other unsupported types default to txt
      ".jpg": "txt",
      ".jpeg": "txt",
      ".png": "txt",
      ".gif": "txt",
    };

    return typeMap[ext] || "txt";
  }

  private extractTitleFromURL(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname + urlObj.pathname;
    } catch {
      return url;
    }
  }

  private generateDocumentId(): string {
    return `doc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private buildBasicContext(documents: ProcessedDocument[]): string {
    return documents
      .map((doc, index) => {
        const title = doc.metadata.title || `Document ${index + 1}`;
        const type = doc.type;
        const wordCount = doc.content.text.split(/\s+/).length;

        return `Document ${index + 1}: ${title}
Type: ${type}
Word Count: ${wordCount}
Summary: ${doc.content.text.substring(0, 200)}...`;
      })
      .join("\n---\n");
  }
}
