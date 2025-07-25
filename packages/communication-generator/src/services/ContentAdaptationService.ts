import { OllamaService } from "@ai-toolkit/ollama-interface";
import {
  CommunicationRequest,
  AudienceType,
  CommunicationType,
} from "../types/communication.js";
import { DocumentAnalysis, ProjectEstimate } from "../types/shared.js";

export interface ContentAdaptationOptions {
  audienceType: AudienceType;
  communicationType: CommunicationType;
  projectAnalysis?: DocumentAnalysis;
  estimate?: ProjectEstimate;
  includeDetails?: boolean;
  toneAdjustment?:
    | "formal"
    | "casual"
    | "technical"
    | "executive"
    | "professional";
}

export interface AdaptedContent {
  subject: string;
  body: string;
  technicalLevel: "basic" | "intermediate" | "advanced";
  confidence: number;
  adaptations: string[];
}

export class ContentAdaptationService {
  constructor(private ollamaService: OllamaService) {}

  /**
   * Adapt content based on audience type and project context
   */
  public async adaptContent(
    originalContent: { subject: string; body: string },
    options: ContentAdaptationOptions
  ): Promise<AdaptedContent> {
    const prompt = this.buildAdaptationPrompt(originalContent, options);

    try {
      const response = await this.ollamaService.generateText(prompt, {
        temperature: 0.7,
        maxTokens: 3000,
      });

      return this.parseAdaptationResponse(response, originalContent, options);
    } catch (error) {
      console.warn("Content adaptation failed, using original content:", error);
      return {
        subject: originalContent.subject,
        body: originalContent.body,
        technicalLevel: this.inferTechnicalLevel(options.audienceType),
        confidence: 0.5,
        adaptations: ["Failed to adapt - using original content"],
      };
    }
  }

  /**
   * Adjust technical detail level based on audience
   */
  public adjustTechnicalDetails(
    content: string,
    audienceType: AudienceType,
    projectAnalysis?: DocumentAnalysis
  ): string {
    switch (audienceType) {
      case "technical":
        return this.enhanceTechnicalDetails(content, projectAnalysis);
      case "business":
        return this.simplifyTechnicalDetails(content);
      case "executive":
        return this.createExecutiveSummary(content);
      case "mixed":
      default:
        return this.balanceTechnicalDetails(content);
    }
  }

  /**
   * Ensure professional tone across all communications
   */
  public async maintainProfessionalTone(
    content: string,
    communicationType: CommunicationType
  ): Promise<string> {
    const tonePrompt = this.buildToneMaintenancePrompt(
      content,
      communicationType
    );

    try {
      const response = await this.ollamaService.generateText(tonePrompt, {
        temperature: 0.3, // Lower temperature for consistency
        maxTokens: 2000,
      });

      return this.extractToneAdjustedContent(response, content);
    } catch (error) {
      console.warn("Tone maintenance failed, using original content:", error);
      return content;
    }
  }

  /**
   * Generate content variations for different formats
   */
  public async generateFormatVariations(
    baseContent: { subject: string; body: string },
    formats: Array<"email" | "pdf" | "markdown" | "html">
  ): Promise<Record<string, { subject: string; body: string }>> {
    const variations: Record<string, { subject: string; body: string }> = {};

    for (const format of formats) {
      try {
        const adapted = await this.adaptForFormat(baseContent, format);
        variations[format] = adapted;
      } catch (error) {
        console.warn(`Format adaptation failed for ${format}:`, error);
        variations[format] = baseContent;
      }
    }

    return variations;
  }

  private buildAdaptationPrompt(
    content: { subject: string; body: string },
    options: ContentAdaptationOptions
  ): string {
    const contextInfo = this.buildContextInfo(options);

    return `You are a professional communication specialist. Please adapt the following ${options.communicationType} for a ${options.audienceType} audience.

${contextInfo}

Current Subject: ${content.subject}

Current Body:
${content.body}

Please provide an adapted version that:
1. Is appropriate for the ${options.audienceType} audience
2. Maintains professional tone
3. ${this.getAudienceSpecificInstructions(options.audienceType)}
4. Preserves all key information and data
5. Uses appropriate technical language level

Respond in this exact format:
SUBJECT: [adapted subject line]

BODY:
[adapted body content]

TECHNICAL_LEVEL: [basic|intermediate|advanced]

ADAPTATIONS:
- [list of key adaptations made]
- [one adaptation per line]`;
  }

