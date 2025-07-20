import { OllamaService } from "@ai-toolkit/ollama-interface";
import { CommunicationRequest, GeneratedCommunication, CommunicationTemplate, CommunicationType, AudienceType, TemplateRenderContext, PersonalizationConfig } from "./types/communication.js";
export declare class CommunicationGenerator {
    private templateManager;
    private ollamaService;
    constructor(ollamaService: OllamaService);
    /**
     * Generate communication based on request parameters
     */
    generateCommunication(request: CommunicationRequest): Promise<GeneratedCommunication>;
    /**
     * Generate multiple communication types for a project
     */
    generateCommunicationSuite(baseRequest: Omit<CommunicationRequest, "type">, types: CommunicationType[]): Promise<GeneratedCommunication[]>;
    /**
     * Add custom template
     */
    addTemplate(template: CommunicationTemplate): void;
    /**
     * Get available templates by type
     */
    getTemplatesByType(type: CommunicationType): CommunicationTemplate[];
    /**
     * Get available templates by audience
     */
    getTemplatesByAudience(audienceType: AudienceType): CommunicationTemplate[];
    /**
     * Preview template rendering without AI enhancement
     */
    previewTemplate(templateId: string, context: TemplateRenderContext): {
        subject: string;
        body: string;
    };
    /**
     * Validate personalization configuration
     */
    validatePersonalization(config: PersonalizationConfig): string[];
    private selectBestTemplate;
    private buildRenderContext;
    private enhanceWithAI;
    private buildEnhancementPrompt;
    private parseAIResponse;
    private countWords;
    private isValidEmail;
    private generateId;
}
//# sourceMappingURL=CommunicationGenerator.d.ts.map