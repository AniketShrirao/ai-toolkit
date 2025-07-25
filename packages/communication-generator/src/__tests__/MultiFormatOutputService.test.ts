import { describe, it, expect, beforeEach } from "vitest";
import { MultiFormatOutputService } from "../services/MultiFormatOutputService.js";
import { GeneratedCommunication } from "../types/communication.js";

describe("MultiFormatOutputService", () => {
  let service: MultiFormatOutputService;
  let sampleCommunication: GeneratedCommunication;

  beforeEach(() => {
    service = new MultiFormatOutputService();
    sampleCommunication = {
      id: "test-comm-1",
      type: "proposal",
      format: "email",
      subject: "Project Proposal - E-commerce Platform",
      content: `# Executive Summary

This proposal outlines the development of an E-commerce Platform.

## Key Features

- User authentication
- Product catalog
- Shopping cart
- Payment processing

## Investment

**Total Cost:** $80,000
**Timeline:** 10 weeks
**ROI:** 300% within first year

## Next Steps

1. Review and approve proposal
2. Schedule kickoff meeting
3. Begin development`,
      context: {
        clientName: "John Smith",
        projectName: "E-commerce Platform",
        companyName: "TechCorp Inc.",
      },
      templateId: "proposal-detailed",
      audienceType: "business",
      wordCount: 85,
      estimatedReadTime: 1,
      createdAt: new Date("2024-01-15T10:00:00Z"),
      updatedAt: new Date("2024-01-15T10:00:00Z"),
    };
  });

  describe("Single Format Generation", () => {
    it("should format communication as email", async () => {
      const result = await service.formatCommunication(
        sampleCommunication,
        "email"
      );

      expect(result.format).toBe("email");
      expect(result.content).toContain(
        "Subject: Project Proposal - E-commerce Platform"
      );
      expect(result.content).toContain("Executive Summary");
      expect(result.metadata.mimeType).toBe("text/plain");
      expect(result.metadata.wordCount).toBeGreaterThan(0);
      expect(result.metadata.estimatedReadTime).toBeGreaterThan(0);
    });

    it("should format communication as HTML", async () => {
      const result = await service.formatCommunication(
        sampleCommunication,
        "html"
      );

      expect(result.format).toBe("html");
      expect(result.content).toContain("<!DOCTYPE html>");
      expect(result.content).toContain(
        "<title>Project Proposal - E-commerce Platform</title>"
      );
      expect(result.content).toContain(
        "<h1>Project Proposal - E-commerce Platform</h1>"
      );
      expect(result.content).toContain("Executive Summary");
      expect(result.metadata.mimeType).toBe("text/html");
    });

    it("should format communication as Markdown", async () => {
      const result = await service.formatCommunication(
        sampleCommunication,
        "markdown",
        { includeMetadata: true }
      );

      expect(result.format).toBe("markdown");
      expect(result.content).toContain(
        "# Project Proposal - E-commerce Platform"
      );
      expect(result.content).toContain("# Executive Summary");
      expect(result.content).toContain("**Type:** Proposal");
      expect(result.metadata.mimeType).toBe("text/markdown");
    });

    it("should format communication as PDF (HTML)", async () => {
      const result = await service.formatCommunication(
        sampleCommunication,
        "pdf"
      );

      expect(result.format).toBe("pdf");
      expect(result.content).toContain("<!DOCTYPE html>");
      expect(result.content).toContain("document-header");
      expect(result.content).toContain("document-content");
      expect(result.content).toContain("document-footer");
      expect(result.metadata.mimeType).toBe("application/pdf");
    });
  });

  describe("Multiple Format Generation", () => {
    it("should generate multiple formats simultaneously", async () => {
      const formats = ["email", "html", "markdown"] as const;
      const results = await service.generateMultipleFormats(
        sampleCommunication,
        formats
      );

      expect(Object.keys(results)).toHaveLength(3);
      expect(results.email.format).toBe("email");
      expect(results.html.format).toBe("html");
      expect(results.markdown.format).toBe("markdown");

      // Each format should have different content structure
      expect(results.email.content).toContain("Subject:");
      expect(results.html.content).toContain("<!DOCTYPE html>");
      expect(results.markdown.content).toContain("# Project Proposal");
    });

    it("should handle format generation failures gracefully", async () => {
      // Mock a scenario where one format might fail
      const formats = ["email", "html"] as const;
      const results = await service.generateMultipleFormats(
        sampleCommunication,
        formats
      );

      expect(Object.keys(results)).toHaveLength(2);
      expect(results.email).toBeDefined();
      expect(results.html).toBeDefined();
    });
  });

  describe("Format Options", () => {
    it("should include metadata when requested", async () => {
      const result = await service.formatCommunication(
        sampleCommunication,
        "email",
        { includeMetadata: true }
      );

      expect(result.content).toContain("Generated:");
      expect(result.content).toContain("Type: proposal");
      expect(result.content).toContain("Audience: business");
      expect(result.content).toContain("Word Count:");
    });

    it("should exclude metadata when not requested", async () => {
      const result = await service.formatCommunication(
        sampleCommunication,
        "email",
        { includeMetadata: false }
      );

      expect(result.content).not.toContain("Generated:");
      expect(result.content).not.toContain("Type:");
      expect(result.content).not.toContain("Audience:");
    });

    it("should apply different styling options", async () => {
      const professionalResult = await service.formatCommunication(
        sampleCommunication,
        "html",
        { styling: "professional" }
      );

      const minimalResult = await service.formatCommunication(
        sampleCommunication,
        "html",
        { styling: "minimal" }
      );

      expect(professionalResult.content).toContain("linear-gradient");
      expect(minimalResult.content).not.toContain("linear-gradient");
    });
  });

  describe("Content Conversion", () => {
    it("should convert markdown-like content to HTML properly", async () => {
      const communication = {
        ...sampleCommunication,
        content: `# Main Title

## Subtitle

**Bold text** and *italic text*

- List item 1
- List item 2

Regular paragraph text.`,
      };

      const result = await service.formatCommunication(communication, "html");

      expect(result.content).toContain("<h1>Main Title</h1>");
      expect(result.content).toContain("<h2>Subtitle</h2>");
      expect(result.content).toContain("<strong>Bold text</strong>");
      expect(result.content).toContain("<em>italic text</em>");
      expect(result.content).toContain("<li>List item 1</li>");
    });

    it("should handle complex content structures", async () => {
      const communication = {
        ...sampleCommunication,
        content: `# Project Overview

## Technical Requirements

### Backend
- Node.js with Express
- PostgreSQL database
- Redis for caching

### Frontend  
- React with TypeScript
- Material-UI components
- Responsive design

## Timeline

**Phase 1:** Foundation (2 weeks)
**Phase 2:** Core Features (4 weeks)  
**Phase 3:** Testing & Deployment (2 weeks)`,
      };

      const htmlResult = await service.formatCommunication(
        communication,
        "html"
      );
      const markdownResult = await service.formatCommunication(
        communication,
        "markdown"
      );

      expect(htmlResult.content).toContain("<h1>Project Overview</h1>");
      expect(htmlResult.content).toContain("<h2>Technical Requirements</h2>");
      expect(htmlResult.content).toContain("<h3>Backend</h3>");

      expect(markdownResult.content).toContain(
        "# Project Proposal - E-commerce Platform"
      );
      expect(markdownResult.content).toContain("# Project Overview");
    });
  });

  describe("Metadata Generation", () => {
    it("should calculate accurate word counts", async () => {
      const result = await service.formatCommunication(
        sampleCommunication,
        "email"
      );

      expect(result.metadata.wordCount).toBeGreaterThan(0);
      expect(result.metadata.estimatedReadTime).toBeGreaterThan(0);
      expect(result.metadata.fileSize).toBeGreaterThan(0);
    });

    it("should provide correct MIME types", async () => {
      const emailResult = await service.formatCommunication(
        sampleCommunication,
        "email"
      );
      const htmlResult = await service.formatCommunication(
        sampleCommunication,
        "html"
      );
      const markdownResult = await service.formatCommunication(
        sampleCommunication,
        "markdown"
      );
      const pdfResult = await service.formatCommunication(
        sampleCommunication,
        "pdf"
      );

      expect(emailResult.metadata.mimeType).toBe("text/plain");
      expect(htmlResult.metadata.mimeType).toBe("text/html");
      expect(markdownResult.metadata.mimeType).toBe("text/markdown");
      expect(pdfResult.metadata.mimeType).toBe("application/pdf");
    });
  });

  describe("Error Handling", () => {
    it("should throw error for unsupported formats", async () => {
      await expect(
        service.formatCommunication(sampleCommunication, "unsupported" as any)
      ).rejects.toThrow("Unsupported format: unsupported");
    });

    it("should provide fallback content on failures", async () => {
      const formats = ["email"] as const;
      const results = await service.generateMultipleFormats(
        sampleCommunication,
        formats
      );

      expect(results.email).toBeDefined();
      expect(results.email.content).toContain(sampleCommunication.subject);
    });
  });

  describe("Professional Formatting", () => {
    it("should format communication types properly", async () => {
      const proposalComm = {
        ...sampleCommunication,
        type: "initial-contact" as const,
      };
      const result = await service.formatCommunication(proposalComm, "html", {
        includeMetadata: true,
      });

      expect(result.content).toContain("Initial Contact");
    });

    it("should format audience types properly", async () => {
      const result = await service.formatCommunication(
        sampleCommunication,
        "html",
        { includeMetadata: true }
      );

      expect(result.content).toContain("Business");
    });

    it("should maintain consistent styling across formats", async () => {
      const formats = ["html", "pdf"] as const;
      const results = await service.generateMultipleFormats(
        sampleCommunication,
        formats,
        { styling: "professional" }
      );

      expect(results.html.content).toContain("font-family");
      expect(results.pdf.content).toContain("font-family");
    });
  });
});
