import { describe, it, expect, beforeEach, vi } from "vitest";
import { EstimationEngineImpl } from "../estimation/EstimationEngineImpl.js";
import { OllamaService } from "@ai-toolkit/ollama-interface";
import { Requirement } from "@ai-toolkit/shared";

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

describe("EstimationEngine Integration Tests", () => {
  let engine: EstimationEngineImpl;

  beforeEach(() => {
    engine = new EstimationEngineImpl(mockOllamaService);
    vi.clearAllMocks();
  });

  it("should provide complete end-to-end estimation workflow", async () => {
    // Sample project requirements
    const requirements: Requirement[] = [
      {
        id: "1",
        type: "functional",
        priority: "high",
        description:
          "Implement user authentication system with JWT tokens, password hashing, and email verification",
        acceptanceCriteria: [
          "User can register with email and password",
          "Password must be hashed using bcrypt",
          "JWT tokens expire after 24 hours",
          "Email verification required before account activation",
          "Password reset functionality via email",
        ],
        complexity: 0,
        estimatedHours: 0,
      },
      {
        id: "2",
        type: "functional",
        priority: "high",
        description:
          "Create payment processing integration with Stripe API for subscription management",
        acceptanceCriteria: [
          "Integration with Stripe payment gateway",
          "Support for monthly and yearly subscriptions",
          "Webhook handling for payment events",
          "PCI compliance requirements",
          "Automatic invoice generation",
        ],
        complexity: 0,
        estimatedHours: 0,
      },
      {
        id: "3",
        type: "non-functional",
        priority: "medium",
        description:
          "Implement comprehensive logging and monitoring system with performance metrics",
        acceptanceCriteria: [
          "Structured logging with different log levels",
          "Performance monitoring and alerting",
          "Error tracking and reporting",
          "Database query performance monitoring",
        ],
        complexity: 0,
        estimatedHours: 0,
      },
    ];

    // Mock AI responses for different complexity levels
    mockOllamaService.generateText
      .mockResolvedValueOnce("7") // Authentication system
      .mockResolvedValueOnce("8") // Payment processing
      .mockResolvedValueOnce("6"); // Logging system

    // Configure rates
    engine.setHourlyRates({
      hourlyRate: 125,
      currency: "USD",
      overhead: 0.25,
      profitMargin: 0.15,
    });

    // Add some historical data for better accuracy
    await engine.addHistoricalProject({
      id: "hist-1",
      name: "Previous Auth System",
      actualHours: 85,
      estimatedHours: 75,
      requirements: [],
      completedAt: new Date(),
    });

    await engine.addHistoricalProject({
      id: "hist-2",
      name: "Payment Integration Project",
      actualHours: 120,
      estimatedHours: 100,
      requirements: [],
      completedAt: new Date(),
    });

    // Generate comprehensive project estimate
    const estimate = await engine.generateProjectEstimate(requirements, {
      includeRisks: true,
      useHistoricalData: true,
    });

    // Verify estimate structure
    expect(estimate.id).toBeDefined();
    expect(estimate.totalHours).toBeGreaterThan(20);
    expect(estimate.totalCost).toBeGreaterThan(2000);
    expect(estimate.confidence).toBeGreaterThan(0.7);
    expect(estimate.requirements).toHaveLength(3);
    expect(estimate.breakdown).toHaveLength(4); // Development, Testing, Documentation, Deployment
    expect(estimate.risks.length).toBeGreaterThan(0);

    // Test cost breakdown
    const costBreakdown = engine.calculateCostBreakdown({
      totalHours: estimate.totalHours,
      breakdown: estimate.breakdown,
      confidence: estimate.confidence,
      assumptions: estimate.assumptions,
    });

    expect(costBreakdown.subtotal).toBeGreaterThan(0);
    expect(costBreakdown.overhead).toBeGreaterThan(0);
    expect(costBreakdown.profit).toBeGreaterThan(0);
    expect(costBreakdown.total).toBe(estimate.totalCost);

    // Test time estimation with buffer
    const complexity = await engine.calculateComplexity(requirements);
    const bufferedEstimate = await engine.generateTimeEstimateWithBuffer(
      complexity,
      0.25
    );

    expect(bufferedEstimate.buffer).toBeGreaterThan(0);
    expect(bufferedEstimate.totalWithBuffer).toBeGreaterThan(
      bufferedEstimate.totalHours
    );

    // Test resource-based estimation
    const resourceEstimate = await engine.generateResourceBasedEstimate(
      requirements,
      {
        seniorDevelopers: 1,
        midDevelopers: 2,
        juniorDevelopers: 1,
        seniorRate: 150,
        midRate: 125,
        juniorRate: 100,
      }
    );

    expect(resourceEstimate.resourceBreakdown).toBeDefined();
    expect(resourceEstimate.resourceBreakdown.senior.hours).toBeGreaterThan(0);
    expect(resourceEstimate.resourceBreakdown.mid.hours).toBeGreaterThan(0);
    expect(resourceEstimate.resourceBreakdown.junior.hours).toBeGreaterThan(0);

    // Test scenario generation
    const scenarios = await engine.generateScenarios(requirements, [
      "optimistic",
      "realistic",
      "pessimistic",
    ]);

    expect(scenarios.size).toBe(3);
    const optimistic = scenarios.get("optimistic")!;
    const realistic = scenarios.get("realistic")!;
    const pessimistic = scenarios.get("pessimistic")!;

    expect(optimistic.totalHours).toBeLessThan(realistic.totalHours);
    expect(realistic.totalHours).toBeLessThan(pessimistic.totalHours);

    // Test estimate validation
    const validation = await engine.validateEstimate(estimate, requirements);
    expect(validation.valid).toBeDefined();
    expect(validation.warnings).toBeInstanceOf(Array);
    expect(validation.suggestions).toBeInstanceOf(Array);

    console.log("Integration Test Results:");
    console.log(`Total Hours: ${estimate.totalHours}`);
    console.log(`Total Cost: $${estimate.totalCost}`);
    console.log(`Confidence: ${Math.round(estimate.confidence * 100)}%`);
    console.log(`Risk Factors: ${estimate.risks.length}`);
    console.log(
      `Scenarios - Optimistic: ${optimistic.totalHours}h, Realistic: ${realistic.totalHours}h, Pessimistic: ${pessimistic.totalHours}h`
    );
  });

  it("should handle complex enterprise project estimation", async () => {
    const enterpriseRequirements: Requirement[] = [
      {
        id: "1",
        type: "functional",
        priority: "high",
        description:
          "Implement microservices architecture with API gateway, service discovery, and distributed tracing",
        acceptanceCriteria: [
          "API gateway with rate limiting and authentication",
          "Service registry and discovery mechanism",
          "Distributed tracing with correlation IDs",
          "Circuit breaker pattern implementation",
          "Load balancing and health checks",
        ],
        complexity: 0,
        estimatedHours: 0,
      },
      {
        id: "2",
        type: "functional",
        priority: "high",
        description:
          "Build real-time data processing pipeline with Apache Kafka and machine learning integration",
        acceptanceCriteria: [
          "Kafka cluster setup and configuration",
          "Stream processing with Kafka Streams",
          "ML model deployment and inference",
          "Real-time analytics dashboard",
          "Data quality monitoring and alerting",
        ],
        complexity: 0,
        estimatedHours: 0,
      },
      {
        id: "3",
        type: "non-functional",
        priority: "high",
        description:
          "Implement comprehensive security framework with OAuth2, RBAC, and audit logging",
        acceptanceCriteria: [
          "OAuth2 authorization server",
          "Role-based access control system",
          "Comprehensive audit logging",
          "Security scanning and vulnerability assessment",
          "Compliance with SOC2 requirements",
        ],
        complexity: 0,
        estimatedHours: 0,
      },
    ];

    // Mock high complexity responses
    mockOllamaService.generateText
      .mockResolvedValueOnce("9") // Microservices
      .mockResolvedValueOnce("9") // Data processing
      .mockResolvedValueOnce("8"); // Security

    const estimate = await engine.generateProjectEstimate(
      enterpriseRequirements,
      {
        includeRisks: true,
        useHistoricalData: false,
      }
    );

    // Enterprise projects should have substantial estimates
    expect(estimate.totalHours).toBeGreaterThan(20);
    expect(estimate.totalCost).toBeGreaterThan(2000);
    expect(estimate.risks.length).toBeGreaterThan(3);

    // Should identify high-risk factors
    const hasHighRiskFactors = estimate.risks.some(
      (risk) => risk.impact === "high"
    );
    expect(hasHighRiskFactors).toBe(true);

    // Should have reasonable confidence
    expect(estimate.confidence).toBeGreaterThan(0.5);
  });
});
