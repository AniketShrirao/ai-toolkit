import { ExtractorAdapter } from "../adapters/ExtractorAdapter.js";
import { DocumentAnalyzerImpl } from "@ai-toolkit/document-analyzer";
import { OllamaServiceImpl } from "@ai-toolkit/ollama-interface";

/**
 * CLI Compatibility Layer
 * Provides backward compatibility for existing CLI usage patterns
 * while enabling enhanced AI capabilities when available
 */
export class CompatibilityLayer {
  private extractorAdapter: ExtractorAdapter | null = null;
  private fallbackMode = false;

  constructor() {
    this.initializeEnhancedMode();
  }

  /**
   * Initialize enhanced mode with AI capabilities
   */
  private async initializeEnhancedMode() {
    try {
      // Try to initialize Ollama service
      const ollamaService = new OllamaServiceImpl();
      await ollamaService.connect();

      const documentAnalyzer = new DocumentAnalyzerImpl(ollamaService);
      this.extractorAdapter = new ExtractorAdapter(documentAnalyzer);

      console.log("Enhanced AI mode initialized successfully");
    } catch (error) {
      console.warn(
        "AI services unavailable, falling back to basic extraction:",
        error
      );
      this.fallbackMode = true;
    }
  }

  /**
   * Process document with backward compatibility
   * Returns the same format as original extractors but with optional AI enhancements
   */
  async processDocument(
    filePath: string,
    options: {
      enableAI?: boolean;
      analysisType?: "requirements" | "estimation" | "summary" | "full";
      format?: "legacy" | "enhanced";
    } = {}
  ): Promise<any> {
    const {
      enableAI = !this.fallbackMode,
      analysisType = "full",
      format = "legacy",
    } = options;

    if (enableAI && this.extractorAdapter && !this.fallbackMode) {
      // Enhanced processing with AI
      const processedDocument = await this.extractorAdapter.processDocument(
        filePath,
        {
          enableAIAnalysis: true,
          analysisType,
          preserveOriginalFormat: true,
        }
      );

      if (format === "legacy") {
        // Return in legacy format for backward compatibility
        return {
          type: processedDocument.type,
          content: processedDocument.content.text,
          // Optional AI enhancements (can be ignored by legacy code)
          analysis: processedDocument.analysis,
          metadata: processedDocument.metadata,
        };
      } else {
        // Return full enhanced format
        return processedDocument;
      }
    } else {
      // Fallback to basic extraction
      return (
        (await this.extractorAdapter?.extractLegacy(filePath)) ||
        (await this.basicExtraction(filePath))
      );
    }
  }

  /**
   * Process URL with backward compatibility
   */
  async processURL(
    url: string,
    options: {
      enableAI?: boolean;
      analysisType?: "requirements" | "estimation" | "summary" | "full";
      format?: "legacy" | "enhanced";
    } = {}
  ): Promise<any> {
    const {
      enableAI = !this.fallbackMode,
      analysisType = "full",
      format = "legacy",
    } = options;

    if (enableAI && this.extractorAdapter && !this.fallbackMode) {
      const processedDocument = await this.extractorAdapter.processURL(url, {
        enableAIAnalysis: true,
        analysisType,
      });

      if (format === "legacy") {
        return {
          type: "url",
          content: processedDocument.content.text,
          analysis: processedDocument.analysis,
          metadata: processedDocument.metadata,
        };
      } else {
        return processedDocument;
      }
    } else {
      // Fallback to basic URL extraction
      const { extractFromURL } = await import(
        "../../../url-crawler/crawler.js"
      );
      return await extractFromURL(url);
    }
  }

  /**
   * Process image with OCR and optional AI analysis
   */
  async processImage(
    imagePath: string,
    options: {
      enableAI?: boolean;
      analysisType?: "requirements" | "estimation" | "summary" | "full";
      format?: "legacy" | "enhanced";
    } = {}
  ): Promise<any> {
    const {
      enableAI = !this.fallbackMode,
      analysisType = "full",
      format = "legacy",
    } = options;

    if (enableAI && this.extractorAdapter && !this.fallbackMode) {
      const processedDocument = await this.extractorAdapter.processImage(
        imagePath,
        {
          enableAIAnalysis: true,
          analysisType,
        }
      );

      if (format === "legacy") {
        return {
          type: "ocr",
          content: processedDocument.content.text,
          analysis: processedDocument.analysis,
          metadata: processedDocument.metadata,
        };
      } else {
        return processedDocument;
      }
    } else {
      // Fallback to basic OCR
      const { extractOCR } = await import("../../../extractor/ocr.js");
      return await extractOCR(imagePath);
    }
  }

  /**
   * Batch processing with backward compatibility
   */
  async processBatch(
    filePaths: string[],
    options: {
      enableAI?: boolean;
      analysisType?: "requirements" | "estimation" | "summary" | "full";
      format?: "legacy" | "enhanced";
      buildContext?: boolean;
    } = {}
  ): Promise<any[]> {
    const {
      enableAI = !this.fallbackMode,
      analysisType = "full",
      format = "legacy",
      buildContext = false,
    } = options;

    if (enableAI && this.extractorAdapter && !this.fallbackMode) {
      const processedDocuments = await this.extractorAdapter.processDocuments(
        filePaths,
        {
          enableAIAnalysis: true,
          analysisType,
          preserveOriginalFormat: true,
        }
      );

      let results = processedDocuments;

      // Build context if requested
      if (buildContext) {
        const context =
          await this.extractorAdapter.buildDocumentContext(processedDocuments);

        // Add context to each document
        results = processedDocuments.map((doc) => ({
          ...doc,
          context,
        }));
      }

      if (format === "legacy") {
        return results.map((doc) => ({
          type: doc.type,
          content: doc.content.text,
          analysis: doc.analysis,
          metadata: doc.metadata,
        }));
      } else {
        return results;
      }
    } else {
      // Fallback to basic batch processing
      return await Promise.all(
        filePaths.map((filePath) => this.basicExtraction(filePath))
      );
    }
  }

  /**
   * Check if AI capabilities are available
   */
  isAIAvailable(): boolean {
    return !this.fallbackMode && this.extractorAdapter !== null;
  }

  /**
   * Get system status
   */
  getStatus(): {
    aiAvailable: boolean;
    mode: "enhanced" | "fallback";
    capabilities: string[];
  } {
    const capabilities = ["basic-extraction"];

    if (this.isAIAvailable()) {
      capabilities.push(
        "ai-analysis",
        "requirement-extraction",
        "context-building",
        "batch-processing",
        "url-processing",
        "ocr-enhancement"
      );
    }

    return {
      aiAvailable: this.isAIAvailable(),
      mode: this.fallbackMode ? "fallback" : "enhanced",
      capabilities,
    };
  }

  /**
   * Basic extraction fallback (without AI)
   */
  private async basicExtraction(filePath: string): Promise<any> {
    const path = await import("path");
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
}

// Export singleton instance for CLI usage
export const compatibilityLayer = new CompatibilityLayer();

// Export convenience functions for backward compatibility
export async function extractDocument(filePath: string, enableAI = true) {
  return await compatibilityLayer.processDocument(filePath, { enableAI });
}

export async function extractURL(url: string, enableAI = true) {
  return await compatibilityLayer.processURL(url, { enableAI });
}

export async function extractImage(imagePath: string, enableAI = true) {
  return await compatibilityLayer.processImage(imagePath, { enableAI });
}

export async function extractBatch(filePaths: string[], enableAI = true) {
  return await compatibilityLayer.processBatch(filePaths, { enableAI });
}
