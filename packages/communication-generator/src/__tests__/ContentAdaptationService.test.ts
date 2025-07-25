import { describe, it, expect, beforeEach, vi } from "vitest";
import { ContentAdaptationService } from "../services/ContentAdaptationService.js";
import { createMockOllamaService } from "./setup.js";

describe("ContentAdaptationService", () => {
  let service: ContentAdaptationService;
  let mockOllamaService: any;

  beforeEach(() => {
    mockOllamaService = createMockOllamaService();
    service = new ContentAdaptationService(mockOllamaService);
  });

  describe("Content Adaptation", () => {
    it("should adapt content for technical audience", async () => {
      mockOllamaService.generateText.mockResolvedValue(`
SUBJECT: Technical Implementation Plan - E-commerce Platform

BODY:
This technical proposal outlines the development approach for the E-commerce Platform project. 

The system architecture will utilize a microservices approach with the following components:
- Authentication service using OAuth 2.0
- API gateway for request routing
- Database layer with PostgreSQL
- Frontend built with React and TypeScript

Technical Requirements:
- RESTful API design
- Containerized deployment with Docker
- CI/CD pipeline integration
- Performance monitoring and logging

TECHNICAL_LEVEL: advanced

ADAPTATIONS:
- Added technical architecture details
- Included specific technology stack information
- Enhanced with implementation specifics
- Added performance and monitoring considerations
      `);

      const result = await service.adaptContent(
        {
          subject: "Project Proposal - E-commerce Platform",
          body: "This proposal outlines the development of an e-commerce platform.",
        },
        {
          audienceType: "technical",
          communicationType: "proposal",
        }
      );

      expect(result.subject).toContain("Technical Implementation Plan");
      expect(result.body).toContain("microservices");
      expect(result.body).toContain("OAuth 2.0");
      expect(result.technicalLevel).toBe("advanced");
      expect(result.adaptations).toContain(
        "Added technical architecture details"
      );
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it("should adapt content for business audience", async () => {
      mockOllamaService.generateText.mockResolvedValue(`
SUBJECT: Business Proposal - E-commerce Platform Development

BODY:
This business proposal presents the development opportunity for your E-commerce Platform project.

Business Benefits:
- Increased revenue through online sales
- Enhanced customer experience
- Streamlined operations
- Market expansion opportunities

Investment Overview:
- Development timeline: 10 weeks
- Total investment: $80,000
- Expected ROI: 300% within first year
- Ongoing support included

Our approach focuses on delivering measurable business value while ensuring a smooth transition to your new platform.

TECHNICAL_LEVEL: basic

ADAPTATIONS:
- Emphasized business benefits and ROI
- Simplified technical language
- Added financial projections
- Focused on business outcomes
      `);

      const result = await service.adaptContent(
        {
          subject: "Technical Implementation - E-commerce Platform",
          body: "This proposal covers the technical implementation of microservices architecture.",
        },
        {
          audienceType: "business",
          communicationType: "proposal",
        }
      );

      expect(result.subject).toContain("Business Proposal");
      expect(result.body).toContain("Business Benefits");
      expect(result.body).toContain("ROI");
      expect(result.technicalLevel).toBe("basic");
      expect(result.adaptations).toContain(
        "Emphasized business benefits and ROI"
      );
    });

    it("should adapt content for executive audience", async () => {
      mockOllamaService.generateText.mockResolvedValue(`
SUBJECT: Executive Summary - E-commerce Platform Initiative

BODY:
Executive Summary

Strategic Opportunity: Digital transformation through e-commerce platform development

Key Decision Points:
• Investment: $80,000 over 10 weeks
• Expected Return: 300% ROI within 12 months  
• Risk Level: Low to Medium
• Strategic Impact: High

Recommendation: Proceed with immediate implementation to capture market opportunity and enhance competitive position.

Next Steps:
1. Board approval for budget allocation
2. Project kickoff within 2 weeks
3. Quarterly progress reviews

TECHNICAL_LEVEL: basic

ADAPTATIONS:
- Created executive summary format
- Highlighted key decision points
- Added strategic context
- Focused on high-level outcomes
      `);

      const result = await service.adaptContent(
        {
          subject: "Project Details - E-commerce Platform",
          body: "Detailed technical specifications and implementation timeline.",
        },
        {
          audienceType: "executive",
          communicationType: "proposal",
        }
      );

      expect(result.subject).toContain("Executive Summary");
      expect(result.body).toContain("Strategic Opportunity");
      expect(result.body).toContain("Key Decision Points");
      expect(result.technicalLevel).toBe("basic");
      expect(result.adaptations).toContain("Created executive summary format");
    });

    it("should handle adaptation failures gracefully", async () => {
      mockOllamaService.generateText.mockRejectedValue(
        new Error("AI service unavailable")
      );

      const originalContent = {
        subject: "Test Subject",
        body: "Test body content",
      };

      const result = await service.adaptContent(originalContent, {
        audienceType: "business",
        communicationType: "initial-contact",
      });

      expect(result.subject).toBe(originalContent.subject);
      expect(result.body).toBe(originalContent.body);
      expect(result.confidence).toBe(0.5);
      expect(result.adaptations).toContain(
        "Failed to adapt - using original content"
      );
    });
  });

  describe("Technical Detail Adjustment", () => {
    it("should enhance technical details for technical audience", () => {
      const content =
        "We will build a web application with user authentication.";

      const result = service.adjustTechnicalDetails(content, "technical");

      expect(result).toContain("Technical Details:");
      expect(result).toContain("Technical Requirements:");
    });

    it("should simplify technical details for business audience", () => {
      const content =
        "We will implement a RESTful API with OAuth authentication framework.";

      const result = service.adjustTechnicalDetails(content, "business");

      expect(result).toContain("interface"); // API -> interface
      expect(result).toContain("platform"); // framework -> platform
    });

    it("should create executive summary for executive audience", () => {
      const content =
        "Project cost: $80,000. Timeline: 10 weeks. Expected ROI: 300%.";

      const result = service.adjustTechnicalDetails(content, "executive");

      expect(result).toContain("Executive Summary:");
      expect(result).toContain("$80,000");
    });

    it("should balance details for mixed audience", () => {
      const content = "Technical implementation with business benefits.";

      const result = service.adjustTechnicalDetails(content, "mixed");

      expect(result).toBe(content); // Should remain unchanged for mixed audience
    });
  });

  describe("Professional Tone Maintenance", () => {
    it("should maintain professional tone", async () => {
      const improvedContent =
        "This is a professionally adjusted communication with proper business etiquette and clear, concise language.";

      mockOllamaService.generateText.mockResolvedValue(improvedContent);

      const result = await service.maintainProfessionalTone(
        "Hey there! This is kinda informal and stuff.",
        "proposal"
      );

      expect(result).toBe(improvedContent);
      expect(mockOllamaService.generateText).toHaveBeenCalledWith(
        expect.stringContaining("professional"),
        expect.objectContaining({ temperature: 0.3 })
      );
    });

    it("should handle tone maintenance failures", async () => {
      const originalContent = "Original content";
      mockOllamaService.generateText.mockRejectedValue(
        new Error("Service error")
      );

      const result = await service.maintainProfessionalTone(
        originalContent,
        "initial-contact"
      );

      expect(result).toBe(originalContent);
    });
  });

  describe("Format Variations", () => {
    it("should generate variations for multiple formats", async () => {
      mockOllamaService.generateText
        .mockResolvedValueOnce(
          "Subject: Email Version\n\nBody:\nEmail formatted content"
        )
        .mockResolvedValueOnce(
          "Subject: PDF Version\n\nBody:\nPDF formatted content"
        );

      const baseContent = {
        subject: "Original Subject",
        body: "Original body content",
      };

      const result = await service.generateFormatVariations(baseContent, [
        "email",
        "pdf",
      ]);

      expect(result.email.subject).toBe("Email Version");
      expect(result.email.body).toBe("Email formatted content");
      expect(result.pdf.subject).toBe("PDF Version");
      expect(result.pdf.body).toBe("PDF formatted content");
    });

    it("should handle format variation failures", async () => {
      mockOllamaService.generateText.mockRejectedValue(
        new Error("Format error")
      );

      const baseContent = {
        subject: "Test Subject",
        body: "Test body",
      };

      const result = await service.generateFormatVariations(baseContent, [
        "email",
      ]);

      expect(result.email).toEqual(baseContent);
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed AI responses", async () => {
      mockOllamaService.generateText.mockResolvedValue(
        "Invalid response format"
      );

      const originalContent = {
        subject: "Test Subject",
        body: "Test body",
      };

      const result = await service.adaptContent(originalContent, {
        audienceType: "business",
        communicationType: "proposal",
      });

      expect(result.subject).toBe(originalContent.subject);
      expect(result.body).toBe(originalContent.body);
      expect(result.confidence).toBe(0.3);
    });

    it("should infer technical level correctly", async () => {
      mockOllamaService.generateText.mockResolvedValue(`
SUBJECT: Test
BODY: Test content
ADAPTATIONS:
- Test adaptation
      `);

      const technicalResult = await service.adaptContent(
        { subject: "Test", body: "Test" },
        { audienceType: "technical", communicationType: "proposal" }
      );

      const businessResult = await service.adaptContent(
        { subject: "Test", body: "Test" },
        { audienceType: "business", communicationType: "proposal" }
      );

      expect(technicalResult.technicalLevel).toBe("advanced");
      expect(businessResult.technicalLevel).toBe("basic");
    });
  });
});
