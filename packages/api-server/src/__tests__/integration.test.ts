import { describe, it, expect, beforeAll } from "vitest";
import { ExtractorAdapter } from "../adapters/ExtractorAdapter.js";
import { CompatibilityLayer } from "../cli/CompatibilityLayer.js";
import path from "path";
import fs from "fs/promises";

describe("Integration Tests", () => {
  let extractorAdapter: ExtractorAdapter;
  let compatibilityLayer: CompatibilityLayer;
  let testFilePath: string;

  beforeAll(async () => {
    // Create a test markdown file
    testFilePath = path.join(process.cwd(), "test-document.md");
    await fs.writeFile(
      testFilePath,
      "# Test Document\n\nThis is a test document for integration testing."
    );

    // Mock DocumentAnalyzer
    const mockDocumentAnalyzer = {
      analyzeStructure: async () => ({
        sections: [],
        headings: [],
        paragraphs: 5,
        lists: 2,
        tables: 0,
        images: 0,
      }),
      extractRequirements: async () => ({
        functional: [],
        nonFunctional: [],
        totalCount: 0,
      }),
      categorizeContent: async () => [
        {
          type: "general-document",
          confidence: 0.8,
          description: "Test document",
        },
      ],
      identifyActionItems: async () => [],
      extractKeyPoints: async () => ["Test point 1", "Test point 2"],
      generateSummary: async () => ({
        content: "Test summary",
        length: "medium",
        keyPoints: [],
      }),
      performFullAnalysis: async () => ({
        structure: {
          sections: [],
          headings: [],
          paragraphs: 5,
          lists: 2,
          tables: 0,
          images: 0,
        },
        requirements: {
          functional: [],
          nonFunctional: [],
          totalCount: 0,
        },
        keyPoints: ["Test point 1", "Test point 2"],
        summary: {
          content: "Test summary",
          length: "medium",
        },
        contentCategories: [
          {
            type: "general-document",
            confidence: 0.8,
            description: "Test document",
          },
        ],
        actionItems: [],
      }),
      analyzeBatch: async (docs) =>
        docs.map(() => ({
          structure: {
            sections: [],
            headings: [],
            paragraphs: 5,
            lists: 2,
            tables: 0,
            images: 0,
          },
          requirements: {
            functional: [],
            nonFunctional: [],
            totalCount: 0,
          },
          keyPoints: ["Test point 1", "Test point 2"],
          summary: {
            content: "Test summary",
            length: "medium",
          },
          contentCategories: [
            {
              type: "general-document",
              confidence: 0.8,
              description: "Test document",
            },
          ],
          actionItems: [],
        })),
      buildContext: async () => "Test context",
      maintainContext: async () => "Updated context",
    };

    extractorAdapter = new ExtractorAdapter(mockDocumentAnalyzer as any);
    compatibilityLayer = new CompatibilityLayer();
  });

  describe("ExtractorAdapter", () => {
    it("should process document with AI analysis", async () => {
      const result = await extractorAdapter.processDocument(testFilePath, {
        enableAIAnalysis: true,
        analysisType: "full",
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.originalPath).toBe(testFilePath);
      expect(result.type).toBe("md");
      expect(result.content.text).toContain("Test Document");
      expect(result.analysis).toBeDefined();
    });

    it("should process document without AI analysis", async () => {
      const result = await extractorAdapter.processDocument(testFilePath, {
        enableAIAnalysis: false,
      });

      expect(result).toBeDefined();
      expect(result.analysis).toBeUndefined();
    });

    it("should process multiple documents in batch", async () => {
      const results = await extractorAdapter.processDocuments([testFilePath], {
        enableAIAnalysis: true,
      });

      expect(results).toHaveLength(1);
      expect(results[0].analysis).toBeDefined();
    });

    it("should build document context", async () => {
      const document = await extractorAdapter.processDocument(testFilePath);
      const context = await extractorAdapter.buildDocumentContext([document]);

      expect(context).toBeDefined();
      expect(typeof context).toBe("string");
    });
  });

  describe("CompatibilityLayer", () => {
    it("should process document with backward compatibility", async () => {
      const result = await compatibilityLayer.processDocument(testFilePath, {
        enableAI: false,
        format: "legacy",
      });

      expect(result).toBeDefined();
      expect(result.type).toBeDefined();
      expect(result.content).toBeDefined();
    });

    it("should return system status", () => {
      const status = compatibilityLayer.getStatus();

      expect(status).toBeDefined();
      expect(status.mode).toBeDefined();
      expect(status.capabilities).toBeDefined();
      expect(Array.isArray(status.capabilities)).toBe(true);
    });

    it("should handle batch processing", async () => {
      const results = await compatibilityLayer.processBatch([testFilePath], {
        enableAI: false,
        format: "legacy",
      });

      expect(results).toHaveLength(1);
      expect(results[0].type).toBeDefined();
      expect(results[0].content).toBeDefined();
    });
  });

  // Cleanup
  afterAll(async () => {
    try {
      await fs.unlink(testFilePath);
    } catch (error) {
      // File might not exist, ignore error
    }
  });
});
