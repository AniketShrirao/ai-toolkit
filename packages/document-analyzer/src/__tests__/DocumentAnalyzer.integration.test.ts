import { describe, it, expect, beforeEach, vi, Mock } from "vitest";
import { DocumentAnalyzerImpl } from "../services/DocumentAnalyzerImpl.js";
import { OllamaService } from "@ai-toolkit/ollama-interface";
import {
  businessRequirementsDocument,
  technicalSpecDocument,
  projectProposalDocument,
} from "./fixtures/business-requirements.js";

// Mock the OllamaService with realistic responses
const mockOllamaService = {
  generateText: vi.fn(),
  isConnected: vi.fn(() => true),
  getCurrentModel: vi.fn(() => "llama2:7b"),
} as unknown as OllamaService;

describe("DocumentAnalyzer Integration Tests", () => {
  let analyzer: DocumentAnalyzerImpl;

  beforeEach(() => {
    analyzer = new DocumentAnalyzerImpl(mockOllamaService);
    vi.clearAllMocks();
  });

  describe("Business Requirements Document Analysis", () => {
    it("should extract functional and non-functional requirements correctly", async () => {
      const mockRequirementsResponse = JSON.stringify({
        functional: [
          {
            id: "req-001",
            type: "functional",
            priority: "high",
            description:
              "The system must provide comprehensive user authentication and authorization",
            acceptanceCriteria: [
              "Users can register using email or social media accounts",
              "Role-based access control for different user types",
              "Multi-factor authentication for admin accounts",
            ],
            complexity: 7,
            estimatedHours: 40,
            category: "authentication",
            source: "User Management section",
          },
          {
            id: "req-002",
            type: "functional",
            description:
              "The system must support unlimited product categories and subcategories",
            priority: "high",
            acceptanceCriteria: [
              "Products have detailed descriptions and multiple images",
              "Advanced search and filtering capabilities",
              "Real-time inventory tracking across warehouses",
            ],
            complexity: 8,
            estimatedHours: 60,
            category: "catalog",
            source: "Product Catalog section",
          },
          {
            id: "req-003",
            type: "functional",
            description:
              "Multiple payment methods must be supported including credit cards, PayPal, and digital wallets",
            priority: "high",
            acceptanceCriteria: [
              "Automatic calculation of taxes and shipping",
              "Guest checkout functionality available",
              "Secure payment processing",
            ],
            complexity: 9,
            estimatedHours: 80,
            category: "payment",
            source: "Shopping Cart and Checkout section",
          },
        ],
        nonFunctional: [
          {
            id: "nfr-001",
            type: "non-functional",
            priority: "high",
            description:
              "The system shall respond to user requests within 2 seconds under normal load",
            acceptanceCriteria: [
              "Page load times must not exceed 3 seconds for 95% of requests",
              "Database queries optimized for sub-second response times",
            ],
            complexity: 6,
            estimatedHours: 32,
            category: "performance",
            source: "Performance Requirements section",
          },
          {
            id: "nfr-002",
            type: "non-functional",
            priority: "critical",
            description:
              "All user data must be encrypted both in transit and at rest",
            acceptanceCriteria: [
              "PCI DSS compliance for payment processing",
              "Regular security audits and penetration testing",
              "Multi-factor authentication for admin accounts",
            ],
            complexity: 8,
            estimatedHours: 48,
            category: "security",
            source: "Security Requirements section",
          },
          {
            id: "nfr-003",
            type: "non-functional",
            priority: "medium",
            description:
              "The platform should handle 10,000 concurrent users without degradation",
            acceptanceCriteria: [
              "Horizontal scaling support for traffic spikes",
              "Database sharding for large datasets",
              "CDN integration for global content delivery",
            ],
            complexity: 9,
            estimatedHours: 72,
            category: "scalability",
            source: "Scalability Requirements section",
          },
        ],
      });

      (mockOllamaService.generateText as Mock).mockResolvedValue(
        mockRequirementsResponse
      );

      const result = await analyzer.extractRequirements(
        businessRequirementsDocument
      );

      expect(result.functional).toHaveLength(3);
      expect(result.nonFunctional).toHaveLength(3);
      expect(result.totalCount).toBe(6);

      // Verify functional requirements
      expect(result.functional[0]).toMatchObject({
        type: "functional",
        priority: "high",
        category: "authentication",
        complexity: 7,
        estimatedHours: 40,
      });

      // Verify non-functional requirements
      expect(result.nonFunctional[0]).toMatchObject({
        type: "non-functional",
        priority: "high",
        category: "performance",
        complexity: 6,
      });

      // Verify critical security requirement
      const securityReq = result.nonFunctional.find(
        (req) => req.category === "security"
      );
      expect(securityReq).toBeDefined();
      expect(securityReq?.priority).toBe("critical");
    });

    it("should identify action items with priorities and deadlines", async () => {
      const mockActionItemsResponse = JSON.stringify([
        {
          id: "action-001",
          description:
            "Complete technical architecture design by February 15th",
          priority: "high",
          deadline: "2024-02-15T00:00:00.000Z",
          status: "pending",
        },
        {
          id: "action-002",
          description: "Develop user authentication module by March 1st",
          priority: "high",
          deadline: "2024-03-01T00:00:00.000Z",
          status: "pending",
        },
        {
          id: "action-003",
          description: "Conduct security audit by May 1st",
          priority: "critical",
          deadline: "2024-05-01T00:00:00.000Z",
          status: "pending",
        },
        {
          id: "action-004",
          description: "Perform load testing with 10,000 concurrent users",
          priority: "medium",
          status: "pending",
        },
      ]);

      (mockOllamaService.generateText as Mock).mockResolvedValue(
        mockActionItemsResponse
      );

      const result = await analyzer.identifyActionItems(
        businessRequirementsDocument.content.text
      );

      expect(result).toHaveLength(4);

      // Verify high priority items with deadlines
      const architectureTask = result.find((item) =>
        item.description.includes("technical architecture")
      );
      expect(architectureTask).toBeDefined();
      expect(architectureTask?.priority).toBe("high");
      expect(architectureTask?.deadline).toBeInstanceOf(Date);

      // Verify critical security audit
      const securityAudit = result.find((item) =>
        item.description.includes("security audit")
      );
      expect(securityAudit?.priority).toBe("critical");
    });

    it("should extract key business points", async () => {
      const mockKeyPointsResponse = JSON.stringify([
        {
          id: "key-001",
          text: "Increase online sales by 300% within 12 months",
          importance: "high",
          category: "business-objective",
          context: "Primary business goal driving the project",
        },
        {
          id: "key-002",
          text: "Support up to 10,000 concurrent users",
          importance: "high",
          category: "performance-requirement",
          context: "Critical scalability requirement",
        },
        {
          id: "key-003",
          text: "Achieve 99.9% uptime",
          importance: "high",
          category: "availability-requirement",
          context: "Service level agreement target",
        },
        {
          id: "key-004",
          text: "Budget allocation is $500,000 for the entire project",
          importance: "medium",
          category: "constraint",
          context: "Financial constraint that impacts scope",
        },
      ]);

      (mockOllamaService.generateText as Mock).mockResolvedValue(
        mockKeyPointsResponse
      );

      const result = await analyzer.extractKeyPoints(
        businessRequirementsDocument.content.text
      );

      expect(result).toHaveLength(4);

      // Verify business objectives are captured
      const salesGoal = result.find((point) => point.text.includes("300%"));
      expect(salesGoal).toBeDefined();
      expect(salesGoal?.importance).toBe("high");
      expect(salesGoal?.category).toBe("business-objective");

      // Verify constraints are identified
      const budgetConstraint = result.find((point) =>
        point.text.includes("$500,000")
      );
      expect(budgetConstraint?.category).toBe("constraint");
    });
  });

  describe("Technical Specification Document Analysis", () => {
    it("should categorize technical content correctly", async () => {
      const mockCategoriesResponse = JSON.stringify([
        {
          type: "technical-specification",
          confidence: 0.95,
          description:
            "Contains detailed technical architecture and implementation details",
        },
        {
          type: "system-design",
          confidence: 0.9,
          description:
            "Includes microservices architecture patterns and database design",
        },
        {
          type: "implementation-guide",
          confidence: 0.85,
          description:
            "Provides specific technology stack and deployment strategies",
        },
      ]);

      (mockOllamaService.generateText as Mock).mockResolvedValue(
        mockCategoriesResponse
      );

      const result = await analyzer.categorizeContent(
        technicalSpecDocument.content.text
      );

      expect(result).toHaveLength(3);
      expect(result[0].type).toBe("technical-specification");
      expect(result[0].confidence).toBeGreaterThan(0.9);

      // Verify system design category
      const systemDesign = result.find((cat) => cat.type === "system-design");
      expect(systemDesign).toBeDefined();
      expect(systemDesign?.confidence).toBeGreaterThan(0.8);
    });

    it("should extract technical action items", async () => {
      const mockTechnicalActionsResponse = JSON.stringify([
        {
          id: "tech-001",
          description: "Set up development environment with Docker Compose",
          priority: "high",
          status: "pending",
        },
        {
          id: "tech-002",
          description:
            "Create base microservice template with common middleware",
          priority: "high",
          status: "pending",
        },
        {
          id: "tech-003",
          description: "Implement user authentication service with JWT",
          priority: "high",
          status: "pending",
        },
        {
          id: "tech-004",
          description: "Set up API gateway for request routing",
          priority: "medium",
          status: "pending",
        },
        {
          id: "tech-005",
          description: "Conduct performance testing with realistic load",
          priority: "medium",
          status: "pending",
        },
      ]);

      (mockOllamaService.generateText as Mock).mockResolvedValue(
        mockTechnicalActionsResponse
      );

      const result = await analyzer.identifyActionItems(
        technicalSpecDocument.content.text
      );

      expect(result).toHaveLength(5);

      // Verify technical setup tasks
      const dockerSetup = result.find((item) =>
        item.description.includes("Docker Compose")
      );
      expect(dockerSetup?.priority).toBe("high");

      // Verify authentication implementation
      const authTask = result.find((item) =>
        item.description.includes("authentication service")
      );
      expect(authTask?.priority).toBe("high");
    });
  });

  describe("Project Proposal Document Analysis", () => {
    it("should perform comprehensive analysis of business proposal", async () => {
      // Mock all analysis responses
      const mockStructureResponse = JSON.stringify({
        sections: [
          {
            id: "exec-summary",
            title: "Executive Summary",
            level: 2,
            content: "We propose a comprehensive...",
          },
          {
            id: "current-state",
            title: "Current State Analysis",
            level: 2,
            content: "Your organization currently...",
          },
          {
            id: "solution",
            title: "Proposed Solution",
            level: 2,
            content: "Our digital transformation...",
          },
        ],
        headings: [
          { level: 1, text: "Digital Transformation Initiative Proposal" },
          { level: 2, text: "Executive Summary" },
          { level: 2, text: "Current State Analysis" },
        ],
        paragraphs: 25,
        lists: 8,
        tables: 2,
        images: 0,
      });

      const mockSummaryResponse = JSON.stringify({
        content:
          "This proposal outlines an 18-month digital transformation initiative to modernize technology infrastructure and business processes. The program includes cloud migration, process automation, and AI implementation across three phases, with expected ROI of 250% and $2.5M annual cost savings.",
        keyPoints: [
          "18-month digital transformation program",
          "$3.2M total investment with 15-month payback",
          "40% reduction in manual processing time",
          "Three-phase implementation approach",
          "$2.5M annual cost savings expected",
        ],
        wordCount: 52,
      });

      const mockKeyPointsResponse = JSON.stringify([
        {
          id: "key-001",
          text: "$2.5M annual cost savings from process automation",
          importance: "high",
          category: "financial-benefit",
        },
        {
          id: "key-002",
          text: "ROI of 250% within 24 months",
          importance: "high",
          category: "financial-benefit",
        },
        {
          id: "key-003",
          text: "Total Project Cost: $3.2 million over 18 months",
          importance: "high",
          category: "investment",
        },
      ]);

      (mockOllamaService.generateText as Mock)
        .mockResolvedValueOnce(mockStructureResponse)
        .mockResolvedValueOnce(
          JSON.stringify({ functional: [], nonFunctional: [] })
        )
        .mockResolvedValueOnce(mockKeyPointsResponse)
        .mockResolvedValueOnce(JSON.stringify([]))
        .mockResolvedValueOnce(mockSummaryResponse)
        .mockResolvedValueOnce(
          JSON.stringify([
            {
              type: "business-proposal",
              confidence: 0.9,
              description: "Comprehensive business proposal",
            },
          ])
        );

      const result = await analyzer.performFullAnalysis(
        projectProposalDocument
      );

      expect(result).toHaveProperty("structure");
      expect(result).toHaveProperty("summary");
      expect(result).toHaveProperty("keyPoints");

      // Verify structure analysis
      expect(result.structure.sections).toHaveLength(3);
      expect(result.structure.paragraphs).toBe(25);

      // Verify key financial points are captured
      expect(result.keyPoints).toHaveLength(3);
      const roiPoint = result.keyPoints.find((point) =>
        point.text.includes("250%")
      );
      expect(roiPoint?.category).toBe("financial-benefit");

      // Verify summary captures main points
      expect(result.summary.content).toContain("18-month");
      expect(result.summary.content).toContain("$2.5M");
      expect(result.summary.keyPoints).toHaveLength(5);
    });
  });

  describe("Batch Processing", () => {
    it("should analyze multiple business documents efficiently", async () => {
      const documents = [
        businessRequirementsDocument,
        technicalSpecDocument,
        projectProposalDocument,
      ];

      // Mock responses for all analysis calls
      (mockOllamaService.generateText as Mock).mockResolvedValue(
        JSON.stringify({
          sections: [],
          headings: [],
          paragraphs: 10,
          lists: 2,
          tables: 0,
          images: 0,
        })
      );

      const results = await analyzer.analyzeBatch(documents);

      expect(results).toHaveLength(3);

      // Verify each document was analyzed
      results.forEach((result) => {
        expect(result).toHaveProperty("structure");
        expect(result).toHaveProperty("requirements");
        expect(result).toHaveProperty("keyPoints");
        expect(result).toHaveProperty("actionItems");
        expect(result).toHaveProperty("summary");
        expect(result).toHaveProperty("contentCategories");
      });

      // Verify batch processing efficiency (should make multiple calls but not overwhelm)
      expect(mockOllamaService.generateText).toHaveBeenCalled();
    });
  });

  describe("Context Building", () => {
    it("should build comprehensive context from multiple related documents", async () => {
      const documents = [
        businessRequirementsDocument,
        technicalSpecDocument,
        projectProposalDocument,
      ];

      // Add mock analysis to documents
      documents.forEach((doc) => {
        doc.analysis = {
          structure: {
            sections: [],
            headings: [],
            paragraphs: 10,
            lists: 2,
            tables: 0,
            images: 0,
          },
          requirements: { functional: [], nonFunctional: [], totalCount: 0 },
          keyPoints: [],
          actionItems: [],
          summary: {
            length: "medium",
            content: `Summary of ${doc.metadata.title}`,
            keyPoints: [],
            wordCount: 20,
          },
          contentCategories: [],
        };
      });

      const context = await analyzer.buildContext(documents);

      expect(context).toContain("E-Commerce Platform Requirements");
      expect(context).toContain("Technical Architecture Specification");
      expect(context).toContain("Digital Transformation Initiative Proposal");
      expect(context).toContain("---"); // Section separators

      // Verify context structure
      const sections = context.split("---");
      expect(sections).toHaveLength(3);
    });
  });

  describe("Quality Assessment", () => {
    it("should assess document quality for business documents", async () => {
      const mockQualityResponse = JSON.stringify({
        clarity: 0.85,
        completeness: 0.9,
        structure: 0.8,
        suggestions: [
          "Add more specific acceptance criteria for requirements",
          "Include risk mitigation strategies",
          "Provide more detailed timeline estimates",
        ],
      });

      (mockOllamaService.generateText as Mock).mockResolvedValue(
        mockQualityResponse
      );

      const result = await analyzer.assessDocumentQuality(
        businessRequirementsDocument
      );

      expect(result.clarity).toBe(0.85);
      expect(result.completeness).toBe(0.9);
      expect(result.structure).toBe(0.8);
      expect(result.overall).toBeCloseTo(0.85, 2);
      expect(result.suggestions).toHaveLength(3);
      expect(result.suggestions[0]).toContain("acceptance criteria");
    });
  });

  describe("Analysis Preferences", () => {
    it("should apply different analysis styles based on preferences", async () => {
      // Set technical analysis preference
      analyzer.setAnalysisPreferences({
        summaryStyle: "technical",
        detailLevel: "comprehensive",
      });

      const mockTechnicalSummary = JSON.stringify({
        content:
          "Technical analysis focusing on implementation details, architecture patterns, and system requirements.",
        keyPoints: [
          "Microservices architecture",
          "Database design patterns",
          "API specifications",
        ],
        wordCount: 15,
      });

      (mockOllamaService.generateText as Mock).mockResolvedValue(
        mockTechnicalSummary
      );

      await analyzer.generateSummary(
        technicalSpecDocument.content.text,
        "medium"
      );

      // Verify technical style prompt was used
      expect(mockOllamaService.generateText).toHaveBeenCalledWith(
        expect.stringContaining("Focus on technical details"),
        expect.any(Object)
      );

      // Set business analysis preference
      analyzer.setAnalysisPreferences({
        summaryStyle: "business",
        detailLevel: "standard",
      });

      const mockBusinessSummary = JSON.stringify({
        content:
          "Business-focused analysis emphasizing ROI, cost savings, and strategic benefits.",
        keyPoints: [
          "Cost reduction",
          "Revenue increase",
          "Strategic advantages",
        ],
        wordCount: 12,
      });

      (mockOllamaService.generateText as Mock).mockResolvedValue(
        mockBusinessSummary
      );

      await analyzer.generateSummary(
        projectProposalDocument.content.text,
        "medium"
      );

      // Verify business style prompt was used
      expect(mockOllamaService.generateText).toHaveBeenCalledWith(
        expect.stringContaining("Balance technical and business perspectives"),
        expect.any(Object)
      );
    });
  });
});
