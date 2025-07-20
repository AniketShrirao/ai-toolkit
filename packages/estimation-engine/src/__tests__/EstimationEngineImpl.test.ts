import { describe, it, expect, beforeEach, vi } from "vitest";
import { EstimationEngineImpl } from "../estimation/EstimationEngineImpl.js";
import { OllamaService } from "@ai-toolkit/ollama-interface";
import {
  Requirement,
  ProjectData,
  ComplexityScore,
  RateConfiguration,
  TimeEstimate,
} from "@ai-toolkit/shared";

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

describe("EstimationEngineImpl", () => {
  let engine: EstimationEngineImpl;

  beforeEach(() => {
    engine = new EstimationEngineImpl(mockOllamaService);
    vi.clearAllMocks();
  });

  describe("generateTimeEstimate", () => {
    it("should generate time estimate from complexity score", async () => {
      const complexity: ComplexityScore = {
        overall: 6,
        technical: 7,
        business: 5,
        integration: 6,
        factors: [],
      };

      const result = await engine.generateTimeEstimate(complexity);

      expect(result.totalHours).toBeGreaterThan(0);
      expect(result.breakdown).toHaveLength(4); // Development, Testing, Documentation, Deployment
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.assumptions).toBeInstanceOf(Array);
      expect(result.assumptions.length).toBeGreaterThan(0);
    });

    it("should adjust estimates based on historical data", async () => {
      const complexity: ComplexityScore = {
        overall: 5,
        technical: 5,
        business: 5,
        integration: 5,
        factors: [],
      };

      const historicalData: ProjectData[] = [
        {
          id: "1",
          name: "Similar Project",
          actualHours: 120,
          estimatedHours: 100,
          requirements: [],
          completedAt: new Date(),
        },
      ];

      const result = await engine.generateTimeEstimate(
        complexity,
        historicalData
      );

      expect(result.totalHours).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThanOrEqual(0.7); // Should have higher confidence with historical data
    });

    it("should create proper breakdown categories", async () => {
      const complexity: ComplexityScore = {
        overall: 6,
        technical: 6,
        business: 6,
        integration: 6,
        factors: [],
      };

      const result = await engine.generateTimeEstimate(complexity);

      const categories = result.breakdown.map((b) => b.category);
      expect(categories).toContain("Development");
      expect(categories).toContain("Testing");
      expect(categories).toContain("Documentation");
      expect(categories).toContain("Deployment");

      // Check that breakdown adds up to total (within rounding)
      const breakdownTotal = result.breakdown.reduce(
        (sum, b) => sum + b.hours,
        0
      );
      expect(Math.abs(breakdownTotal - result.totalHours)).toBeLessThan(0.1);
    });
  });

  describe("estimateByCategory", () => {
    it("should estimate requirements by category", async () => {
      const requirements: Requirement[] = [
        {
          id: "1",
          type: "functional",
          priority: "medium",
          description: "Create user authentication system",
          acceptanceCriteria: [],
          complexity: 0,
          estimatedHours: 0,
        },
        {
          id: "2",
          type: "functional",
          priority: "medium",
          description: "Implement payment processing",
          acceptanceCriteria: [],
          complexity: 0,
          estimatedHours: 0,
        },
      ];

      mockOllamaService.generateText.mockResolvedValue("6");

      const categories = ["authentication", "payment"];
      const result = await engine.estimateByCategory(requirements, categories);

      expect(result.size).toBeGreaterThan(0);
      expect(result.has("authentication")).toBe(true);
      expect(result.has("payment")).toBe(true);
    });
  });

  describe("generateProjectEstimate", () => {
    it("should generate comprehensive project estimate", async () => {
      const requirements: Requirement[] = [
        {
          id: "1",
          type: "functional",
          priority: "high",
          description: "Build user management system",
          acceptanceCriteria: ["User registration", "User login"],
          complexity: 0,
          estimatedHours: 0,
        },
      ];

      mockOllamaService.generateText.mockResolvedValue("5");

      const result = await engine.generateProjectEstimate(requirements, {
        includeRisks: true,
        useHistoricalData: false,
      });

      expect(result.id).toBeDefined();
      expect(result.totalHours).toBeGreaterThan(0);
      expect(result.totalCost).toBeGreaterThan(0);
      expect(result.breakdown).toBeInstanceOf(Array);
      expect(result.assumptions).toBeInstanceOf(Array);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.requirements).toEqual(requirements);
    });

    it("should include risks when requested", async () => {
      const requirements: Requirement[] = [
        {
          id: "1",
          type: "functional",
          priority: "high",
          description: "Implement real-time machine learning system",
          acceptanceCriteria: ["ML model deployment"],
          complexity: 0,
          estimatedHours: 0,
        },
      ];

      mockOllamaService.generateText.mockResolvedValue("8");

      const result = await engine.generateProjectEstimate(requirements, {
        includeRisks: true,
      });

      expect(result.risks).toBeInstanceOf(Array);
    });

    it("should calculate costs correctly", async () => {
      const requirements: Requirement[] = [
        {
          id: "1",
          type: "functional",
          priority: "medium",
          description: "Simple feature",
          acceptanceCriteria: [],
          complexity: 0,
          estimatedHours: 0,
        },
      ];

      mockOllamaService.generateText.mockResolvedValue("3");

      // Set known hourly rate
      engine.setHourlyRates({
        hourlyRate: 100,
        currency: "USD",
        overhead: 0.3,
        profitMargin: 0.2,
      });

      const result = await engine.generateProjectEstimate(requirements);

      // Cost should be: hours * rate * (1 + overhead) * (1 + profit)
      const expectedCost = result.totalHours * 100 * 1.3 * 1.2;
      expect(Math.abs(result.totalCost - expectedCost)).toBeLessThan(1);
    });
  });

  describe("historical data management", () => {
    it("should add and retrieve historical data", async () => {
      const projectData: ProjectData = {
        id: "1",
        name: "Test Project",
        actualHours: 100,
        estimatedHours: 90,
        requirements: [],
        completedAt: new Date(),
      };

      await engine.addHistoricalProject(projectData);
      const retrieved = await engine.getHistoricalData();

      expect(retrieved).toContain(projectData);
    });

    it("should filter historical data", async () => {
      const projects: ProjectData[] = [
        {
          id: "1",
          name: "Small React Project",
          actualHours: 50,
          estimatedHours: 45,
          requirements: [],
          completedAt: new Date(),
        },
        {
          id: "2",
          name: "Large Enterprise System",
          actualHours: 800,
          estimatedHours: 750,
          requirements: [],
          completedAt: new Date(),
        },
      ];

      for (const project of projects) {
        await engine.addHistoricalProject(project);
      }

      const smallProjects = await engine.getHistoricalData({ size: "small" });
      const largeProjects = await engine.getHistoricalData({ size: "large" });

      expect(smallProjects.length).toBe(1);
      expect(largeProjects.length).toBe(1);
      expect(smallProjects[0].name).toContain("Small");
      expect(largeProjects[0].name).toContain("Large");
    });

    it("should limit historical data size", async () => {
      // Add more than 100 projects
      for (let i = 0; i < 105; i++) {
        await engine.addHistoricalProject({
          id: `${i}`,
          name: `Project ${i}`,
          actualHours: 100,
          estimatedHours: 95,
          requirements: [],
          completedAt: new Date(),
        });
      }

      const allData = await engine.getHistoricalData();
      expect(allData.length).toBe(100);
    });
  });

  describe("rate configuration", () => {
    it("should set and get hourly rates", () => {
      const rates: RateConfiguration = {
        hourlyRate: 150,
        currency: "EUR",
        overhead: 0.25,
        profitMargin: 0.15,
      };

      engine.setHourlyRates(rates);
      const retrieved = engine.getHourlyRates();

      expect(retrieved).toEqual(rates);
    });
  });

  describe("calibrateEstimates", () => {
    it("should calculate accuracy and bias metrics", async () => {
      const actualProjects: ProjectData[] = [
        {
          id: "1",
          name: "Project 1",
          actualHours: 100,
          estimatedHours: 90,
          requirements: [],
          completedAt: new Date(),
        },
        {
          id: "2",
          name: "Project 2",
          actualHours: 200,
          estimatedHours: 220,
          requirements: [],
          completedAt: new Date(),
        },
      ];

      const result = await engine.calibrateEstimates(actualProjects);

      expect(result.accuracy).toBeGreaterThan(0);
      expect(result.accuracy).toBeLessThanOrEqual(1);
      expect(typeof result.bias).toBe("number");
      expect(result.recommendations).toBeInstanceOf(Array);
    });

    it("should handle empty project data", async () => {
      const result = await engine.calibrateEstimates([]);

      expect(result.accuracy).toBe(0);
      expect(result.bias).toBe(0);
      expect(result.recommendations).toContain(
        "No historical data available for calibration"
      );
    });
  });

  describe("generateScenarios", () => {
    it("should generate multiple estimation scenarios", async () => {
      const requirements: Requirement[] = [
        {
          id: "1",
          type: "functional",
          priority: "medium",
          description: "Feature implementation",
          acceptanceCriteria: [],
          complexity: 0,
          estimatedHours: 0,
        },
      ];

      mockOllamaService.generateText.mockResolvedValue("5");

      const scenarios = ["optimistic", "realistic", "pessimistic"] as (
        | "optimistic"
        | "realistic"
        | "pessimistic"
      )[];
      const result = await engine.generateScenarios(requirements, scenarios);

      expect(result.size).toBe(3);
      expect(result.has("optimistic")).toBe(true);
      expect(result.has("realistic")).toBe(true);
      expect(result.has("pessimistic")).toBe(true);

      const optimistic = result.get("optimistic")!;
      const realistic = result.get("realistic")!;
      const pessimistic = result.get("pessimistic")!;

      expect(optimistic.totalHours).toBeLessThan(realistic.totalHours);
      expect(realistic.totalHours).toBeLessThan(pessimistic.totalHours);
    });
  });

  describe("validateEstimate", () => {
    it("should validate reasonable estimates", async () => {
      const estimate = {
        id: "1",
        createdAt: new Date(),
        updatedAt: new Date(),
        totalHours: 100,
        totalCost: 15000,
        breakdown: [
          {
            category: "Development",
            hours: 60,
            description: "Dev work",
            requirements: [],
          },
          {
            category: "Testing",
            hours: 25,
            description: "Testing",
            requirements: [],
          },
          {
            category: "Documentation",
            hours: 15,
            description: "Docs",
            requirements: [],
          },
        ],
        risks: [],
        assumptions: ["Standard assumptions"],
        confidence: 0.8,
        requirements: [],
      };

      const requirements: Requirement[] = [
        {
          id: "1",
          type: "functional",
          priority: "medium",
          description: "Feature",
          acceptanceCriteria: [],
          complexity: 0,
          estimatedHours: 0,
        },
      ];

      const result = await engine.validateEstimate(estimate, requirements);

      expect(result.valid).toBe(true);
      expect(result.warnings).toBeInstanceOf(Array);
      expect(result.suggestions).toBeInstanceOf(Array);
    });

    it("should identify unreasonably low estimates", async () => {
      const estimate = {
        id: "1",
        createdAt: new Date(),
        updatedAt: new Date(),
        totalHours: 1,
        totalCost: 150,
        breakdown: [],
        risks: [],
        assumptions: [],
        confidence: 0.8,
        requirements: [],
      };

      const requirements: Requirement[] = [
        {
          id: "1",
          type: "functional",
          priority: "medium",
          description: "Complex feature",
          acceptanceCriteria: [],
          complexity: 0,
          estimatedHours: 0,
        },
      ];

      const result = await engine.validateEstimate(estimate, requirements);

      expect(result.valid).toBe(false);
      expect(result.warnings.some((w) => w.includes("very low"))).toBe(true);
    });

    it("should identify low confidence estimates", async () => {
      const estimate = {
        id: "1",
        createdAt: new Date(),
        updatedAt: new Date(),
        totalHours: 100,
        totalCost: 15000,
        breakdown: [],
        risks: [],
        assumptions: [],
        confidence: 0.3,
        requirements: [],
      };

      const requirements: Requirement[] = [
        {
          id: "1",
          type: "functional",
          priority: "medium",
          description: "Feature",
          acceptanceCriteria: [],
          complexity: 0,
          estimatedHours: 0,
        },
      ];

      const result = await engine.validateEstimate(estimate, requirements);

      expect(result.warnings.some((w) => w.includes("Low confidence"))).toBe(
        true
      );
    });
  });

  describe("integration with complexity and risk analyzers", () => {
    it("should use complexity analyzer for calculations", async () => {
      const requirements: Requirement[] = [
        {
          id: "1",
          type: "functional",
          priority: "medium",
          description: "API integration with machine learning",
          acceptanceCriteria: [],
          complexity: 0,
          estimatedHours: 0,
        },
      ];

      mockOllamaService.generateText.mockResolvedValue("7");

      const complexity = await engine.calculateComplexity(requirements);

      expect(complexity.overall).toBeGreaterThan(0);
      expect(complexity.technical).toBeGreaterThan(0);
      expect(complexity.business).toBeGreaterThan(0);
      expect(complexity.integration).toBeGreaterThan(0);
    });

    it("should use risk analyzer for assessments", async () => {
      const requirements: Requirement[] = [
        {
          id: "1",
          type: "functional",
          priority: "high",
          description: "Payment processing with security requirements",
          acceptanceCriteria: [],
          complexity: 0,
          estimatedHours: 0,
        },
      ];

      const risks = await engine.assessRisks(requirements);

      expect(risks.overall).toBeDefined();
      expect(risks.factors).toBeInstanceOf(Array);
      expect(risks.recommendations).toBeInstanceOf(Array);
    });
  });

  describe("enhanced cost calculation features", () => {
    it("should calculate detailed cost breakdown", async () => {
      const timeEstimate: TimeEstimate = {
        totalHours: 100,
        breakdown: [
          {
            category: "Development",
            hours: 60,
            description: "Core development",
            requirements: [],
          },
          {
            category: "Testing",
            hours: 25,
            description: "Testing work",
            requirements: [],
          },
          {
            category: "Documentation",
            hours: 15,
            description: "Documentation",
            requirements: [],
          },
        ],
        confidence: 0.8,
        assumptions: [],
      };

      engine.setHourlyRates({
        hourlyRate: 100,
        currency: "USD",
        overhead: 0.3,
        profitMargin: 0.2,
      });

      const costBreakdown = engine.calculateCostBreakdown(timeEstimate);

      expect(costBreakdown.breakdown).toHaveLength(3);
      expect(costBreakdown.breakdown[0].cost).toBe(6000); // 60 hours * $100
      expect(costBreakdown.breakdown[1].cost).toBe(2500); // 25 hours * $100
      expect(costBreakdown.breakdown[2].cost).toBe(1500); // 15 hours * $100
      expect(costBreakdown.subtotal).toBe(10000);
      expect(costBreakdown.overhead).toBe(3000); // 30% of subtotal
      expect(costBreakdown.profit).toBe(2600); // 20% of (subtotal + overhead)
      expect(costBreakdown.total).toBe(15600);
    });
  });

  describe("time estimation with buffer", () => {
    it("should generate time estimate with default buffer", async () => {
      const complexity: ComplexityScore = {
        overall: 5,
        technical: 5,
        business: 5,
        integration: 5,
        factors: [],
      };

      const result = await engine.generateTimeEstimateWithBuffer(complexity);

      expect(result.buffer).toBeGreaterThan(0);
      expect(result.totalWithBuffer).toBeGreaterThan(result.totalHours);
      expect(result.totalWithBuffer).toBe(result.totalHours + result.buffer);
      expect(result.assumptions.some((a) => a.includes("20% buffer"))).toBe(
        true
      );
    });

    it("should generate time estimate with custom buffer", async () => {
      const complexity: ComplexityScore = {
        overall: 5,
        technical: 5,
        business: 5,
        integration: 5,
        factors: [],
      };

      const result = await engine.generateTimeEstimateWithBuffer(
        complexity,
        0.3
      );

      expect(result.buffer).toBe(
        Math.round(result.totalHours * 0.3 * 100) / 100
      );
      expect(result.assumptions.some((a) => a.includes("30% buffer"))).toBe(
        true
      );
    });
  });

  describe("resource-based estimation", () => {
    it("should generate resource-based estimate with team configuration", async () => {
      const requirements: Requirement[] = [
        {
          id: "1",
          type: "functional",
          priority: "medium",
          description: "Complex feature implementation",
          acceptanceCriteria: [],
          complexity: 0,
          estimatedHours: 0,
        },
      ];

      const teamConfig = {
        seniorDevelopers: 2,
        midDevelopers: 3,
        juniorDevelopers: 1,
        seniorRate: 150,
        midRate: 100,
        juniorRate: 75,
      };

      mockOllamaService.generateText.mockResolvedValue("6");

      const result = await engine.generateResourceBasedEstimate(
        requirements,
        teamConfig
      );

      expect(result.resourceBreakdown).toBeDefined();
      expect(result.resourceBreakdown.senior).toBeDefined();
      expect(result.resourceBreakdown.mid).toBeDefined();
      expect(result.resourceBreakdown.junior).toBeDefined();

      expect(result.resourceBreakdown.senior.developers).toBe(2);
      expect(result.resourceBreakdown.mid.developers).toBe(3);
      expect(result.resourceBreakdown.junior.developers).toBe(1);

      expect(result.totalCost).toBeGreaterThan(0);
      expect(
        result.assumptions.some((a) =>
          a.includes("Team: 2 senior, 3 mid, 1 junior")
        )
      ).toBe(true);
    });

    it("should throw error for empty team configuration", async () => {
      const requirements: Requirement[] = [
        {
          id: "1",
          type: "functional",
          priority: "medium",
          description: "Feature",
          acceptanceCriteria: [],
          complexity: 0,
          estimatedHours: 0,
        },
      ];

      const teamConfig = {
        seniorDevelopers: 0,
        midDevelopers: 0,
        juniorDevelopers: 0,
        seniorRate: 150,
        midRate: 100,
        juniorRate: 75,
      };

      mockOllamaService.generateText.mockResolvedValue("5");

      await expect(
        engine.generateResourceBasedEstimate(requirements, teamConfig)
      ).rejects.toThrow(
        "Team configuration must include at least one developer"
      );
    });

    it("should distribute work appropriately based on complexity", async () => {
      const requirements: Requirement[] = [
        {
          id: "1",
          type: "functional",
          priority: "high",
          description: "High complexity feature with machine learning",
          acceptanceCriteria: [],
          complexity: 0,
          estimatedHours: 0,
        },
      ];

      const teamConfig = {
        seniorDevelopers: 1,
        midDevelopers: 1,
        juniorDevelopers: 1,
        seniorRate: 150,
        midRate: 100,
        juniorRate: 75,
      };

      mockOllamaService.generateText.mockResolvedValue("8");

      const result = await engine.generateResourceBasedEstimate(
        requirements,
        teamConfig
      );

      // Senior developers should get more hours for complex work
      expect(result.resourceBreakdown.senior.hours).toBeGreaterThan(
        result.resourceBreakdown.junior.hours
      );
    });
  });

  describe("enhanced estimation accuracy", () => {
    it("should provide more accurate estimates with multiple complexity factors", async () => {
      const requirements: Requirement[] = [
        {
          id: "1",
          type: "functional",
          priority: "high",
          description:
            "API integration with third-party payment system requiring security compliance",
          acceptanceCriteria: ["PCI compliance", "Real-time processing"],
          complexity: 0,
          estimatedHours: 0,
        },
      ];

      mockOllamaService.generateText.mockResolvedValue("8");

      // Add historical data for better accuracy
      await engine.addHistoricalProject({
        id: "hist-1",
        name: "Similar Payment Integration",
        actualHours: 120,
        estimatedHours: 100,
        requirements: [],
        completedAt: new Date(),
      });

      const result = await engine.generateProjectEstimate(requirements, {
        includeRisks: true,
        useHistoricalData: true,
      });

      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.risks.length).toBeGreaterThan(0);
      expect(result.totalHours).toBeGreaterThan(30); // Should be substantial for complex integration
    });

    it("should adjust estimates based on requirement clarity", async () => {
      const vagueRequirements: Requirement[] = [
        {
          id: "1",
          type: "functional",
          priority: "medium",
          description: "Make it user-friendly and intuitive",
          acceptanceCriteria: ["Should be easy to use"],
          complexity: 0,
          estimatedHours: 0,
        },
      ];

      const clearRequirements: Requirement[] = [
        {
          id: "1",
          type: "functional",
          priority: "medium",
          description:
            "Implement user registration form with email validation, password strength checking, and email confirmation",
          acceptanceCriteria: [
            "Email format validation",
            "Password must be 8+ characters with special chars",
            "Send confirmation email",
            "Account activation via email link",
          ],
          complexity: 0,
          estimatedHours: 0,
        },
      ];

      mockOllamaService.generateText.mockResolvedValue("5");

      const vagueEstimate =
        await engine.generateProjectEstimate(vagueRequirements);
      const clearEstimate =
        await engine.generateProjectEstimate(clearRequirements);

      expect(clearEstimate.confidence).toBeGreaterThan(
        vagueEstimate.confidence
      );
    });
  });

  describe("edge cases and error handling", () => {
    it("should handle empty requirements array", async () => {
      const result = await engine.generateProjectEstimate([]);

      expect(result.totalHours).toBeGreaterThan(0);
      expect(result.totalCost).toBeGreaterThan(0);
      expect(result.requirements).toEqual([]);
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

      const result = await engine.generateProjectEstimate(requirements);

      expect(result.totalHours).toBeGreaterThan(0);
      expect(result.totalCost).toBeGreaterThan(0);
    });

    it("should handle zero buffer percentage", async () => {
      const complexity: ComplexityScore = {
        overall: 5,
        technical: 5,
        business: 5,
        integration: 5,
        factors: [],
      };

      const result = await engine.generateTimeEstimateWithBuffer(complexity, 0);

      expect(result.buffer).toBe(0);
      expect(result.totalWithBuffer).toBe(result.totalHours);
    });

    it("should handle negative buffer percentage", async () => {
      const complexity: ComplexityScore = {
        overall: 5,
        technical: 5,
        business: 5,
        integration: 5,
        factors: [],
      };

      const result = await engine.generateTimeEstimateWithBuffer(
        complexity,
        -0.1
      );

      expect(result.buffer).toBeLessThan(0);
      expect(result.totalWithBuffer).toBeLessThan(result.totalHours);
    });
  });
});
