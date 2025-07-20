import { describe, it, expect, beforeEach, vi } from "vitest";
import { ComplexityAnalyzer } from "../complexity/ComplexityAnalyzer.js";
import { OllamaService } from "@ai-toolkit/ollama-interface";
import { Requirement, ProjectData } from "@ai-toolkit/shared";

// Mock OllamaService
const mockOllamaService = {
  generateText: vi.fn(),
  isConnected: vi.fn().mockReturnValue(true),
  connect: vi.fn().mockResolvedValue(true),
  getAvailableModels: vi.fn().mockResolvedValue([]),
  loadModel: vi.fn().mockResolvedValue(undefined),
  unloadModel: vi.fn().mockResolvedValue(undefined),
  getCurrentModel: vi.fn().mockReturnValue("llama2"),
} as any;

describe("ComplexityAnalyzer", () => {
  let analyzer: ComplexityAnalyzer;

  beforeEach(() => {
    analyzer = new ComplexityAnalyzer(mockOllamaService);
    vi.clearAllMocks();
  });

  describe("calculateComplexity", () => {
    it("should calculate complexity for simple requirements", async () => {
      const requirements: Requirement[] = [
        {
          id: "1",
          type: "functional",
          priority: "low",
          description: "Create a simple user registration form",
          acceptanceCriteria: ["Form has email and password fields"],
          complexity: 0,
          estimatedHours: 0,
        },
      ];

      mockOllamaService.generateText.mockResolvedValue("3");

      const result = await analyzer.calculateComplexity(requirements);

      expect(result.overall).toBeGreaterThan(0);
      expect(result.overall).toBeLessThanOrEqual(10);
      expect(result.technical).toBeGreaterThan(0);
      expect(result.business).toBeGreaterThan(0);
      expect(result.integration).toBeGreaterThan(0);
      expect(result.factors).toBeInstanceOf(Array);
    });

    it("should handle complex technical requirements", async () => {
      const requirements: Requirement[] = [
        {
          id: "1",
          type: "functional",
          priority: "high",
          description:
            "Implement machine learning algorithm for real-time fraud detection with API integration",
          acceptanceCriteria: [
            "ML model accuracy > 95%",
            "Response time < 100ms",
          ],
          complexity: 0,
          estimatedHours: 0,
        },
      ];

      mockOllamaService.generateText.mockResolvedValue("9");

      const result = await analyzer.calculateComplexity(requirements);

      expect(result.overall).toBeGreaterThan(2);
      expect(result.technical).toBeGreaterThan(2);
      expect(result.factors.length).toBeGreaterThan(0);
    });

    it("should handle integration requirements", async () => {
      const requirements: Requirement[] = [
        {
          id: "1",
          type: "functional",
          priority: "medium",
          description:
            "Integrate with third-party payment gateway and sync data with external CRM",
          acceptanceCriteria: [
            "Payment processing works",
            "Data syncs correctly",
          ],
          complexity: 0,
          estimatedHours: 0,
        },
      ];

      mockOllamaService.generateText.mockResolvedValue("7");

      const result = await analyzer.calculateComplexity(requirements);

      expect(result.integration).toBeGreaterThan(result.business);
      expect(result.factors.some((f) => f.name.includes("Integration"))).toBe(
        true
      );
    });

    it("should handle AI service failures gracefully", async () => {
      const requirements: Requirement[] = [
        {
          id: "1",
          type: "functional",
          priority: "medium",
          description: "Create user dashboard",
          acceptanceCriteria: ["Dashboard shows user data"],
          complexity: 0,
          estimatedHours: 0,
        },
      ];

      mockOllamaService.generateText.mockRejectedValue(
        new Error("AI service unavailable")
      );

      const result = await analyzer.calculateComplexity(requirements);

      // Should still return valid complexity scores using heuristics
      expect(result.overall).toBeGreaterThan(0);
      expect(result.overall).toBeLessThanOrEqual(10);
    });
  });

  describe("analyzeRequirementComplexity", () => {
    it("should parse AI response correctly", async () => {
      mockOllamaService.generateText.mockResolvedValue("Score: 7.5");

      const requirement: Requirement = {
        id: "1",
        type: "functional",
        priority: "medium",
        description: "Complex algorithm implementation",
        acceptanceCriteria: [],
        complexity: 0,
        estimatedHours: 0,
      };

      const result = await analyzer.analyzeRequirementComplexity(requirement);

      expect(result).toBe(7.5);
    });

    it("should handle non-numeric AI responses", async () => {
      mockOllamaService.generateText.mockResolvedValue(
        "This is very complex and difficult"
      );

      const requirement: Requirement = {
        id: "1",
        type: "functional",
        priority: "medium",
        description: "Complex feature",
        acceptanceCriteria: [],
        complexity: 0,
        estimatedHours: 0,
      };

      const result = await analyzer.analyzeRequirementComplexity(requirement);

      expect(result).toBeGreaterThan(5); // Should detect "complex" keyword
    });

    it("should use heuristic analysis when AI fails", async () => {
      mockOllamaService.generateText.mockRejectedValue(new Error("AI failed"));

      const requirement: Requirement = {
        id: "1",
        type: "non-functional",
        priority: "high",
        description: "Implement distributed machine learning system",
        acceptanceCriteria: [],
        complexity: 0,
        estimatedHours: 0,
      };

      const result = await analyzer.analyzeRequirementComplexity(requirement);

      expect(result).toBeGreaterThan(7); // Should be high due to keywords and type
    });
  });

  describe("historical data integration", () => {
    it("should adjust complexity based on historical data", async () => {
      const historicalProject: ProjectData = {
        id: "hist-1",
        name: "Similar Project",
        actualHours: 120,
        estimatedHours: 100,
        requirements: [
          {
            id: "1",
            type: "functional",
            priority: "medium",
            description: "Create user dashboard with analytics",
            acceptanceCriteria: [],
            complexity: 0,
            estimatedHours: 0,
          },
        ],
        completedAt: new Date(),
      };

      analyzer.addHistoricalProject(historicalProject);

      const requirements: Requirement[] = [
        {
          id: "1",
          type: "functional",
          priority: "medium",
          description: "Create user dashboard with reporting",
          acceptanceCriteria: [],
          complexity: 0,
          estimatedHours: 0,
        },
      ];

      mockOllamaService.generateText.mockResolvedValue("5");

      const result = await analyzer.calculateComplexity(requirements);

      // Should be adjusted upward due to historical underestimation
      expect(result.overall).toBeGreaterThan(1);
    });

    it("should manage historical data size", () => {
      // Add more than 100 projects
      for (let i = 0; i < 105; i++) {
        const project: ProjectData = {
          id: `proj-${i}`,
          name: `Project ${i}`,
          actualHours: 100,
          estimatedHours: 90,
          requirements: [],
          completedAt: new Date(),
        };
        analyzer.addHistoricalProject(project);
      }

      const historicalData = analyzer.getHistoricalData();
      expect(historicalData.length).toBe(100); // Should be capped at 100
    });
  });

  describe("complexity factors configuration", () => {
    it("should allow updating complexity factors", () => {
      const newFactors = {
        technical: 1.5,
        integration: 2.0,
      };

      analyzer.updateComplexityFactors(newFactors);
      const factors = analyzer.getComplexityFactors();

      expect(factors.technical).toBe(1.5);
      expect(factors.integration).toBe(2.0);
      expect(factors.business).toBe(0.8); // Should retain original value
    });

    it("should use custom factors in complexity calculation", async () => {
      analyzer.updateComplexityFactors({ technical: 2.0 });

      const requirements: Requirement[] = [
        {
          id: "1",
          type: "functional",
          priority: "medium",
          description: "Implement API with database integration",
          acceptanceCriteria: [],
          complexity: 0,
          estimatedHours: 0,
        },
      ];

      mockOllamaService.generateText.mockResolvedValue("5");

      const result = await analyzer.calculateComplexity(requirements);

      // Technical score should be amplified by the 2.0 factor
      expect(result.technical).toBeGreaterThan(5);
    });
  });

  describe("edge cases and error handling", () => {
    it("should handle empty requirements array", async () => {
      const result = await analyzer.calculateComplexity([]);

      expect(result.overall).toBeGreaterThan(0);
      expect(result.factors).toEqual([]);
    });

    it("should handle requirements with missing fields", async () => {
      const requirements: Requirement[] = [
        {
          id: "1",
          type: "functional",
          priority: "medium",
          description: "",
          acceptanceCriteria: [],
          complexity: 0,
          estimatedHours: 0,
        },
      ];

      mockOllamaService.generateText.mockResolvedValue("3");

      const result = await analyzer.calculateComplexity(requirements);

      expect(result.overall).toBeGreaterThan(0);
      expect(result.overall).toBeLessThanOrEqual(10);
    });

    it("should bound complexity scores within valid range", async () => {
      mockOllamaService.generateText.mockResolvedValue("15"); // Invalid high score

      const requirement: Requirement = {
        id: "1",
        type: "functional",
        priority: "medium",
        description: "Simple task",
        acceptanceCriteria: [],
        complexity: 0,
        estimatedHours: 0,
      };

      const result = await analyzer.analyzeRequirementComplexity(requirement);

      expect(result).toBeLessThanOrEqual(10);
      expect(result).toBeGreaterThanOrEqual(1);
    });
  });

  describe("requirement categorization", () => {
    it("should identify technical requirements correctly", async () => {
      const requirements: Requirement[] = [
        {
          id: "1",
          type: "functional",
          priority: "medium",
          description:
            "Implement API authentication with JWT tokens and database encryption",
          acceptanceCriteria: [],
          complexity: 0,
          estimatedHours: 0,
        },
      ];

      mockOllamaService.generateText.mockResolvedValue("7");

      const result = await analyzer.calculateComplexity(requirements);

      expect(result.factors.some((f) => f.name.includes("Technical"))).toBe(
        true
      );
    });

    it("should identify integration requirements correctly", async () => {
      const requirements: Requirement[] = [
        {
          id: "1",
          type: "functional",
          priority: "medium",
          description:
            "Connect to external payment gateway and sync with third-party CRM",
          acceptanceCriteria: [],
          complexity: 0,
          estimatedHours: 0,
        },
      ];

      mockOllamaService.generateText.mockResolvedValue("6");

      const result = await analyzer.calculateComplexity(requirements);

      expect(result.factors.some((f) => f.name.includes("Integration"))).toBe(
        true
      );
    });

    it("should identify testing complexity requirements", async () => {
      const requirements: Requirement[] = [
        {
          id: "1",
          type: "non-functional",
          priority: "high",
          description:
            "Ensure payment processing security and compliance with PCI DSS",
          acceptanceCriteria: [],
          complexity: 0,
          estimatedHours: 0,
        },
      ];

      mockOllamaService.generateText.mockResolvedValue("8");

      const result = await analyzer.calculateComplexity(requirements);

      expect(result.factors.some((f) => f.name.includes("Testing"))).toBe(true);
    });
  });
});