  private buildContextInfo(options: ContentAdaptationOptions): string {
    let context = "";

    if (options.projectAnalysis) {
      context += `Project Context:
- ${options.projectAnalysis.requirements.totalCount} requirements identified
- Key categories: ${options.projectAnalysis.contentCategories.map((c) => c.type).join(", ")}
- ${options.projectAnalysis.keyPoints.length} key points identified

`;
    }

    if (options.estimate) {
      context += `Project Estimate:
- Total hours: ${options.estimate.totalHours}
- Total cost: $${options.estimate.totalCost.toLocaleString()}
- Confidence: ${options.estimate.confidence}%
- ${options.estimate.risks.length} risk factors identified

`;
    }

    return context;
  }

  private getAudienceSpecificInstructions(audienceType: AudienceType): string {
    switch (audienceType) {
      case "technical":
        return "Include technical details, architecture considerations, and implementation specifics";
      case "business":
        return "Focus on business value, ROI, and outcomes rather than technical implementation";
      case "executive":
        return "Provide high-level summary with key decisions points and strategic implications";
      case "mixed":
        return "Balance technical details with business context, suitable for mixed audiences";
      default:
        return "Use clear, professional language appropriate for general business communication";
    }
  }

  private parseAdaptationResponse(
    response: string,
    fallback: { subject: string; body: string },
    options: ContentAdaptationOptions
  ): AdaptedContent {
    try {
      const subjectMatch = response.match(/SUBJECT:\s*(.+)/);
      const bodyMatch = response.match(
        /BODY:\s*([\s\S]+?)(?=TECHNICAL_LEVEL:|$)/
      );
      const technicalLevelMatch = response.match(/TECHNICAL_LEVEL:\s*(\w+)/);
      const adaptationsMatch = response.match(/ADAPTATIONS:\s*([\s\S]+)/);

      const adaptations =
        adaptationsMatch?.[1]
          ?.split("\n")
          .map((line) => line.replace(/^-\s*/, "").trim())
          .filter((line) => line.length > 0) || [];

      return {
        subject: subjectMatch?.[1]?.trim() || fallback.subject,
        body: bodyMatch?.[1]?.trim() || fallback.body,
        technicalLevel:
          (technicalLevelMatch?.[1] as any) ||
          this.inferTechnicalLevel(options.audienceType),
        confidence: adaptations.length > 0 ? 0.8 : 0.3, // Lower confidence if no adaptations found
        adaptations,
      };
    } catch (error) {
      console.warn("Failed to parse adaptation response:", error);
      return {
        subject: fallback.subject,
        body: fallback.body,
        technicalLevel: this.inferTechnicalLevel(options.audienceType),
        confidence: 0.3,
        adaptations: ["Failed to parse AI response"],
      };
    }
  }

  private inferTechnicalLevel(
    audienceType: AudienceType
  ): "basic" | "intermediate" | "advanced" {
    switch (audienceType) {
      case "technical":
        return "advanced";
      case "business":
        return "basic";
      case "executive":
        return "basic";
      case "mixed":
        return "intermediate";
      default:
        return "intermediate";
    }
  }

  private enhanceTechnicalDetails(
    content: string,
    analysis?: DocumentAnalysis
  ): string {
    // Add technical context if available
    if (analysis) {
      const techDetails = [
        `Technical Requirements: ${analysis.requirements.functional.length} functional, ${analysis.requirements.nonFunctional.length} non-functional`,
        `Architecture Considerations: Based on ${analysis.structure.sections.length} document sections`,
        `Implementation Complexity: ${analysis.keyPoints.filter((kp) => kp.category.toLowerCase().includes("tech")).length} technical key points identified`,
      ];

      return (
        content +
        "\n\n**Technical Details:**\n" +
        techDetails.map((detail) => `• ${detail}`).join("\n")
      );
    }

    // Add basic technical enhancement even without analysis
    const basicTechDetails = [
      "Technical Requirements: System architecture and implementation details",
      "Implementation Approach: Modern development practices and frameworks",
      "Quality Assurance: Comprehensive testing and code review processes",
    ];

    return (
      content +
      "\n\n**Technical Details:**\n" +
      basicTechDetails.map((detail) => `• ${detail}`).join("\n")
    );
  }

