import { describe, it, expect, beforeEach, vi } from "vitest";
import { RiskAnalyzer } from "../risk/RiskAnalyzer.js";
import { OllamaService } from "@ai-toolkit/ollama-interface";
import { Requirement, CodebaseAnalysis } from "@ai-toolkit/shared";

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

describe("RiskAnalyzer", () => {
  let analyzer: RiskAnalyzer;

  beforeEach(() => {
    analyzer = new RiskAnalyzer(mockOllamaService);
    vi.clearAllMocks();
  });

  describe("assessRisks", () => {
    it("should assess risks for simple requirements", async () => {
      const requirements: Requirement[] = [
        {
          id: "1",
          type: "functional",
          priority: "low",
          description: "Create a simple contact form",
          acceptanceCriteria: ["Form has name and email fields"],
          complexity: 0,
          estimatedHours: 0,
        },
      ];

      const result = await analyzer.assessRisks(requirements);

      expect(result.overall).toBeDefined();
      expect(result.factors).toBeInstanceOf(Array);
      expect(result.recommendations).toBeInstanceOf(Array);
    });

    it("should identify high-risk technical requirements", async () => {
      const requirements: Requirement[] = [
        {
          id: "1",
          type: "functional",
          priority: "high",
          description:
            "Implement real-time machine learning fraud detection with high performance requirements",
          acceptanceCriteria: [
            "Process 10000 transactions per second",
            "ML accuracy > 99%",
          ],
          complexity: 0,
          estimatedHours: 0,
        },
      ];

      const result = await analyzer.assessRisks(requirements);

      expect(result.factors.length).toBeGreaterThan(0);
      expect(result.factors.some((f) => f.name.includes("Performance"))).toBe(
        true
      );
      expect(result.overall).toBe("medium");
    });

    it("should identify security risks", async () => {
      const requirements: Requirement[] = [
        {
          id: "1",
          type: "functional",
          priority: "high",
          description:
            "Implement user authentication with payment processing and personal data storage",
          acceptanceCriteria: ["Secure login", "PCI compliance"],
          complexity: 0,
          estimatedHours: 0,
        },
      ];

      const result = await analyzer.assessRisks(requirements);

      expect(result.factors.some((f) => f.name.includes("Security"))).toBe(
        true
      );
      expect(result.factors.some((f) => f.impact === "high")).toBe(true);
    });

    it("should assess integration risks", async () => {
      const requirements: Requirement[] = [
        {
          id: "1",
          type: "functional",
          priority: "medium",
          description:
            "Integrate with third-party payment gateway and external CRM system",
          acceptanceCriteria: [
            "Payment processing works",
            "CRM sync is reliable",
          ],
          complexity: 0,
          estimatedHours: 0,
        },
      ];

      const result = await analyzer.assessRisks(requirements);

      expect(result.factors.some((f) => f.name.includes("Integration"))).toBe(
        true
      );
      expect(result.recommendations.some((r) => r.includes("API"))).toBe(true);
    });
  });

  describe("identifyTechnicalRisks", () => {
    it("should identify performance risks", async () => {
      const requirements: Requirement[] = [
        {
          id: "1",
          type: "non-functional",
          priority: "high",
          description:
            "System must handle real-time processing of high-volume concurrent requests",
          acceptanceCriteria: [
            "Response time < 100ms",
            "Handle 1000 concurrent users",
          ],
          complexity: 0,
          estimatedHours: 0,
        },
      ];

      const risks = await analyzer.identifyTechnicalRisks(requirements);

      expect(risks.some((r) => r.name.includes("Performance"))).toBe(true);
      expect(risks.some((r) => r.impact === "high")).toBe(true);
    });

    it("should identify scalability risks", async () => {
      const requirements: Requirement[] = [
        {
          id: "1",
          type: "functional",
          priority: "medium",
          description:
            "Build distributed microservices architecture that can scale to millions of users",
          acceptanceCriteria: ["Horizontal scaling", "Cloud deployment"],
          complexity: 0,
          estimatedHours: 0,
        },
      ];

      const risks = await analyzer.identifyTechnicalRisks(requirements);

      expect(risks.some((r) => r.name.includes("Scalability"))).toBe(true);
    });

    it("should identify new technology risks", async () => {
      const requirements: Requirement[] = [
        {
          id: "1",
          type: "functional",
          priority: "medium",
          description:
            "Implement blockchain-based smart contracts with AI-powered analytics",
          acceptanceCriteria: [
            "Smart contract deployment",
            "AI model integration",
          ],
          complexity: 0,
          estimatedHours: 0,
        },
      ];

      const risks = await analyzer.identifyTechnicalRisks(requirements);

      expect(risks.some((r) => r.name.includes("Technology"))).toBe(true);
    });
  });

  describe("codebase risk analysis", () => {
    it("should identify technical debt risks", async () => {
      const codebase: CodebaseAnalysis = {
        structure: {
          directories: [],
          files: [],
          rootPath: "/test/project",
          totalFiles: 100,
          totalLines: 10000,
          languages: [
            { language: "typescript", files: 60, lines: 6000, percentage: 60 },
            { language: "javascript", files: 40, lines: 4000, percentage: 40 },
          ],
        },
        dependencies: [],
        metrics: {
          complexity: 8,
          maintainability: 0.3,
          testCoverage: 0.4,
          duplicateCode: 0.1,
          technicalDebt: 0.8,
        },
        issues: [],
        documentation: [],
        recommendations: [],
      };

      const requirements: Requirement[] = [
        {
          id: "1",
          type: "functional",
          priority: "medium",
          description: "Add new feature to existing system",
          acceptanceCriteria: [],
          complexity: 0,
          estimatedHours: 0,
        },
      ];

      const risks = await analyzer.identifyTechnicalRisks(
        requirements,
        codebase
      );

      expect(risks.some((r) => r.name.includes("Technical Debt"))).toBe(true);
    });

    it("should identify dependency risks", async () => {
      const dependencies = Array.from({ length: 60 }, (_, i) => ({
        name: `package-${i}`,
        version: "1.0.0",
        type: "production" as const,
      }));

      const codebase: CodebaseAnalysis = {
        structure: {
          directories: [],
          files: [],
          rootPath: "/test/project",
          totalFiles: 60,
          totalLines: 5000,
          languages: [
            { language: "typescript", files: 35, lines: 3000, percentage: 60 },
            { language: "javascript", files: 25, lines: 2000, percentage: 40 },
          ],
        },
        dependencies,
        metrics: {
          complexity: 5,
          maintainability: 0.7,
          testCoverage: 0.8,
          duplicateCode: 0.05,
          technicalDebt: 0.3,
        },
        issues: [],
        documentation: [],
        recommendations: [],
      };

      const requirements: Requirement[] = [
        {
          id: "1",
          type: "functional",
          priority: "medium",
          description: "Update system functionality",
          acceptanceCriteria: [],
          complexity: 0,
          estimatedHours: 0,
        },
      ];

      const risks = await analyzer.identifyTechnicalRisks(
        requirements,
        codebase
      );

      expect(risks.some((r) => r.name.includes("Dependency"))).toBe(true);
    });

    it("should identify architecture risks", async () => {
      const codebase: CodebaseAnalysis = {
        structure: {
          directories: [],
          files: [],
          rootPath: "/test/project",
          totalFiles: 50,
          totalLines: 5000,
          languages: [
            { language: "typescript", files: 30, lines: 3000, percentage: 60 },
            { language: "javascript", files: 20, lines: 2000, percentage: 40 },
          ],
        },
        dependencies: [],
        metrics: {
          complexity: 5,
          maintainability: 0.7,
          testCoverage: 0.8,
          duplicateCode: 0.05,
          technicalDebt: 0.3,
        },
        issues: [
          {
            id: "1",
            type: "code-smell",
            severity: "high",
            description: "Circular dependencies detected",
            file: "src/main.ts",
            line: 1,
          },
        ],
        documentation: [],
        recommendations: [],
      };

      const requirements: Requirement[] = [
        {
          id: "1",
          type: "functional",
          priority: "medium",
          description: "Modify core system architecture",
          acceptanceCriteria: [],
          complexity: 0,
          estimatedHours: 0,
        },
      ];

      const risks = await analyzer.identifyTechnicalRisks(
        requirements,
        codebase
      );

      expect(risks.some((r) => r.name.includes("Architecture"))).toBe(true);
    });
  });

  describe("business risk assessment", () => {
    it("should identify scope creep risk from vague requirements", async () => {
      const requirements: Requirement[] = [
        {
          id: "1",
          type: "functional",
          priority: "medium",
          description: "Make it user-friendly",
          acceptanceCriteria: ["Should be intuitive"],
          complexity: 0,
          estimatedHours: 0,
        },
        {
          id: "2",
          type: "functional",
          priority: "medium",
          description: "System should be flexible",
          acceptanceCriteria: ["Should be scalable"],
          complexity: 0,
          estimatedHours: 0,
        },
        {
          id: "3",
          type: "functional",
          priority: "medium",
          description: "Make it robust",
          acceptanceCriteria: ["Should be efficient"],
          complexity: 0,
          estimatedHours: 0,
        },
      ];

      const result = await analyzer.assessRisks(requirements);

      expect(result.factors.some((r) => r.name.includes("Scope Creep"))).toBe(
        true
      );
    });

    it("should identify stakeholder alignment risk from conflicting requirements", async () => {
      const requirements: Requirement[] = [
        {
          id: "1",
          type: "functional",
          priority: "high",
          description: "System must be simple and easy to use",
          acceptanceCriteria: ["Simple interface"],
          complexity: 0,
          estimatedHours: 0,
        },
        {
          id: "2",
          type: "functional",
          priority: "high",
          description: "System must be complex with advanced features",
          acceptanceCriteria: ["Complex functionality"],
          complexity: 0,
          estimatedHours: 0,
        },
      ];

      const result = await analyzer.assessRisks(requirements);

      expect(result.factors.some((r) => r.name.includes("Stakeholder"))).toBe(
        true
      );
    });
  });

  describe("resource risk assessment", () => {
    it("should identify skill gap risks", async () => {
      const requirements: Requirement[] = [
        {
          id: "1",
          type: "functional",
          priority: "high",
          description:
            "Implement machine learning algorithms with blockchain integration",
          acceptanceCriteria: [
            "ML model deployment",
            "Smart contract integration",
          ],
          complexity: 0,
          estimatedHours: 0,
        },
      ];

      const result = await analyzer.assessRisks(requirements);

      expect(result.factors.some((r) => r.name.includes("Skill Gap"))).toBe(
        true
      );
    });

    it("should identify timeline pressure risks", async () => {
      const requirements: Requirement[] = Array.from(
        { length: 10 },
        (_, i) => ({
          id: `${i + 1}`,
          type: "functional" as const,
          priority: "high" as const,
          description: `High priority requirement ${i + 1}`,
          acceptanceCriteria: [`Criteria ${i + 1}`],
          complexity: 0,
          estimatedHours: 0,
        })
      );

      const result = await analyzer.assessRisks(requirements);

      expect(result.factors.some((r) => r.name.includes("Timeline"))).toBe(
        true
      );
    });
  });

  describe("overall risk calculation", () => {
    it("should calculate low overall risk for simple projects", async () => {
      const requirements: Requirement[] = [
        {
          id: "1",
          type: "functional",
          priority: "low",
          description: "Create simple contact form",
          acceptanceCriteria: ["Basic form fields"],
          complexity: 0,
          estimatedHours: 0,
        },
      ];

      const result = await analyzer.assessRisks(requirements);

      expect(result.overall).toBe("low");
    });

    it("should calculate high overall risk for complex projects", async () => {
      const requirements: Requirement[] = [
        {
          id: "1",
          type: "functional",
          priority: "high",
          description:
            "Implement real-time machine learning with blockchain and high-performance requirements",
          acceptanceCriteria: [
            "ML accuracy > 99%",
            "Process 10000 TPS",
            "Blockchain integration",
          ],
          complexity: 0,
          estimatedHours: 0,
        },
      ];

      const result = await analyzer.assessRisks(requirements);

      expect(result.overall).toBe("medium");
    });
  });

  describe("risk recommendations", () => {
    it("should provide specific mitigation recommendations", async () => {
      const requirements: Requirement[] = [
        {
          id: "1",
          type: "functional",
          priority: "high",
          description:
            "Implement secure payment processing with real-time fraud detection",
          acceptanceCriteria: ["PCI compliance", "Real-time processing"],
          complexity: 0,
          estimatedHours: 0,
        },
      ];

      const result = await analyzer.assessRisks(requirements);

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(
        result.recommendations.some(
          (r) => r.includes("security") || r.includes("Security")
        )
      ).toBe(true);
    });

    it("should provide general recommendations for high-risk projects", async () => {
      const requirements: Requirement[] = [
        {
          id: "1",
          type: "functional",
          priority: "high",
          description:
            "Critical system with high security and performance requirements",
          acceptanceCriteria: ["High security", "High performance"],
          complexity: 0,
          estimatedHours: 0,
        },
      ];

      const result = await analyzer.assessRisks(requirements);

      expect(result.recommendations.some((r) => r.includes("monitoring"))).toBe(
        true
      );
      expect(
        result.recommendations.some((r) => r.includes("contingency"))
      ).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should handle empty requirements array", async () => {
      const result = await analyzer.assessRisks([]);

      expect(result.overall).toBe("low");
      expect(result.factors).toEqual([]);
      expect(result.recommendations).toBeInstanceOf(Array);
    });

    it("should handle requirements with empty descriptions", async () => {
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

      const result = await analyzer.assessRisks(requirements);

      expect(result.overall).toBeDefined();
      expect(result.factors).toBeInstanceOf(Array);
    });
  });
});
