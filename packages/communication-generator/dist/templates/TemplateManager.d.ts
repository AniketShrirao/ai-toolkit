import { CommunicationTemplate, CommunicationType, AudienceType, TemplateRenderContext } from "../types/communication.js";
export declare class TemplateManager {
    private templates;
    private compiledTemplates;
    constructor();
    private registerHelpers;
    private loadDefaultTemplates;
    addTemplate(template: CommunicationTemplate): void;
    getTemplate(id: string): CommunicationTemplate | undefined;
    getTemplatesByType(type: CommunicationType): CommunicationTemplate[];
    getTemplatesByAudience(audienceType: AudienceType): CommunicationTemplate[];
    renderTemplate(templateId: string, context: TemplateRenderContext): {
        subject: string;
        body: string;
    };
    validateTemplate(template: CommunicationTemplate): string[];
    private getInitialContactTemplate;
    private getProposalTemplate;
    private getStatusUpdateTemplate;
    private getInitialContactVariables;
    private getProposalVariables;
    private getStatusUpdateVariables;
}
//# sourceMappingURL=TemplateManager.d.ts.map