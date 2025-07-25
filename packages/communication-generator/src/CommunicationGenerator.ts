import { OllamaService } from "@ai-toolkit/ollama-interface";
import { TemplateManager } from "./templates/TemplateManager.js";
import { ContentAdaptationService } from "./services/ContentAdaptationService.js";
import {
  MultiFormatOutputService,
  FormattedOutput,
} from "./services/MultiFormatOutputService.js";
import {
  CommunicationRequest,
  GeneratedCommunication,
  CommunicationTemplate,
  CommunicationType,
  AudienceType,
  TemplateRenderContext,
  PersonalizationConfig,
  OutputFormat,
} from "./types/communication.js";

export class CommunicationGenerator {
  private templateManager: TemplateManager;
  private ollamaService: OllamaService;
  private contentAdaptationService: ContentAdaptationService;
  private multiFormatOutputService: MultiFormatOutputService;

  constructor(ollamaService: OllamaService) {
    this.ollamaService = ollamaService;
    this.templateManager = new TemplateManager();
    this.contentAdaptationService = new ContentAdaptationService(ollamaService);
    this.multiFormatOutputService = new MultiFormatOutputService();
  }

  /**
   * Generate communication based on request parameters
   */
  public async generateCommunication(
    request: CommunicationRequest
  ): Promise<GeneratedCommunication> {
    const templateId =
      request.templateId ||
      this.selectBestTemplate(request.type, request.audienceType);
    const template = this.templateManager.getTemplate(templateId);

    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Build render context
    const renderContext = this.buildRenderContext(request);

    // Render base template
    const rendered = this.templateManager.renderTemplate(
      templateId,
      renderContext
    );

    // Enhance with AI if custom instructions provided
    let finalContent = rendered.body;
    let finalSubject = rendered.subject;

    if (request.customInstructions) {
      const enhanced = await this.enhanceWithAI(rendered, request);
      finalContent = enhanced.body;
      finalSubject = enhanced.subject;
    }

    // Calculate metrics
    const wordCount = this.countWords(finalContent);
    const estimatedReadTime = Math.ceil(wordCount / 200); // Average reading speed

    return {
      id: this.generateId(),
      type: request.type,
      format: request.format,
      subject: finalSubject,
      content: finalContent,
      context: request.context,
      templateId,
      audienceType: request.audienceType,
      wordCount,
      estimatedReadTime,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Generate multiple communication types for a project
   */
  public async generateCommunicationSuite(
    baseRequest: Omit<CommunicationRequest, "type">,
    types: CommunicationType[]
  ): Promise<GeneratedCommunication[]> {
    const communications: GeneratedCommunication[] = [];

    for (const type of types) {
      const request: CommunicationRequest = {
        ...baseRequest,
        type,
      };

      const communication = await this.generateCommunication(request);
      communications.push(communication);
    }

    return communications;
  }

  /**
   * Add custom template
   */
  public addTemplate(template: CommunicationTemplate): void {
    const errors = this.templateManager.validateTemplate(template);
    if (errors.length > 0) {
      throw new Error(`Template validation failed: ${errors.join(", ")}`);
    }

    this.templateManager.addTemplate(template);
  }

  /**
   * Get available templates by type
   */
  public getTemplatesByType(type: CommunicationType): CommunicationTemplate[] {
    return this.templateManager.getTemplatesByType(type);
  }

  /**
   * Get available templates by audience
   */
  public getTemplatesByAudience(
    audienceType: AudienceType
  ): CommunicationTemplate[] {
    return this.templateManager.getTemplatesByAudience(audienceType);
  }

  /**
   * Preview template rendering without AI enhancement
   */
  public previewTemplate(
    templateId: string,
    context: TemplateRenderContext
  ): { subject: string; body: string } {
    return this.templateManager.renderTemplate(templateId, context);
  }

  /**
   * Generate communication with advanced AI-powered content adaptation
   */
  public async generateAdaptedCommunication(
    request: CommunicationRequest
  ): Promise<GeneratedCommunication> {
    // Generate base communication
    const baseCommunication = await this.generateCommunication(request);

    // Apply content adaptation based on audience and project context
    const adaptedContent = await this.contentAdaptationService.adaptContent(
      { subject: baseCommunication.subject, body: baseCommunication.content },
      {
        audienceType: request.audienceType,
        communicationType: request.type,
        projectAnalysis: request.context.projectAnalysis,
        estimate: request.context.estimate,
        includeDetails: request.audienceType === "technical",
      }
    );

    // Ensure professional tone
    const finalContent =
      await this.contentAdaptationService.maintainProfessionalTone(
        adaptedContent.body,
        request.type
      );

    return {
      ...baseCommunication,
      subject: adaptedContent.subject,
      content: finalContent,
      wordCount: this.countWords(finalContent),
      estimatedReadTime: Math.ceil(this.countWords(finalContent) / 200),
      updatedAt: new Date(),
    };
  }

  /**
   * Generate communication in multiple formats
   */
  public async generateMultiFormatCommunication(
    request: CommunicationRequest,
    formats: OutputFormat[]
  ): Promise<Record<OutputFormat, FormattedOutput>> {
    const communication = await this.generateAdaptedCommunication(request);

    return this.multiFormatOutputService.generateMultipleFormats(
      communication,
      formats,
      {
        includeMetadata: true,
        styling: "professional",
      }
    );
  }

  /**
   * Generate audience-specific variations of the same communication
   */
  public async generateAudienceVariations(
    baseRequest: Omit<CommunicationRequest, "audienceType">,
    audiences: AudienceType[]
  ): Promise<Record<AudienceType, GeneratedCommunication>> {
    const variations: Record<string, GeneratedCommunication> = {};

    for (const audienceType of audiences) {
      const request: CommunicationRequest = {
        ...baseRequest,
        audienceType,
      };

      const communication = await this.generateAdaptedCommunication(request);
      variations[audienceType] = communication;
    }

    return variations as Record<AudienceType, GeneratedCommunication>;
  }

  /**
   * Analyze and improve existing communication content
   */
  public async improveCommunication(
    existingContent: { subject: string; body: string },
    targetAudience: AudienceType,
    communicationType: CommunicationType
  ): Promise<{
    improved: { subject: string; body: string };
    improvements: string[];
    confidence: number;
  }> {
    const adaptedContent = await this.contentAdaptationService.adaptContent(
      existingContent,
      {
        audienceType: targetAudience,
        communicationType,
        toneAdjustment: "professional",
      }
    );

    const improvedContent =
      await this.contentAdaptationService.maintainProfessionalTone(
        adaptedContent.body,
        communicationType
      );

    return {
      improved: {
        subject: adaptedContent.subject,
        body: improvedContent,
      },
      improvements: adaptedContent.adaptations,
      confidence: adaptedContent.confidence,
    };
  }

  /**
   * Validate personalization configuration
   */
  public validatePersonalization(config: PersonalizationConfig): string[] {
    const errors: string[] = [];

    if (!config.senderName?.trim()) {
      errors.push("Sender name is required");
    }

    if (!config.senderTitle?.trim()) {
      errors.push("Sender title is required");
    }

    if (!config.companyName?.trim()) {
      errors.push("Company name is required");
    }

    if (!config.contactInfo?.email?.trim()) {
      errors.push("Email is required");
    } else if (!this.isValidEmail(config.contactInfo.email)) {
      errors.push("Invalid email format");
    }

    if (!config.signature?.trim()) {
      errors.push("Signature is required");
    }

    return errors;
  }

  private selectBestTemplate(
    type: CommunicationType,
    audienceType: AudienceType
  ): string {
    const templates = this.templateManager.getTemplatesByType(type);

    // Prefer exact audience match
    const exactMatch = templates.find((t) => t.audienceType === audienceType);
    if (exactMatch) {
      return exactMatch.id;
    }

    // Fallback to mixed audience if available
    const mixedMatch = templates.find((t) => t.audienceType === "mixed");
    if (mixedMatch) {
      return mixedMatch.id;
    }

    // Use first available template
    if (templates.length > 0) {
      return templates[0].id;
    }

    throw new Error(`No template found for type: ${type}`);
  }

  private buildRenderContext(
    request: CommunicationRequest
  ): TemplateRenderContext {
    // Structure requirements properly for templates
    const requirements = request.context.requirements || [];
    const structuredRequirements = {
      functional: requirements.filter((r) => r.type === "functional"),
      nonFunctional: requirements.filter((r) => r.type === "non-functional"),
    };

    return {
      client: {
        name: request.context.clientName,
        contactPerson: request.context.contactPerson,
        companyName: request.context.companyName,
      },
      project: {
        name: request.context.projectName,
        requirements: structuredRequirements,
        estimate: request.context.estimate,
        analysis: request.context.projectAnalysis,
      },
      sender: request.personalization,
      date: new Date(),
      custom: request.context.customData || {},
    };
  }

  private async enhanceWithAI(
    rendered: { subject: string; body: string },
    request: CommunicationRequest
  ): Promise<{ subject: string; body: string }> {
    const prompt = this.buildEnhancementPrompt(rendered, request);

    try {
      const response = await this.ollamaService.generateText(prompt, {
        temperature: 0.7,
        maxTokens: 2000,
      });

      return this.parseAIResponse(response, rendered);
    } catch (error) {
      console.warn("AI enhancement failed, using template output:", error);
      return rendered;
    }
  }

  private buildEnhancementPrompt(
    rendered: { subject: string; body: string },
    request: CommunicationRequest
  ): string {
    return `You are a professional communication specialist. Please enhance the following ${request.type} communication based on these instructions: "${request.customInstructions}"

Audience Type: ${request.audienceType}
Communication Type: ${request.type}

Current Subject: ${rendered.subject}

Current Body:
${rendered.body}

Please provide an enhanced version that:
1. Maintains professional tone
2. Is appropriate for the ${request.audienceType} audience
3. Incorporates the custom instructions
4. Keeps the same general structure and key information

Respond in this exact format:
SUBJECT: [enhanced subject line]

BODY:
[enhanced body content]`;
  }

  private parseAIResponse(
    response: string,
    fallback: { subject: string; body: string }
  ): { subject: string; body: string } {
    try {
      const subjectMatch = response.match(/SUBJECT:\s*(.+)/);
      const bodyMatch = response.match(/BODY:\s*([\s\S]+)/);

      return {
        subject: subjectMatch?.[1]?.trim() || fallback.subject,
        body: bodyMatch?.[1]?.trim() || fallback.body,
      };
    } catch (error) {
      console.warn("Failed to parse AI response, using fallback");
      return fallback;
    }
  }

  private countWords(text: string): number {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private generateId(): string {
    return `comm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