  private simplifyTechnicalDetails(content: string): string {
    // Remove or simplify technical jargon
    return content.replace(
      /\b(API|SDK|framework|architecture|implementation)\b/gi,
      (match) => {
        const replacements: Record<string, string> = {
          api: "interface",
          sdk: "development tools",
          framework: "platform",
          architecture: "structure",
          implementation: "development",
        };
        return replacements[match.toLowerCase()] || match;
      }
    );
  }

  private createExecutiveSummary(content: string): string {
    // Extract key business points and create executive summary
    const lines = content.split("\n");
    const keyLines = lines.filter(
      (line) =>
        line.includes("$") ||
        line.includes("hours") ||
        line.includes("timeline") ||
        line.includes("ROI") ||
        line.includes("benefit")
    );

    if (keyLines.length > 0) {
      return (
        "**Executive Summary:**\n" +
        keyLines.slice(0, 3).join("\n") +
        "\n\n" +
        content
      );
    }

    return content;
  }

  private balanceTechnicalDetails(content: string): string {
    // Maintain balance between technical and business content
    return content; // For now, return as-is since mixed audience needs both
  }

  private buildToneMaintenancePrompt(
    content: string,
    type: CommunicationType
  ): string {
    return `Please review and adjust the following ${type} communication to ensure it maintains a professional, appropriate tone throughout.

Content:
${content}

Please ensure:
1. Professional language throughout
2. Consistent tone appropriate for ${type}
3. Clear and concise communication
4. Proper business etiquette
5. No informal language or slang

Return only the tone-adjusted content without additional commentary.`;
  }

  private extractToneAdjustedContent(
    response: string,
    fallback: string
  ): string {
    // Simple extraction - in a real implementation, this could be more sophisticated
    const cleaned = response.trim();
    return cleaned.length > 0 ? cleaned : fallback;
  }

  private async adaptForFormat(
    content: { subject: string; body: string },
    format: "email" | "pdf" | "markdown" | "html"
  ): Promise<{ subject: string; body: string }> {
    const formatPrompt = `Please adapt the following content for ${format} format:

Subject: ${content.subject}

Body:
${content.body}

Format requirements for ${format}:
${this.getFormatRequirements(format)}

Provide the adapted content in the same subject/body structure.`;

    try {
      const response = await this.ollamaService.generateText(formatPrompt, {
        temperature: 0.5,
        maxTokens: 2500,
      });

      return this.parseFormatResponse(response, content);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to adapt content for ${format}: ${errorMessage}`);
    }
  }

  private getFormatRequirements(format: string): string {
    switch (format) {
      case "email":
        return "- Conversational but professional tone\n- Clear subject line\n- Proper email structure with greeting and closing";
      case "pdf":
        return "- Formal document structure\n- Professional formatting\n- Suitable for printing and formal presentation";
      case "markdown":
        return "- Use markdown formatting (headers, lists, emphasis)\n- Clean, readable structure\n- Suitable for documentation";
      case "html":
        return "- Web-friendly formatting\n- Consider responsive design\n- Professional appearance for web viewing";
      default:
        return "- Professional, clear formatting";
    }
  }

  private parseFormatResponse(
    response: string,
    fallback: { subject: string; body: string }
  ): { subject: string; body: string } {
    try {
      const subjectMatch = response.match(/Subject:\s*(.+)/i);
      const bodyMatch = response.match(/Body:\s*([\s\S]+)/i);

      return {
        subject: subjectMatch?.[1]?.trim() || fallback.subject,
        body: bodyMatch?.[1]?.trim() || fallback.body,
      };
    } catch (error) {
      return fallback;
    }
  }
}
