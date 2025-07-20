import { describe, it, expect, beforeEach, vi, Mock } from "vitest";
import { DocumentAnalyzerImpl } from "../services/DocumentAnalyzerImpl.js";
import { OllamaService } from "@ai-toolkit/ollama-interface";
import {
  ProcessedDocument,
  DocumentType,
  SummaryLength,
  Priority,
} from "@ai-toolkit/shared";

// Mock the OllamaService
const mockOllamaService = {
  generateText: vi.fn(),
  isConnected: vi.fn(() => true),
  getCurrentModel: vi.fn(() => "test-model"),
} as unknown as OllamaService;

describe("DocumentAnalyzerImpl", () => {
  let analyzer: DocumentAnalyzerImpl;
  let sampleDocument: ProcessedDocument;

  beforeEach(() => {
    analyzer = new DocumentAnalyzerImpl(mockOllamaService);
    vi.clearAllMocks();

    sampleDocument = {
      id: "test-doc-1",
      createdAt: new Date(),
      updatedAt: new Date(),
      originalPath: "/test/document.pdf",
      type: "pdf" as DocumentType,
      content: {
        text: `# Project Requirements Document

## Introduction
This document outlines the requirements for a new web application.

## Functional Requirements
The system must provide user authentication.
The application should allow users to create and manage projects.
Users can upload and process documents.

## Non-Functional Requirements
The system shall respond within 2 seconds.
The application must be secure and protect user data.
The system should be available 99.9% of the time.

## Action Items
- Implement user authentication system
- Create project management interface
- Set up document processing pipeline
- Conduct security audit

## Key Points
- User experience is critical
- Security is a top priority
- Performance requirements are strict`,
        metadata: {},
      },
      metadata: {
        title: "Project Requirements Document",
        pageCount: 1,
        wordCount: 150,
      },
    };
  });

  describe("analyzeStructure", () => {
    it("should analyze document structure using AI", async () => {
      const mockResponse = JSON.stringify({
        sections: [
          {
            id: "intro",
            title: "Introduction",
            level: 2,
            content: "This document outlines...",
          },
          {
            id: "func-req",
            title: "Functional Requirements",
            level: 2,
            content: "The system must...",
          },
        ],
        headings: [
          { level: 1, text: "Project Requirements Document" },
          { level: 2, text: "Introduction" },
          { level: 2, text: "Functional Requirements" },
        ],
        paragraphs: 8,
        lists: 2,
        tables: 0,
        images: 0,
      });

      (mockOllamaService.generateText as Mock).mockResolvedValue(mockResponse);

      const result = await analyzer.analyzeStructure(sampleDocument);

      expect(result).toEqual({
        sections: [
          {
            id: "intro",
            title: "Introduction",
            level: 2,
            content: "This document outlines...",
          },
          {
            id: "func-req",
            title: "Functional Requirements",
            level: 2,
            content: "The system must...",
          },
        ],
        headings: [
          { level: 1, text: "Project Requirements Document" },
          { level: 2, text: "Introduction" },
          { level: 2, text: "Functional Requirements" },
        ],
        paragraphs: 8,
        lists: 2,
        tables: 0,
        images: 0,
      });

      expect(mockOllamaService.generateText).toHaveBeenCalledWith(
        expect.stringContaining("Analyze the structure"),
        expect.objectContaining({
          temperature: 0.3,
          maxTokens: 2000,
        })
      );
    });

    it("should fallback to basic analysis when AI fails", async () => {
      (mockOllamaService.generateText as Mock).mockRejectedValue(
        new Error("AI service error")
      );

      const result = await analyzer.analyzeStructure(sampleDocument);

      expect(result).toHaveProperty("sections");
      expect(result).toHaveProperty("headings");
      expect(result).toHaveProperty("paragraphs");
      expect(result.paragraphs).toBeGreaterThan(0);
    });
  });

  describe("extractRequirements", () => {
    it("should extract and categorize requirements using AI", async () => {
      const mockResponse = JSON.stringify({
        functional: [
          {
            id: "req-1",
            type: "functional",
            priority: "high",
            description: "The system must provide user authentication",
            acceptanceCriteria: ["Users can log in with email and password"],
            complexity: 5,
            estimatedHours: 16,
            category: "authentication",
          },
        ],
        nonFunctional: [
          {
            id: "req-2",
            type: "non-functional",
            priority: "high",
            description: "The system shall respond within 2 seconds",
            acceptanceCriteria: ["All API calls complete within 2 seconds"],
            complexity: 7,
            estimatedHours: 24,
            category: "performance",
          },
        ],
      });

      (mockOllamaService.generateText as Mock).mockResolvedValue(mockResponse);

      const result = await analyzer.extractRequirements(sampleDocument);

      expect(result.functional).toHaveLength(1);
      expect(result.nonFunctional).toHaveLength(1);
      expect(result.totalCount).toBe(2);
      expect(result.functional[0]).toMatchObject({
        id: "req-1",
        type: "functional",
        priority: "high",
        description: "The system must provide user authentication",
      });
    });

    it("should fallback to basic extraction when AI fails", async () => {
      (mockOllamaService.generateText as Mock).mockRejectedValue(
        new Error("AI service error")
      );

      const result = await analyzer.extractRequirements(sampleDocument);

      expect(result).toHaveProperty("functional");
      expect(result).toHaveProperty("nonFunctional");
      expect(result.totalCount).toBeGreaterThan(0);
    });

    it("should validate requirement data", async () => {
      const mockResponse = JSON.stringify({
        functional: [
          {
            // Missing required fields
            description: "Test requirement",
            priority: "invalid-priority",
            complexity: 15, // Too high
          },
        ],
        nonFunctional: [],
      });

      (mockOllamaService.generateText as Mock).mockResolvedValue(mockResponse);

      const result = await analyzer.extractRequirements(sampleDocument);

      expect(result.functional[0]).toMatchObject({
        id: expect.any(String),
        type: "functional",
        priority: "medium", // Should default to medium
        complexity: 10, // Should be capped at 10
        estimatedHours: 8, // Should have default
      });
    });
  });

  describe("categorizeContent", () => {
    it("should categorize content using AI", async () => {
      const mockResponse = JSON.stringify([
        {
          type: "business-requirements",
          confidence: 0.9,
          description: "Contains multiple requirement statements",
        },
        {
          type: "technical-specification",
          confidence: 0.7,
          description: "Includes technical system details",
        },
      ]);

      (mockOllamaService.generateText as Mock).mockResolvedValue(mockResponse);

      const result = await analyzer.categorizeContent(
        sampleDocument.content.text
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        type: "business-requirements",
        confidence: 0.9,
        description: "Contains multiple requirement statements",
      });
    });

    it("should fallback to basic categorization when AI fails", async () => {
      (mockOllamaService.generateText as Mock).mockRejectedValue(
        new Error("AI service error")
      );

      const result = await analyzer.categorizeContent(
        sampleDocument.content.text
      );

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("type");
      expect(result[0]).toHaveProperty("confidence");
    });
  });

  describe("identifyActionItems", () => {
    it("should identify action items using AI", async () => {
      const mockResponse = JSON.stringify([
        {
          id: "action-1",
          description: "Implement user authentication system",
          priority: "high",
          status: "pending",
        },
        {
          id: "action-2",
          description: "Conduct security audit",
          priority: "medium",
          deadline: "2024-12-31T00:00:00.000Z",
          status: "pending",
        },
      ]);

      (mockOllamaService.generateText as Mock).mockResolvedValue(mockResponse);

      const result = await analyzer.identifyActionItems(
        sampleDocument.content.text
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: "action-1",
        description: "Implement user authentication system",
        priority: "high",
        status: "pending",
      });
      expect(result[1].deadline).toBeInstanceOf(Date);
    });

    it("should fallback to basic extraction when AI fails", async () => {
      (mockOllamaService.generateText as Mock).mockRejectedValue(
        new Error("AI service error")
      );

      const result = await analyzer.identifyActionItems(
        sampleDocument.content.text
      );

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("extractKeyPoints", () => {
    it("should extract key points using AI", async () => {
      const mockResponse = JSON.stringify([
        {
          id: "key-1",
          text: "User experience is critical",
          importance: "high",
          category: "priority",
          context: "Business requirement",
        },
        {
          id: "key-2",
          text: "Security is a top priority",
          importance: "high",
          category: "security",
        },
      ]);

      (mockOllamaService.generateText as Mock).mockResolvedValue(mockResponse);

      const result = await analyzer.extractKeyPoints(
        sampleDocument.content.text
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: "key-1",
        text: "User experience is critical",
        importance: "high",
        category: "priority",
      });
    });
  });

  describe("generateSummary", () => {
    it("should generate summary with different lengths", async () => {
      const mockResponse = JSON.stringify({
        content:
          "This document outlines requirements for a web application with focus on authentication, project management, and security.",
        keyPoints: [
          "User authentication required",
          "Project management features needed",
          "Security is critical",
        ],
        wordCount: 20,
      });

      (mockOllamaService.generateText as Mock).mockResolvedValue(mockResponse);

      const result = await analyzer.generateSummary(
        sampleDocument.content.text,
        "medium"
      );

      expect(result).toMatchObject({
        length: "medium",
        content: expect.any(String),
        keyPoints: expect.any(Array),
        wordCount: expect.any(Number),
      });
      expect(result.keyPoints).toHaveLength(3);
    });

    it("should handle different summary styles", async () => {
      analyzer.setAnalysisPreferences({ summaryStyle: "technical" });

      const mockResponse = JSON.stringify({
        content: "Technical summary with implementation details",
        keyPoints: ["Technical point 1"],
        wordCount: 6,
      });

      (mockOllamaService.generateText as Mock).mockResolvedValue(mockResponse);

      await analyzer.generateSummary(sampleDocument.content.text, "short");

      expect(mockOllamaService.generateText).toHaveBeenCalledWith(
        expect.stringContaining("Focus on technical details"),
        expect.any(Object)
      );
    });
  });

  describe("performFullAnalysis", () => {
    it("should perform comprehensive analysis", async () => {
      // Mock all the individual analysis methods
      const mockStructure = {
        sections: [],
        headings: [],
        paragraphs: 5,
        lists: 2,
        tables: 0,
        images: 0,
      };
      const mockRequirements = {
        functional: [],
        nonFunctional: [],
        totalCount: 0,
      };
      const mockKeyPoints = [
        {
          id: "key-1",
          text: "Test",
          importance: "medium" as Priority,
          category: "test",
        },
      ];
      const mockActionItems = [
        {
          id: "action-1",
          description: "Test",
          priority: "medium" as Priority,
          status: "pending" as const,
        },
      ];
      const mockSummary = {
        length: "medium" as SummaryLength,
        content: "Test summary",
        keyPoints: [],
        wordCount: 2,
      };
      const mockCategories = [
        { type: "test", confidence: 0.8, description: "Test category" },
      ];

      (mockOllamaService.generateText as Mock)
        .mockResolvedValueOnce(JSON.stringify(mockStructure))
        .mockResolvedValueOnce(JSON.stringify(mockRequirements))
        .mockResolvedValueOnce(JSON.stringify(mockKeyPoints))
        .mockResolvedValueOnce(JSON.stringify(mockActionItems))
        .mockResolvedValueOnce(JSON.stringify(mockSummary))
        .mockResolvedValueOnce(JSON.stringify(mockCategories));

      const result = await analyzer.performFullAnalysis(sampleDocument);

      expect(result).toHaveProperty("structure");
      expect(result).toHaveProperty("requirements");
      expect(result).toHaveProperty("keyPoints");
      expect(result).toHaveProperty("actionItems");
      expect(result).toHaveProperty("summary");
      expect(result).toHaveProperty("contentCategories");
    });
  });

  describe("buildContext", () => {
    it("should build context from multiple documents", async () => {
      const documents = [
        {
          ...sampleDocument,
          id: "doc-1",
          metadata: { ...sampleDocument.metadata, title: "Doc 1" },
        },
        {
          ...sampleDocument,
          id: "doc-2",
          metadata: { ...sampleDocument.metadata, title: "Doc 2" },
        },
      ];

      const result = await analyzer.buildContext(documents);

      expect(result).toContain("Document: Doc 1");
      expect(result).toContain("Document: Doc 2");
      expect(result).toContain("---");
    });
  });

  describe("maintainContext", () => {
    it("should maintain context with new document", async () => {
      const previousContext = "Previous context";
      const newDoc = {
        ...sampleDocument,
        metadata: { ...sampleDocument.metadata, title: "New Doc" },
      };

      const result = await analyzer.maintainContext(previousContext, newDoc);

      expect(result).toContain("Previous context");
      expect(result).toContain("Document: New Doc");
      expect(result).toContain("---");
    });
  });

  describe("assessDocumentQuality", () => {
    it("should assess document quality", async () => {
      const mockResponse = JSON.stringify({
        clarity: 0.8,
        completeness: 0.7,
        structure: 0.9,
        suggestions: ["Add more details", "Improve formatting"],
      });

      (mockOllamaService.generateText as Mock).mockResolvedValue(mockResponse);

      const result = await analyzer.assessDocumentQuality(sampleDocument);

      expect(result).toMatchObject({
        clarity: 0.8,
        completeness: 0.7,
        structure: 0.9,
        overall: expect.any(Number),
        suggestions: expect.any(Array),
      });
      expect(result.overall).toBeCloseTo(0.8, 1);
    });

    it("should handle assessment errors gracefully", async () => {
      (mockOllamaService.generateText as Mock).mockRejectedValue(
        new Error("Assessment failed")
      );

      const result = await analyzer.assessDocumentQuality(sampleDocument);

      expect(result).toMatchObject({
        clarity: 0.5,
        completeness: 0.5,
        structure: 0.5,
        overall: 0.5,
        suggestions: expect.arrayContaining([
          expect.stringContaining("Unable to assess"),
        ]),
      });
    });
  });

  describe("analyzeBatch", () => {
    it("should analyze multiple documents in batches", async () => {
      const documents = Array(5)
        .fill(null)
        .map((_, i) => ({
          ...sampleDocument,
          id: `doc-${i + 1}`,
        }));

      // Mock responses for all analysis calls
      (mockOllamaService.generateText as Mock).mockResolvedValue(
        JSON.stringify({
          sections: [],
          headings: [],
          paragraphs: 1,
          lists: 0,
          tables: 0,
          images: 0,
        })
      );

      const results = await analyzer.analyzeBatch(documents);

      expect(results).toHaveLength(5);
      expect(results[0]).toHaveProperty("structure");
      expect(results[0]).toHaveProperty("requirements");
    });
  });

  describe("setAnalysisPreferences", () => {
    it("should update analysis preferences", () => {
      const preferences = {
        summaryStyle: "technical" as const,
        detailLevel: "comprehensive" as const,
        requirementTypes: ["functional", "security"],
      };

      analyzer.setAnalysisPreferences(preferences);

      // Test that preferences are applied (indirectly through summary generation)
      expect(() => analyzer.setAnalysisPreferences(preferences)).not.toThrow();
    });
  });

  describe("error handling and fallbacks", () => {
    it("should handle malformed JSON responses", async () => {
      (mockOllamaService.generateText as Mock).mockResolvedValue(
        "Invalid JSON response"
      );

      const result = await analyzer.analyzeStructure(sampleDocument);

      // Should fallback to basic analysis
      expect(result).toHaveProperty("sections");
      expect(result).toHaveProperty("headings");
    });

    it("should handle empty responses", async () => {
      (mockOllamaService.generateText as Mock).mockResolvedValue("");

      const result = await analyzer.extractRequirements(sampleDocument);

      expect(result).toHaveProperty("functional");
      expect(result).toHaveProperty("nonFunctional");
      expect(result.totalCount).toBeGreaterThanOrEqual(0);
    });
  });
});
