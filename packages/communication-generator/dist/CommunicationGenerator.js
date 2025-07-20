import { TemplateManager } from "./templates/TemplateManager.js";
export class CommunicationGenerator {
    templateManager;
    ollamaService;
    constructor(ollamaService) {
        this.ollamaService = ollamaService;
        this.templateManager = new TemplateManager();
    }
    /**
     * Generate communication based on request parameters
     */
    async generateCommunication(request) {
        const templateId = request.templateId ||
            this.selectBestTemplate(request.type, request.audienceType);
        const template = this.templateManager.getTemplate(templateId);
        if (!template) {
            throw new Error(`Template not found: ${templateId}`);
        }
        // Build render context
        const renderContext = this.buildRenderContext(request);
        // Render base template
        const rendered = this.templateManager.renderTemplate(templateId, renderContext);
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
    async generateCommunicationSuite(baseRequest, types) {
        const communications = [];
        for (const type of types) {
            const request = {
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
    addTemplate(template) {
        const errors = this.templateManager.validateTemplate(template);
        if (errors.length > 0) {
            throw new Error(`Template validation failed: ${errors.join(", ")}`);
        }
        this.templateManager.addTemplate(template);
    }
    /**
     * Get available templates by type
     */
    getTemplatesByType(type) {
        return this.templateManager.getTemplatesByType(type);
    }
    /**
     * Get available templates by audience
     */
    getTemplatesByAudience(audienceType) {
        return this.templateManager.getTemplatesByAudience(audienceType);
    }
    /**
     * Preview template rendering without AI enhancement
     */
    previewTemplate(templateId, context) {
        return this.templateManager.renderTemplate(templateId, context);
    }
    /**
     * Validate personalization configuration
     */
    validatePersonalization(config) {
        const errors = [];
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
        }
        else if (!this.isValidEmail(config.contactInfo.email)) {
            errors.push("Invalid email format");
        }
        if (!config.signature?.trim()) {
            errors.push("Signature is required");
        }
        return errors;
    }
    selectBestTemplate(type, audienceType) {
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
    buildRenderContext(request) {
        return {
            client: {
                name: request.context.clientName,
                contactPerson: request.context.contactPerson,
                companyName: request.context.companyName,
            },
            project: {
                name: request.context.projectName,
                requirements: request.context.requirements,
                estimate: request.context.estimate,
                analysis: request.context.projectAnalysis,
            },
            sender: request.personalization,
            date: new Date(),
            custom: request.context.customData || {},
        };
    }
    async enhanceWithAI(rendered, request) {
        const prompt = this.buildEnhancementPrompt(rendered, request);
        try {
            const response = await this.ollamaService.generateText(prompt, {
                temperature: 0.7,
                maxTokens: 2000,
            });
            return this.parseAIResponse(response, rendered);
        }
        catch (error) {
            console.warn("AI enhancement failed, using template output:", error);
            return rendered;
        }
    }
    buildEnhancementPrompt(rendered, request) {
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
    parseAIResponse(response, fallback) {
        try {
            const subjectMatch = response.match(/SUBJECT:\s*(.+)/);
            const bodyMatch = response.match(/BODY:\s*([\s\S]+)/);
            return {
                subject: subjectMatch?.[1]?.trim() || fallback.subject,
                body: bodyMatch?.[1]?.trim() || fallback.body,
            };
        }
        catch (error) {
            console.warn("Failed to parse AI response, using fallback");
            return fallback;
        }
    }
    countWords(text) {
        return text
            .trim()
            .split(/\s+/)
            .filter((word) => word.length > 0).length;
    }
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    generateId() {
        return `comm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
//# sourceMappingURL=CommunicationGenerator.js.map