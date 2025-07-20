import { describe, it, expect, beforeEach } from "vitest";
import { CommunicationGenerator } from "../CommunicationGenerator.js";
import { CommunicationRequest } from "../types/communication.js";
import {
  createMockOllamaService,
  createTestContext,
  createTestPersonalization,
} from "./setup.js";

describe("CommunicationGenerator Integration Tests", () => {
  let generator: CommunicationGenerator;
  let mockOllamaService: any;

  beforeEach(() => {
    mockOllamaService = createMockOllamaService();
    generator = new CommunicationGenerator(mockOllamaService);
  });

  describe("End-to-End Communication Generation", () => {
    it("should generate complete project communication workflow", async () => {
      const baseRequest = {
        format: "email" as const,
        audienceType: "business" as const,
        context: createTestContext(),
        personalization: createTestPersonalization(),
      };

      // Generate initial contact
      const initialContact = await generator.generateCommunication({
        ...baseRequest,
        type: "initial-contact",
      });

      expect(initialContact.type).toBe("initial-contact");
      expect(initialContact.content).toContain("E-commerce Platform");
      expect(initialContact.content).toContain("John Smith");
      expect(initialContact.wordCount).toBeGreaterThan(100);

      // Generate proposal
      const proposal = await generator.generateCommunication({
        ...baseRequest,
        type: "proposal",
      });

      expect(proposal.type).toBe("proposal");
      expect(proposal.content).toContain("Project Proposal");
      expect(proposal.content).toContain("$8,000");
      expect(proposal.content).toContain("80"); // hours
      expect(proposal.wordCount).toBeGreaterThan(initialContact.wordCount);

      // Generate status update
      const statusUpdate = await generator.generateCommunication({
        ...baseRequest,
        type: "status-update",
      });

      expect(statusUpdate.type).toBe("status-update");
      expect(statusUpdate.content).toContain("25% complete");
      expect(statusUpdate.content).toContain("Initial analysis");
    });

    it("should handle different audience types appropriately", async () => {
      const context = createTestContext();
      const personalization = createTestPersonalization();

      // Technical audience
      const technicalRequest: CommunicationRequest = {
        type: "proposal",
        format: "email",
        audienceType: "technical",
        context,
        personalization,
      };

      const technicalProposal =
        await generator.generateCommunication(technicalRequest);

      // Business audience
      const businessRequest: CommunicationRequest = {
        type: "proposal",
        format: "email",
        audienceType: "business",
        context,
        personalization,
      };

      const businessProposal =
        await generator.generateCommunication(businessRequest);

      // Both should contain core information but may have different focus
      expect(technicalProposal.content).toContain("Project Proposal");
      expect(businessProposal.content).toContain("Project Proposal");
      expect(technicalProposal.audienceType).toBe("technical");
      expect(businessProposal.audienceType).toBe("business");
    });

    it("should maintain consistency across multiple generations", async () => {
      const request: CommunicationRequest = {
        type: "initial-contact",
        format: "email",
        audienceType: "business",
        context: createTestContext(),
        personalization: createTestPersonalization(),
      };

      const results = await Promise.all([
        generator.generateCommunication(request),
        generator.generateCommunication(request),
        generator.generateCommunication(request),
      ]);

      // All should have same basic structure and content
      results.forEach((result) => {
        expect(result.type).toBe("initial-contact");
        expect(result.content).toContain("E-commerce Platform");
        expect(result.content).toContain("John Smith");
        expect(result.wordCount).toBeGreaterThan(0);
      });

      // Word counts should be similar (within reasonable range)
      const wordCounts = results.map((r) => r.wordCount);
      const avgWordCount =
        wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length;

      wordCounts.forEach((count) => {
        expect(Math.abs(count - avgWordCount)).toBeLessThan(avgWordCount * 0.1); // Within 10%
      });
    });
  });

  describe("Template Customization Integration", () => {
    it("should work with custom templates in full workflow", async () => {
      // Add custom template
      const customTemplate = {
        id: "custom-brief-contact",
        name: "Brief Initial Contact",
        type: "initial-contact" as const,
        subject: "Quick update on {{project.name}}",
        body: `Hi {{client.contactPerson}},

Quick update on {{project.name}} - analysis complete!

Found {{project.requirements.length}} requirements.
{{#if project.estimate}}Estimated: {{hours project.estimate.totalHours}} ({{currency project.estimate.totalCost}}){{/if}}

Let's chat soon!

{{sender.senderName}}`,
        variables: [],
        audienceType: "business" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      generator.addTemplate(customTemplate);

      // Use custom template
      const request: CommunicationRequest = {
        type: "initial-contact",
        format: "email",
        audienceType: "business",
        context: createTestContext(),
        personalization: createTestPersonalization(),
        templateId: "custom-brief-contact",
      };

      const result = await generator.generateCommunication(request);

      expect(result.templateId).toBe("custom-brief-contact");
      expect(result.subject).toBe("Quick update on E-commerce Platform");
      expect(result.content).toContain("Quick update on E-commerce Platform");
      expect(result.content).toContain("Found 3 requirements");
      expect(result.content).toContain("Jane Developer");
      expect(result.wordCount).toBeLessThan(100); // Should be brief
    });
  });

  describe("AI Enhancement Integration", () => {
    it("should enhance communications with AI while preserving key information", async () => {
      const request: CommunicationRequest = {
        type: "initial-contact",
        format: "email",
        audienceType: "business",
        context: createTestContext(),
        personalization: createTestPersonalization(),
        customInstructions:
          "Make it more enthusiastic and include a call-to-action",
      };

      const result = await generator.generateCommunication(request);

      // Should use AI-enhanced content
      expect(result.subject).toBe("Enhanced Subject");
      expect(result.content).toBe(
        "Enhanced body content with AI improvements."
      );

      // Verify AI was called with correct parameters
      expect(mockOllamaService.generateText).toHaveBeenCalledWith(
        expect.stringContaining("Make it more enthusiastic"),
        expect.objectContaining({
          temperature: 0.7,
          maxTokens: 2000,
        })
      );
    });

    it("should handle AI enhancement for different communication types", async () => {
      const types = ["initial-contact", "proposal", "status-update"] as const;

      for (const type of types) {
        const request: CommunicationRequest = {
          type,
          format: "email",
          audienceType: "business",
          context: createTestContext(),
          personalization: createTestPersonalization(),
          customInstructions: `Optimize this ${type} for better engagement`,
        };

        const result = await generator.generateCommunication(request);

        expect(result.type).toBe(type);
        expect(mockOllamaService.generateText).toHaveBeenCalledWith(
          expect.stringContaining(`Optimize this ${type}`),
          expect.any(Object)
        );
      }
    });
  });

  describe("Error Recovery Integration", () => {
    it("should gracefully handle AI failures and still produce valid output", async () => {
      // Make AI service fail
      mockOllamaService.generateText.mockRejectedValue(
        new Error("Network timeout")
      );

      const request: CommunicationRequest = {
        type: "initial-contact",
        format: "email",
        audienceType: "business",
        context: createTestContext(),
        personalization: createTestPersonalization(),
        customInstructions: "This should fail but still work",
      };

      const result = await generator.generateCommunication(request);

      // Should still produce valid communication using template
      expect(result.type).toBe("initial-contact");
      expect(result.content).toContain("E-commerce Platform");
      expect(result.content).toContain("John Smith");
      expect(result.wordCount).toBeGreaterThan(0);
      expect(result.estimatedReadTime).toBeGreaterThan(0);
    });
  });

  describe("Performance Integration", () => {
    it("should handle concurrent communication generation", async () => {
      const requests = Array.from({ length: 5 }, (_, i) => ({
        type: "initial-contact" as const,
        format: "email" as const,
        audienceType: "business" as const,
        context: {
          ...createTestContext(),
          projectName: `Project ${i + 1}`,
        },
        personalization: createTestPersonalization(),
      }));

      const startTime = Date.now();
      const results = await Promise.all(
        requests.map((request) => generator.generateCommunication(request))
      );
      const endTime = Date.now();

      // All should complete successfully
      expect(results).toHaveLength(5);
      results.forEach((result, i) => {
        expect(result.type).toBe("initial-contact");
        expect(result.content).toContain(`Project ${i + 1}`);
      });

      // Should complete in reasonable time (less than 5 seconds for 5 generations)
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });
});
