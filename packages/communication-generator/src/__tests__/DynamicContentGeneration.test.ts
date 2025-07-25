import { describe, it, expect, beforeEach, vi } from "vitest";
import { CommunicationGenerator } from "../CommunicationGenerator.js";
import { CommunicationRequest } from "../types/communication.js";
import {
  createMockOllamaService,
  createTestRequest,
  createTestContext,
  createTestPersonalization,
} from "./setup.js";

describe("CommunicationGenerator - Dynamic Content Generation", () => {
  let generator: CommunicationGenerator;
  let mockOllamaService: any;

  beforeEach(() => {
    mockOllamaService = createMockOllamaService();
    generator = new CommunicationGenerator(mockOllamaService);
  });

  describe("Advanced Content Adaptation", () => {
    it("should generate adapted communication with AI enhancement", async () => {
      // Mock AI responses for content adaptation
      mockOllamaService.generateText
        .mockResolvedValueOnce(
          `
SUBJECT: Enhanced Technical Proposal - E-commerce Platform

BODY:
This enhanced technical proposal provides detailed implementation specifications for the E-commerce Platform project.

Technical Architecture:
- Microservices-based architecture
- RESTful API design
- Database optimization strategies
- Security implementation details

The solution incorporates industry best practices and modern development methodologies.

TECHNICAL_LEVEL: advanced

ADAPTATIONS:
- Enhanced technical depth
- Added architecture details
- Included security considerations
        `
        )
        .mockResolvedValueOnce(
          "This is the final professionally toned content with proper business etiquette and technical accuracy."
        );

      const request = createTestRequest("proposal", "technical");
      const result = await generator.generateAdaptedCommunication(request);

      expect(result.type).toBe("proposal");
      expect(result.audienceType).toBe("technical");
      expect(result.subject).toContain("Enhanced Technical Proposal");
      expect(result.content).toBe(
        "This is the final professionally toned content with proper business etiquette and technical accuracy."
      );
      expect(result.wordCount).toBeGreaterThan(0);
      expect(result.estimatedReadTime).toBeGreaterThan(0);
    });

    it("should handle adaptation failures gracefully", async () => {
      mockOllamaService.generateText.mockRejectedValue(
        new Error("AI service error")
      );

      const request = createTestRequest("initial-contact", "business");
      const result = await generator.generateAdaptedCommunication(request);

      expect(result.type).toBe("initial-contact");
      expect(result.content).toContain("E-commerce Platform");
      expect(result.wordCount).toBeGreaterThan(0);
    });
  });

  describe("Multi-Format Communication Generation", () => {
    it("should generate communication in multiple formats", async () => {
      // Mock content adaptation
      mockOllamaService.generateText
        .mockResolvedValueOnce(
          `
SUBJECT: Business Proposal - E-commerce Platform

BODY:
Professional business proposal content with ROI focus and clear value proposition.

TECHNICAL_LEVEL: basic

ADAPTATIONS:
- Business-focused language
- ROI emphasis
        `
        )
        .mockResolvedValueOnce("Professionally toned business content")
        .mockResolvedValueOnce(
          "Subject: Email Format\n\nBody:\nEmail-optimized content"
        )
        .mockResolvedValueOnce(
          "Subject: PDF Format\n\nBody:\nPDF-optimized content"
        );

      const request = createTestRequest("proposal", "business");
      const formats = ["email", "pdf"] as const;

      const results = await generator.generateMultiFormatCommunication(
        request,
        formats
      );

      expect(Object.keys(results)).toHaveLength(2);
      expect(results.email.format).toBe("email");
      expect(results.pdf.format).toBe("pdf");
      expect(results.email.content).toContain("Subject:");
      expect(results.pdf.content).toContain("<!DOCTYPE html>");
    });

    it("should include professional styling and metadata", async () => {
      mockOllamaService.generateText
        .mockResolvedValueOnce(
          `
SUBJECT: Professional Proposal

BODY:
Professional content

TECHNICAL_LEVEL: intermediate

ADAPTATIONS:
- Professional formatting
        `
        )
        .mockResolvedValueOnce("Professional content");

      const request = createTestRequest("proposal", "mixed");
      const results = await generator.generateMultiFormatCommunication(
        request,
        ["html"]
      );

      expect(results.html.content).toContain("Professional Proposal");
      expect(results.html.metadata.mimeType).toBe("text/html");
      expect(results.html.metadata.wordCount).toBeGreaterThan(0);
    });
  });

  describe("Audience-Specific Variations", () => {
    it("should generate variations for different audiences", async () => {
      // Mock different responses for different audiences
      mockOllamaService.generateText
        .mockResolvedValueOnce(
          `
SUBJECT: Technical Implementation Plan

BODY:
Technical content with architecture details

TECHNICAL_LEVEL: advanced

ADAPTATIONS:
- Technical depth added
        `
        )
        .mockResolvedValueOnce("Technical professional content")
        .mockResolvedValueOnce(
          `
SUBJECT: Business Proposal

BODY:
Business-focused content with ROI

TECHNICAL_LEVEL: basic

ADAPTATIONS:
- Business language
        `
        )
        .mockResolvedValueOnce("Business professional content")
        .mockResolvedValueOnce(
          `
SUBJECT: Executive Summary

BODY:
High-level strategic overview

TECHNICAL_LEVEL: basic

ADAPTATIONS:
- Executive summary format
        `
        )
        .mockResolvedValueOnce("Executive professional content");

      const baseRequest = {
        type: "proposal" as const,
        format: "email" as const,
        context: createTestContext(),
        personalization: createTestPersonalization(),
      };

      const audiences = ["technical", "business", "executive"] as const;
      const variations = await generator.generateAudienceVariations(
        baseRequest,
        audiences
      );

      expect(Object.keys(variations)).toHaveLength(3);
      expect(variations.technical.subject).toContain("Technical");
      expect(variations.business.subject).toContain("Business");
      expect(variations.executive.subject).toContain("Executive");
      expect(variations.technical.content).toBe(
        "Technical professional content"
      );
      expect(variations.business.content).toBe("Business professional content");
      expect(variations.executive.content).toBe(
        "Executive professional content"
      );
    });

    it("should maintain consistency across audience variations", async () => {
      mockOllamaService.generateText
        .mockResolvedValue(
          `
SUBJECT: Consistent Subject

BODY:
Consistent base content

TECHNICAL_LEVEL: intermediate

ADAPTATIONS:
- Audience-appropriate adjustments
        `
        )
        .mockResolvedValue("Consistent professional content");

      const baseRequest = {
        type: "status-update" as const,
        format: "email" as const,
        context: createTestContext(),
        personalization: createTestPersonalization(),
      };

      const variations = await generator.generateAudienceVariations(
        baseRequest,
        ["business", "mixed"]
      );

      expect(variations.business.type).toBe("status-update");
      expect(variations.mixed.type).toBe("status-update");
      expect(variations.business.context.projectName).toBe(
        variations.mixed.context.projectName
      );
    });
  });

  describe("Communication Improvement", () => {
    it("should improve existing communication content", async () => {
      mockOllamaService.generateText
        .mockResolvedValueOnce(
          `
SUBJECT: Improved Professional Subject

BODY:
This is significantly improved content with better structure, clearer messaging, and professional tone throughout.

TECHNICAL_LEVEL: intermediate

ADAPTATIONS:
- Enhanced professional tone
- Improved structure and clarity
- Better audience targeting
- Strengthened call-to-action
        `
        )
        .mockResolvedValueOnce(
          "Final professionally improved content with excellent business etiquette."
        );

      const existingContent = {
        subject: "Hey about that project",
        body: "So we need to talk about the thing we discussed. It's gonna cost some money and take some time. Let me know what you think.",
      };

      const result = await generator.improveCommunication(
        existingContent,
        "business",
        "initial-contact"
      );

      expect(result.improved.subject).toBe("Improved Professional Subject");
      expect(result.improved.body).toBe(
        "Final professionally improved content with excellent business etiquette."
      );
      expect(result.improvements).toContain("Enhanced professional tone");
      expect(result.improvements).toContain("Improved structure and clarity");
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it("should handle improvement failures gracefully", async () => {
      mockOllamaService.generateText.mockRejectedValue(
        new Error("Improvement failed")
      );

      const existingContent = {
        subject: "Test Subject",
        body: "Test content",
      };

      const result = await generator.improveCommunication(
        existingContent,
        "technical",
        "proposal"
      );

      expect(result.improved.subject).toBe(existingContent.subject);
      expect(result.improved.body).toBe(existingContent.body);
      expect(result.confidence).toBe(0.5);
      expect(result.improvements).toContain(
        "Failed to adapt - using original content"
      );
    });
  });

  describe("Professional Tone Maintenance", () => {
    it("should maintain professional tone across all generated content", async () => {
      mockOllamaService.generateText
        .mockResolvedValueOnce(
          `
SUBJECT: Professional Business Communication

BODY:
This communication maintains the highest standards of professional business correspondence.

TECHNICAL_LEVEL: basic

ADAPTATIONS:
- Professional language throughout
- Business-appropriate tone
        `
        )
        .mockResolvedValueOnce(
          "This is the final content with maintained professional tone and proper business etiquette."
        );

      const request = createTestRequest("initial-contact", "business");
      const result = await generator.generateAdaptedCommunication(request);

      expect(result.content).toBe(
        "This is the final content with maintained professional tone and proper business etiquette."
      );
      expect(mockOllamaService.generateText).toHaveBeenCalledWith(
        expect.stringContaining("professional"),
        expect.objectContaining({ temperature: 0.3 })
      );
    });
  });

  describe("Technical Detail Inclusion Logic", () => {
    it("should include appropriate technical details for technical audience", async () => {
      mockOllamaService.generateText
        .mockResolvedValueOnce(
          `
SUBJECT: Technical Architecture Proposal

BODY:
Detailed technical implementation with microservices architecture, API specifications, database design, and security protocols.

TECHNICAL_LEVEL: advanced

ADAPTATIONS:
- Added technical architecture details
- Included API specifications
- Enhanced security considerations
        `
        )
        .mockResolvedValueOnce("Technical content with professional tone");

      const request = createTestRequest("proposal", "technical");
      const result = await generator.generateAdaptedCommunication(request);

      expect(result.content).toContain(
        "Technical content with professional tone"
      );
      expect(mockOllamaService.generateText).toHaveBeenCalledWith(
        expect.stringContaining("technical details"),
        expect.any(Object)
      );
    });

    it("should simplify technical details for business audience", async () => {
      mockOllamaService.generateText
        .mockResolvedValueOnce(
          `
SUBJECT: Business Value Proposal

BODY:
Business-focused content emphasizing ROI, outcomes, and strategic benefits without technical jargon.

TECHNICAL_LEVEL: basic

ADAPTATIONS:
- Simplified technical language
- Emphasized business value
- Focused on outcomes
        `
        )
        .mockResolvedValueOnce(
          "Business-focused content with professional tone"
        );

      const request = createTestRequest("proposal", "business");
      const result = await generator.generateAdaptedCommunication(request);

      expect(result.content).toContain(
        "Business-focused content with professional tone"
      );
      expect(mockOllamaService.generateText).toHaveBeenCalledWith(
        expect.stringContaining("business value"),
        expect.any(Object)
      );
    });
  });

  describe("Error Recovery and Resilience", () => {
    it("should handle partial AI service failures", async () => {
      // First call succeeds, second fails
      mockOllamaService.generateText
        .mockResolvedValueOnce(
          `
SUBJECT: Adapted Subject

BODY:
Adapted content

TECHNICAL_LEVEL: intermediate

ADAPTATIONS:
- Content adapted successfully
        `
        )
        .mockRejectedValueOnce(new Error("Tone maintenance failed"));

      const request = createTestRequest("initial-contact", "mixed");
      const result = await generator.generateAdaptedCommunication(request);

      expect(result.subject).toBe("Adapted Subject");
      expect(result.content).toBe("Adapted content"); // Should use adapted content even if tone maintenance fails
    });

    it("should provide meaningful fallbacks for complete failures", async () => {
      mockOllamaService.generateText.mockRejectedValue(
        new Error("Complete AI failure")
      );

      const request = createTestRequest("proposal", "business");
      const result = await generator.generateAdaptedCommunication(request);

      expect(result.type).toBe("proposal");
      expect(result.audienceType).toBe("business");
      expect(result.content).toContain("E-commerce Platform");
      expect(result.wordCount).toBeGreaterThan(0);
    });
  });
});
