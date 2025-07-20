import { describe, it, expect, beforeEach, vi, Mock } from "vitest";
import { DocumentAnalyzerImpl } from "../services/DocumentAnalyzerImpl.js";
import { OllamaService } from "@ai-toolkit/ollama-interface";
import { ProcessedDocument, DocumentType, Priority } from "@ai-toolkit/shared";

// Mock the OllamaService
const mockOllamaService = {
  generateText: vi.fn(),
  isConnected: vi.fn(() => true),
  getCurrentModel: vi.fn(() => "test-model"),
} as unknown as OllamaService;

describe("Enhanced Document Analysis Features (Task 3.2)", () => {
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
        text: `# Project Implementation Plan

## Critical Tasks
- Complete user authentication system by March 15th, 2024 (assigned to John Smith)
- Implement database schema before April 1st (high priority)
- Conduct security audit by May 1st, 2024 (critical priority, responsible: Security Team)
- Set up CI/CD pipeline due February 28th
- Create API documentation (low priority, optional)

## Important Deadlines
The system must be deployed by June 1st, 2024.
All testing should be completed before 05/15/2024.
Code review deadline: 2024-04-20

## Key Requirements
- The application shall support 10,000 concurrent users
- Response time must be under 2 seconds
- Data encryption is required for all sensitive information
- The system should be available 99.9% of the time`,
        metadata: {},
      },
      metadata: {
        title: "Project Implementation Plan",
        pageCount: 1,
        wordCount: 150,
      },
    };
  });

  describe("Enhanced Action Item Extraction", () => {
    it("should extract action items with priority detection", async () => {
      // Test fallback to enhanced extraction when AI fails
      (mockOllamaService.generateText as Mock).mockRejectedValue(
        new Error("AI service error")
      );

      const result = await analyzer.identifyActionItems(
        sampleDocument.content.text
      );

      expect(result.length).toBeGreaterThan(0);

      // Check for critical priority detection
      const criticalItems = result.filter(
        (item) => item.priority === "critical"
      );
      expect(criticalItems.length).toBeGreaterThan(0);

      // Check for high priority detection
      const highPriorityItems = result.filter(
        (item) => item.priority === "high"
      );
      expect(highPriorityItems.length).toBeGreaterThan(0);

      // Check for low priority detection
      const lowPriorityItems = result.filter((item) => item.priority === "low");
      expect(lowPriorityItems.length).toBeGreaterThan(0);
    });

    it("should extract deadlines from various date formats", async () => {
      (mockOllamaService.generateText as Mock).mockRejectedValue(
        new Error("AI service error")
      );

      const result = await analyzer.identifyActionItems(
        sampleDocument.content.text
      );

      // Check that some items have deadlines
      const itemsWithDeadlines = result.filter((item) => item.deadline);
      expect(itemsWithDeadlines.length).toBeGreaterThan(0);

      // Verify deadline extraction
      const marchDeadline = result.find(
        (item) => item.description.includes("March 15th") && item.deadline
      );
      expect(marchDeadline).toBeDefined();
      if (marchDeadline?.deadline) {
        expect(marchDeadline.deadline.getMonth()).toBe(2); // March is month 2 (0-indexed)
      }
    });

    it("should extract assignee information", async () => {
      (mockOllamaService.generateText as Mock).mockRejectedValue(
        new Error("AI service error")
      );

      const result = await analyzer.identifyActionItems(
        sampleDocument.content.text
      );

      // Check for assignee extraction
      const assignedItems = result.filter((item) => item.assignee);
      expect(assignedItems.length).toBeGreaterThan(0);

      // Verify specific assignee
      const johnSmithTask = result.find((item) =>
        item.assignee?.includes("John Smith")
      );
      expect(johnSmithTask).toBeDefined();

      const securityTeamTask = result.find((item) =>
        item.assignee?.includes("Security Team")
      );
      expect(securityTeamTask).toBeDefined();
    });

    it("should handle AI-powered action item extraction", async () => {
      const mockResponse = JSON.stringify([
        {
          id: "ai-action-1",
          description:
            "Complete user authentication system by March 15th, 2024",
          priority: "critical",
          deadline: "2024-03-15T00:00:00.000Z",
          assignee: "John Smith",
          status: "pending",
        },
        {
          id: "ai-action-2",
          description: "Conduct security audit",
          priority: "high",
          deadline: "2024-05-01T00:00:00.000Z",
          assignee: "Security Team",
          status: "pending",
        },
      ]);

      (mockOllamaService.generateText as Mock).mockResolvedValue(mockResponse);

      const result = await analyzer.identifyActionItems(
        sampleDocument.content.text
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: "ai-action-1",
        priority: "critical",
        assignee: "John Smith",
      });
      expect(result[0].deadline).toBeInstanceOf(Date);
    });
  });

  describe("Enhanced Key Point Extraction", () => {
    it("should extract key points with proper categorization", async () => {
      const mockResponse = JSON.stringify([
        {
          id: "key-1",
          text: "The application shall support 10,000 concurrent users",
          importance: "high",
          category: "performance-requirement",
          context: "Critical scalability requirement",
        },
        {
          id: "key-2",
          text: "Data encryption is required for all sensitive information",
          importance: "critical",
          category: "security-requirement",
          context: "Compliance and security mandate",
        },
        {
          id: "key-3",
          text: "System deployment deadline is June 1st, 2024",
          importance: "high",
          category: "constraint",
          context: "Project timeline constraint",
        },
      ]);

      (mockOllamaService.generateText as Mock).mockResolvedValue(mockResponse);

      const result = await analyzer.extractKeyPoints(
        sampleDocument.content.text
      );

      expect(result).toHaveLength(3);

      // Verify categorization
      const securityReq = result.find(
        (point) => point.category === "security-requirement"
      );
      expect(securityReq).toBeDefined();
      expect(securityReq?.importance).toBe("critical");

      const performanceReq = result.find(
        (point) => point.category === "performance-requirement"
      );
      expect(performanceReq).toBeDefined();
      expect(performanceReq?.importance).toBe("high");

      const constraint = result.find(
        (point) => point.category === "constraint"
      );
      expect(constraint).toBeDefined();
    });
  });

  describe("Enhanced Summary Generation", () => {
    it("should generate summaries with different styles", async () => {
      const technicalSummary = JSON.stringify({
        content:
          "Technical implementation plan focusing on authentication systems, database architecture, and CI/CD pipeline setup with specific deployment requirements.",
        keyPoints: [
          "User authentication system implementation",
          "Database schema design",
          "CI/CD pipeline configuration",
          "Security audit requirements",
          "Performance specifications",
        ],
        wordCount: 25,
      });

      (mockOllamaService.generateText as Mock).mockResolvedValue(
        technicalSummary
      );

      // Test technical style
      analyzer.setAnalysisPreferences({ summaryStyle: "technical" });
      const techResult = await analyzer.generateSummary(
        sampleDocument.content.text,
        "medium"
      );

      expect(techResult.content).toContain("Technical");
      expect(techResult.keyPoints).toHaveLength(5);
      expect(techResult.length).toBe("medium");

      // Test executive style
      const executiveSummary = JSON.stringify({
        content:
          "Strategic project implementation plan with critical deadlines and resource allocation for system deployment by June 2024.",
        keyPoints: [
          "June 2024 deployment target",
          "Critical security requirements",
          "Performance scalability goals",
        ],
        wordCount: 18,
      });

      (mockOllamaService.generateText as Mock).mockResolvedValue(
        executiveSummary
      );
      analyzer.setAnalysisPreferences({ summaryStyle: "executive" });

      const execResult = await analyzer.generateSummary(
        sampleDocument.content.text,
        "short"
      );
      expect(execResult.content).toContain("Strategic");
      expect(execResult.keyPoints).toHaveLength(3);
    });

    it("should handle different summary lengths", async () => {
      const shortSummary = JSON.stringify({
        content: "Project plan with critical tasks and June 2024 deadline.",
        keyPoints: ["Critical tasks", "June deadline"],
        wordCount: 9,
      });

      const longSummary = JSON.stringify({
        content:
          "Comprehensive project implementation plan detailing critical authentication system development, database schema implementation, security audit requirements, and CI/CD pipeline setup. The plan includes specific deadlines with system deployment scheduled for June 1st, 2024, and emphasizes performance requirements including 10,000 concurrent user support and sub-2-second response times. Security measures mandate data encryption for sensitive information with 99.9% system availability targets.",
        keyPoints: [
          "Authentication system development",
          "Database schema implementation",
          "Security audit requirements",
          "CI/CD pipeline setup",
          "June 2024 deployment deadline",
          "Performance and security requirements",
        ],
        wordCount: 65,
      });

      // Test short summary
      (mockOllamaService.generateText as Mock).mockResolvedValue(shortSummary);
      const shortResult = await analyzer.generateSummary(
        sampleDocument.content.text,
        "short"
      );
      expect(shortResult.length).toBe("short");
      expect(shortResult.wordCount).toBeLessThan(20);

      // Test long summary
      (mockOllamaService.generateText as Mock).mockResolvedValue(longSummary);
      const longResult = await analyzer.generateSummary(
        sampleDocument.content.text,
        "long"
      );
      expect(longResult.length).toBe("long");
      expect(longResult.wordCount).toBeGreaterThan(50);
      expect(longResult.keyPoints).toHaveLength(6);
    });
  });

  describe("Enhanced Context Maintenance", () => {
    it("should build comprehensive context with document relationships", async () => {
      const documents = [
        {
          ...sampleDocument,
          id: "doc-1",
          metadata: {
            ...sampleDocument.metadata,
            title: "Requirements Document",
          },
          analysis: {
            structure: {
              sections: [],
              headings: [],
              paragraphs: 10,
              lists: 2,
              tables: 0,
              images: 0,
            },
            requirements: { functional: [], nonFunctional: [], totalCount: 5 },
            keyPoints: [
              {
                id: "k1",
                text: "Test",
                importance: "high" as Priority,
                category: "authentication",
              },
              {
                id: "k2",
                text: "Test",
                importance: "medium" as Priority,
                category: "security",
              },
            ],
            actionItems: [
              {
                id: "a1",
                description: "Test",
                priority: "high" as Priority,
                status: "pending" as const,
              },
            ],
            summary: {
              length: "medium" as const,
              content: "Requirements summary",
              keyPoints: [],
              wordCount: 10,
            },
            contentCategories: [],
          },
        },
        {
          ...sampleDocument,
          id: "doc-2",
          metadata: {
            ...sampleDocument.metadata,
            title: "Technical Specification",
          },
          analysis: {
            structure: {
              sections: [],
              headings: [],
              paragraphs: 15,
              lists: 3,
              tables: 1,
              images: 0,
            },
            requirements: { functional: [], nonFunctional: [], totalCount: 8 },
            keyPoints: [
              {
                id: "k3",
                text: "Test",
                importance: "high" as Priority,
                category: "authentication",
              },
              {
                id: "k4",
                text: "Test",
                importance: "medium" as Priority,
                category: "performance",
              },
            ],
            actionItems: [
              {
                id: "a2",
                description: "Test",
                priority: "medium" as Priority,
                status: "pending" as const,
              },
            ],
            summary: {
              length: "medium" as const,
              content: "Technical summary",
              keyPoints: [],
              wordCount: 12,
            },
            contentCategories: [],
          },
        },
      ];

      const context = await analyzer.buildContext(documents);

      expect(context).toContain("Requirements Document");
      expect(context).toContain("Technical Specification");
      expect(context).toContain("Type: requirements");
      expect(context).toContain("Type: technical");
      expect(context).toContain("Key Themes: authentication, security");
      expect(context).toContain("Key Requirements: 5");
      expect(context).toContain("Key Requirements: 8");
      expect(context).toContain("DOCUMENT RELATIONSHIPS");
      expect(context).toContain("share common themes: authentication");
    });

    it("should maintain context with relationship analysis", async () => {
      const previousContext = `Document: Previous Doc
Type: requirements
Key Themes: authentication, security
Summary: Previous document summary
Key Requirements: 3
Action Items: 2`;

      const relationshipResponse =
        "The new document extends the authentication requirements with specific implementation details.";
      (mockOllamaService.generateText as Mock).mockResolvedValue(
        relationshipResponse
      );

      const newDoc = {
        ...sampleDocument,
        metadata: { ...sampleDocument.metadata, title: "Implementation Guide" },
      };

      const updatedContext = await analyzer.maintainContext(
        previousContext,
        newDoc
      );

      expect(updatedContext).toContain("Previous Doc");
      expect(updatedContext).toContain("Implementation Guide");
      expect(updatedContext).toContain("Type: technical");
      expect(updatedContext).toContain(
        "Relationship: The new document extends"
      );
    });

    it("should detect document relationships correctly", async () => {
      const reqDoc = {
        ...sampleDocument,
        id: "req-doc",
        metadata: { ...sampleDocument.metadata, title: "System Requirements" },
        analysis: {
          structure: {
            sections: [],
            headings: [],
            paragraphs: 10,
            lists: 2,
            tables: 0,
            images: 0,
          },
          requirements: { functional: [], nonFunctional: [], totalCount: 10 },
          keyPoints: [
            {
              id: "k1",
              text: "Auth req",
              importance: "high" as Priority,
              category: "authentication",
            },
            {
              id: "k2",
              text: "Sec req",
              importance: "high" as Priority,
              category: "security",
            },
          ],
          actionItems: [],
          summary: {
            length: "medium" as const,
            content: "Requirements",
            keyPoints: [],
            wordCount: 5,
          },
          contentCategories: [],
        },
      };

      const techDoc = {
        ...sampleDocument,
        id: "tech-doc",
        metadata: {
          ...sampleDocument.metadata,
          title: "Technical Architecture",
        },
        analysis: {
          structure: {
            sections: [],
            headings: [],
            paragraphs: 15,
            lists: 1,
            tables: 2,
            images: 0,
          },
          requirements: { functional: [], nonFunctional: [], totalCount: 5 },
          keyPoints: [
            {
              id: "k3",
              text: "Auth impl",
              importance: "high" as Priority,
              category: "authentication",
            },
            {
              id: "k4",
              text: "Perf spec",
              importance: "medium" as Priority,
              category: "performance",
            },
          ],
          actionItems: [],
          summary: {
            length: "medium" as const,
            content: "Technical details",
            keyPoints: [],
            wordCount: 8,
          },
          contentCategories: [],
        },
      };

      const context = await analyzer.buildContext([reqDoc, techDoc]);

      expect(context).toContain("DOCUMENT RELATIONSHIPS");
      expect(context).toContain(
        "System Requirements (requirements) and Technical Architecture (technical) appear to be related implementation documents"
      );
      expect(context).toContain("share common themes: authentication");
    });
  });

  describe("Document Type Inference", () => {
    it("should correctly infer document types", async () => {
      const testCases = [
        {
          title: "System Requirements Document",
          content:
            "The system shall provide authentication. Users must be able to login.",
          expectedType: "requirements",
        },
        {
          title: "Technical Architecture Specification",
          content:
            "The system architecture includes microservices and API gateway implementation.",
          expectedType: "technical",
        },
        {
          title: "Project Proposal",
          content:
            "The total budget for this project is $500,000 with expected ROI of 200%.",
          expectedType: "proposal",
        },
        {
          title: "UI Design Document",
          content:
            "The wireframes show the user interface mockup with navigation elements.",
          expectedType: "design",
        },
        {
          title: "General Document",
          content:
            "This is a general business document with various information.",
          expectedType: "general",
        },
      ];

      for (const testCase of testCases) {
        const doc = {
          ...sampleDocument,
          metadata: { ...sampleDocument.metadata, title: testCase.title },
          content: { ...sampleDocument.content, text: testCase.content },
        };

        const context = await analyzer.buildContext([doc]);
        expect(context).toContain(`Type: ${testCase.expectedType}`);
      }
    });
  });

  describe("Error Handling and Fallbacks", () => {
    it("should gracefully handle AI service failures", async () => {
      (mockOllamaService.generateText as Mock).mockRejectedValue(
        new Error("Service unavailable")
      );

      // All methods should still work with fallbacks
      const [actionItems, keyPoints, summary, categories] = await Promise.all([
        analyzer.identifyActionItems(sampleDocument.content.text),
        analyzer.extractKeyPoints(sampleDocument.content.text),
        analyzer.generateSummary(sampleDocument.content.text, "medium"),
        analyzer.categorizeContent(sampleDocument.content.text),
      ]);

      expect(Array.isArray(actionItems)).toBe(true);
      expect(Array.isArray(keyPoints)).toBe(true);
      expect(summary).toHaveProperty("content");
      expect(Array.isArray(categories)).toBe(true);
    });

    it("should handle context analysis failures gracefully", async () => {
      (mockOllamaService.generateText as Mock).mockRejectedValue(
        new Error("Context analysis failed")
      );

      const previousContext = "Previous context";
      const newDoc = { ...sampleDocument };

      const result = await analyzer.maintainContext(previousContext, newDoc);

      expect(result).toContain("Previous context");
      expect(result).toContain("Project Implementation Plan");
      // Should not contain relationship analysis due to failure
      expect(result).not.toContain("Relationship:");
    });
  });
});
