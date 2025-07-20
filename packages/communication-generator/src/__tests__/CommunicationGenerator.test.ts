import { describe, it, expect, beforeEach, vi } from "vitest";
import { CommunicationGenerator } from "../CommunicationGenerator.js";
import {
  CommunicationTemplate,
  PersonalizationConfig,
} from "../types/communication.js";
import {
  createMockOllamaService,
  createTestRequest,
  createTestPersonalization,
  createTestContext,
} from "./setup.js";

describe("CommunicationGenerator", () => {
  let generator: CommunicationGenerator;
  let mockOllamaService: any;

  beforeEach(() => {
    mockOllamaService = createMockOllamaService();
    generator = new CommunicationGenerator(mockOllamaService);
  });

  describe("Communication Generation", () => {
    it("should generate initial contact communication", async () => {
      const request = createTestRequest("initial-contact", "business");

      const result = await generator.generateCommunication(request);

      expect(result.type).toBe("initial-contact");
      expect(result.audienceType).toBe("business");
      expect(result.subject).toContain("E-commerce Platform");
      expect(result.content).toContain("John Smith");
      expect(result.content).toContain("Jane Developer");
      expect(result.wordCount).toBeGreaterThan(0);
      expect(result.estimatedReadTime).toBeGreaterThan(0);
    });

    it("should generate proposal communication with estimates", async () => {
      const request = createTestRequest("proposal", "mixed");

      const result = await generator.generateCommunication(request);

      expect(result.type).toBe("proposal");
      expect(result.content).toContain("TechCorp Inc.");
      expect(result.content).toContain("80"); // total hours
      expect(result.content).toContain("User authentication system");
      expect(result.content).toContain("Dashboard with analytics");
    });

    it("should generate status update communication", async () => {
      const request = createTestRequest("status-update", "business");

      const result = await generator.generateCommunication(request);

      expect(result.type).toBe("status-update");
      expect(result.content).toContain("Initial analysis");
      expect(result.content).toContain("25% complete");
      expect(result.content).toContain("Waiting for API documentation");
    });

    it("should enhance communication with AI when custom instructions provided", async () => {
      const request = createTestRequest("initial-contact", "business");
      request.customInstructions = "Make it more technical and detailed";

      const result = await generator.generateCommunication(request);

      expect(mockOllamaService.generateText).toHaveBeenCalled();
      expect(result.subject).toBe("Enhanced Subject");
      expect(result.content).toBe(
        "Enhanced body content with AI improvements."
      );
    });

    it("should handle AI enhancement failure gracefully", async () => {
      mockOllamaService.generateText.mockRejectedValue(
        new Error("AI service unavailable")
      );

      const request = createTestRequest("initial-contact", "business");
      request.customInstructions = "Make it better";

      const result = await generator.generateCommunication(request);

      // Should fall back to template output
      expect(result.content).toContain("John Smith");
      expect(result.subject).toContain("E-commerce Platform");
    });
  });

  describe("Communication Suite Generation", () => {
    it("should generate multiple communication types", async () => {
      const baseRequest = {
        format: "email" as const,
        audienceType: "business" as const,
        context: createTestContext(),
        personalization: createTestPersonalization(),
      };

      const types = ["initial-contact", "proposal", "status-update"] as const;
      const results = await generator.generateCommunicationSuite(
        baseRequest,
        types
      );

      expect(results).toHaveLength(3);
      expect(results[0].type).toBe("initial-contact");
      expect(results[1].type).toBe("proposal");
      expect(results[2].type).toBe("status-update");
    });
  });

  describe("Template Management", () => {
    it("should add custom templates", () => {
      const customTemplate: CommunicationTemplate = {
        id: "custom-follow-up",
        name: "Custom Follow-up",
        type: "follow-up",
        subject: "Following up on {{project.name}}",
        body: "Hi {{client.contactPerson}}, just checking in on {{project.name}}.",
        variables: [],
        audienceType: "business",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(() => generator.addTemplate(customTemplate)).not.toThrow();

      const templates = generator.getTemplatesByType("follow-up");
      expect(templates).toHaveLength(1);
      expect(templates[0].id).toBe("custom-follow-up");
    });

    it("should reject invalid templates", () => {
      const invalidTemplate: CommunicationTemplate = {
        id: "invalid-template",
        name: "Invalid Template",
        type: "follow-up",
        subject: "Invalid {{unclosed.handlebars",
        body: "This template has syntax errors {{also.unclosed",
        variables: [],
        audienceType: "business",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(() => generator.addTemplate(invalidTemplate)).toThrow(
        "Template validation failed"
      );
    });

    it("should get templates by type", () => {
      const proposalTemplates = generator.getTemplatesByType("proposal");
      expect(proposalTemplates.length).toBeGreaterThan(0);
      proposalTemplates.forEach((template) => {
        expect(template.type).toBe("proposal");
      });
    });

    it("should get templates by audience", () => {
      const businessTemplates = generator.getTemplatesByAudience("business");
      expect(businessTemplates.length).toBeGreaterThan(0);
      businessTemplates.forEach((template) => {
        expect(template.audienceType).toBe("business");
      });
    });
  });

  describe("Template Preview", () => {
    it("should preview template without AI enhancement", () => {
      const context = {
        client: { name: "Test Client", contactPerson: "John Doe" },
        project: { name: "Test Project" },
        sender: createTestPersonalization(),
        date: new Date(),
        custom: {},
      };

      const preview = generator.previewTemplate(
        "initial-contact-business",
        context
      );

      expect(preview.subject).toContain("Test Project");
      expect(preview.body).toContain("John Doe");
      expect(mockOllamaService.generateText).not.toHaveBeenCalled();
    });
  });

  describe("Personalization Validation", () => {
    it("should validate correct personalization config", () => {
      const validConfig = createTestPersonalization();
      const errors = generator.validatePersonalization(validConfig);

      expect(errors).toHaveLength(0);
    });

    it("should detect missing required fields", () => {
      const invalidConfig: PersonalizationConfig = {
        senderName: "",
        senderTitle: "",
        companyName: "",
        contactInfo: {
          email: "invalid-email",
        },
        signature: "",
      };

      const errors = generator.validatePersonalization(invalidConfig);

      expect(errors).toContain("Sender name is required");
      expect(errors).toContain("Sender title is required");
      expect(errors).toContain("Company name is required");
      expect(errors).toContain("Invalid email format");
      expect(errors).toContain("Signature is required");
    });

    it("should validate email format", () => {
      const config = createTestPersonalization();
      config.contactInfo.email = "invalid-email";

      const errors = generator.validatePersonalization(config);
      expect(errors).toContain("Invalid email format");
    });
  });

  describe("Template Selection", () => {
    it("should select best matching template by audience", async () => {
      const request = createTestRequest("initial-contact", "technical");

      // Should fall back to business template since no technical template exists
      const result = await generator.generateCommunication(request);
      expect(result.templateId).toBe("initial-contact-business");
    });

    it("should throw error when no template found", async () => {
      const request = createTestRequest(
        "clarification-request" as any,
        "business"
      );

      await expect(generator.generateCommunication(request)).rejects.toThrow(
        "No template found for type"
      );
    });
  });

  describe("Content Metrics", () => {
    it("should calculate word count correctly", async () => {
      const request = createTestRequest("initial-contact", "business");
      const result = await generator.generateCommunication(request);

      expect(result.wordCount).toBeGreaterThan(0);

      // Verify word count calculation
      const actualWordCount = result.content
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0).length;
      expect(result.wordCount).toBe(actualWordCount);
    });

    it("should calculate estimated read time", async () => {
      const request = createTestRequest("proposal", "mixed");
      const result = await generator.generateCommunication(request);

      expect(result.estimatedReadTime).toBeGreaterThan(0);

      // Should be based on ~200 words per minute
      const expectedReadTime = Math.ceil(result.wordCount / 200);
      expect(result.estimatedReadTime).toBe(expectedReadTime);
    });
  });

  describe("Error Handling", () => {
    it("should handle missing template gracefully", async () => {
      const request = createTestRequest("initial-contact", "business");
      request.templateId = "non-existent-template";

      await expect(generator.generateCommunication(request)).rejects.toThrow(
        "Template not found"
      );
    });

    it("should handle malformed AI responses", async () => {
      mockOllamaService.generateText.mockResolvedValue(
        "Invalid response format"
      );

      const request = createTestRequest("initial-contact", "business");
      request.customInstructions = "Enhance this";

      const result = await generator.generateCommunication(request);

      // Should fall back to template output
      expect(result.content).toContain("John Smith");
    });
  });
});
