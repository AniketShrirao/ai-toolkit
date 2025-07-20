import Handlebars from "handlebars";
import { format } from "date-fns";
export class TemplateManager {
    templates = new Map();
    compiledTemplates = new Map();
    constructor() {
        this.registerHelpers();
        this.loadDefaultTemplates();
    }
    registerHelpers() {
        // Date formatting helper
        Handlebars.registerHelper("formatDate", (date, formatStr = "PPP") => {
            return format(date, formatStr);
        });
        // Currency formatting helper
        Handlebars.registerHelper("currency", (amount, currency = "USD") => {
            return new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: currency,
            }).format(amount);
        });
        // Hours formatting helper
        Handlebars.registerHelper("hours", (hours) => {
            if (hours < 8) {
                return `${hours} hours`;
            }
            const days = Math.floor(hours / 8);
            const remainingHours = hours % 8;
            if (remainingHours === 0) {
                return `${days} ${days === 1 ? "day" : "days"}`;
            }
            return `${days} ${days === 1 ? "day" : "days"} and ${remainingHours} hours`;
        });
        // Priority formatting helper
        Handlebars.registerHelper("priorityLabel", (priority) => {
            const labels = {
                critical: "Critical Priority",
                high: "High Priority",
                medium: "Medium Priority",
                low: "Low Priority",
            };
            return labels[priority] || priority;
        });
        // Conditional helper for technical details
        Handlebars.registerHelper("ifTechnical", function (audienceType, options) {
            if (audienceType === "technical" || audienceType === "mixed") {
                return options.fn(this);
            }
            return options.inverse(this);
        });
        // List formatting helper
        Handlebars.registerHelper("bulletList", (items) => {
            return items.map((item) => `• ${item}`).join("\n");
        });
    }
    loadDefaultTemplates() {
        const defaultTemplates = [
            {
                id: "initial-contact-business",
                name: "Initial Contact - Business",
                type: "initial-contact",
                subject: "Project Analysis Complete - {{project.name}}",
                body: this.getInitialContactTemplate(),
                variables: this.getInitialContactVariables(),
                audienceType: "business",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: "proposal-detailed",
                name: "Detailed Project Proposal",
                type: "proposal",
                subject: "Project Proposal - {{project.name}}",
                body: this.getProposalTemplate(),
                variables: this.getProposalVariables(),
                audienceType: "mixed",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: "status-update-standard",
                name: "Standard Status Update",
                type: "status-update",
                subject: "Project Update - {{project.name}}",
                body: this.getStatusUpdateTemplate(),
                variables: this.getStatusUpdateVariables(),
                audienceType: "business",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];
        defaultTemplates.forEach((template) => {
            this.addTemplate(template);
        });
    }
    addTemplate(template) {
        this.templates.set(template.id, template);
        this.compiledTemplates.delete(template.id); // Clear cached compilation
    }
    getTemplate(id) {
        return this.templates.get(id);
    }
    getTemplatesByType(type) {
        return Array.from(this.templates.values()).filter((t) => t.type === type);
    }
    getTemplatesByAudience(audienceType) {
        return Array.from(this.templates.values()).filter((t) => t.audienceType === audienceType);
    }
    renderTemplate(templateId, context) {
        const template = this.templates.get(templateId);
        if (!template) {
            throw new Error(`Template not found: ${templateId}`);
        }
        let compiledTemplate = this.compiledTemplates.get(templateId);
        if (!compiledTemplate) {
            compiledTemplate = Handlebars.compile(template.body);
            this.compiledTemplates.set(templateId, compiledTemplate);
        }
        const compiledSubject = Handlebars.compile(template.subject);
        return {
            subject: compiledSubject(context),
            body: compiledTemplate(context),
        };
    }
    validateTemplate(template) {
        const errors = [];
        try {
            Handlebars.compile(template.subject);
            Handlebars.compile(template.body);
        }
        catch (error) {
            errors.push(`Template compilation error: ${error.message}`);
        }
        return errors;
    }
    getInitialContactTemplate() {
        return `Dear {{client.contactPerson}},

I hope this email finds you well. I have completed the analysis of your project requirements for {{project.name}}, and I'm excited to share the findings with you.

## Project Overview

Based on my analysis of your documentation, I've identified {{project.requirements.length}} key requirements that will drive the development of your project. The analysis shows a well-structured project with clear objectives and deliverables.

{{#if project.analysis.summary}}
**Project Summary:**
{{project.analysis.summary.content}}
{{/if}}

## Key Requirements Identified

{{#each project.requirements}}
• {{this.description}} ({{priorityLabel this.priority}})
{{/each}}

{{#if project.estimate}}
## Initial Estimate

Based on the requirements analysis, here's a preliminary estimate:

- **Total Development Time:** {{hours project.estimate.totalHours}}
- **Estimated Cost:** {{currency project.estimate.totalCost}}
- **Confidence Level:** {{project.estimate.confidence}}%

{{#if project.estimate.risks}}
**Key Considerations:**
{{#each project.estimate.risks}}
• {{this.description}}
{{/each}}
{{/if}}
{{/if}}

## Next Steps

I would love to discuss these findings with you in more detail and answer any questions you might have. Would you be available for a brief call this week to go over the analysis and discuss how we can move forward?

I'm confident that we can deliver a solution that meets your needs and exceeds your expectations.

Best regards,

{{sender.senderName}}
{{sender.senderTitle}}
{{sender.companyName}}
{{sender.contactInfo.email}}
{{#if sender.contactInfo.phone}}{{sender.contactInfo.phone}}{{/if}}`;
    }
    getProposalTemplate() {
        return `# Project Proposal: {{project.name}}

**Prepared for:** {{client.companyName}}  
**Prepared by:** {{sender.companyName}}  
**Date:** {{formatDate date}}

---

## Executive Summary

This proposal outlines the development approach, timeline, and investment required for {{project.name}}. Based on our comprehensive analysis of your requirements, we have identified a clear path to deliver a solution that meets your business objectives.

{{#if project.analysis.summary}}
**Project Overview:**
{{project.analysis.summary.content}}
{{/if}}

## Requirements Analysis

We have analyzed your project requirements and categorized them as follows:

### Functional Requirements ({{project.requirements.functional.length}})
{{#each project.requirements.functional}}
**{{@index}}.** {{this.description}}
- Priority: {{priorityLabel this.priority}}
- Estimated Effort: {{hours this.estimatedHours}}
{{#if this.acceptanceCriteria}}
- Acceptance Criteria:
{{#each this.acceptanceCriteria}}
  - {{this}}
{{/each}}
{{/if}}

{{/each}}

### Non-Functional Requirements ({{project.requirements.nonFunctional.length}})
{{#each project.requirements.nonFunctional}}
**{{@index}}.** {{this.description}}
- Priority: {{priorityLabel this.priority}}
- Estimated Effort: {{hours this.estimatedHours}}

{{/each}}

## Project Estimate

### Time and Cost Breakdown

| Category | Hours | Cost |
|----------|-------|------|
{{#each project.estimate.breakdown}}
| {{this.category}} | {{this.hours}} | {{currency (multiply this.hours ../hourlyRate)}} |
{{/each}}
| **Total** | **{{project.estimate.totalHours}}** | **{{currency project.estimate.totalCost}}** |

**Confidence Level:** {{project.estimate.confidence}}%

### Risk Assessment

{{#each project.estimate.risks}}
**{{priorityLabel this.impact}} Risk:** {{this.name}}
- Description: {{this.description}}
- Mitigation: {{this.mitigation}}

{{/each}}

{{#ifTechnical audienceType}}
## Technical Approach

{{#if project.analysis.structure}}
The project will be structured with the following key components:
{{#each project.analysis.structure.sections}}
- **{{this.title}}:** {{this.content}}
{{/each}}
{{/if}}

### Development Methodology
We will follow an agile development approach with regular checkpoints and deliverables to ensure transparency and alignment with your expectations.
{{/ifTechnical}}

## Timeline

Based on the complexity analysis and resource allocation, the estimated timeline is:

- **Project Duration:** {{hours project.estimate.totalHours}} (approximately {{divide project.estimate.totalHours 40}} weeks)
- **Key Milestones:** To be defined during project kickoff

## Investment

**Total Project Investment:** {{currency project.estimate.totalCost}}

This investment includes:
- All development work as outlined in the requirements
- Regular progress updates and communication
- Testing and quality assurance
- Documentation and knowledge transfer

## Next Steps

1. Review and approve this proposal
2. Schedule project kickoff meeting
3. Finalize project timeline and milestones
4. Begin development work

We are excited about the opportunity to work with you on {{project.name}} and are confident in our ability to deliver exceptional results.

---

**Contact Information:**
{{sender.senderName}}  
{{sender.senderTitle}}  
{{sender.companyName}}  
Email: {{sender.contactInfo.email}}  
{{#if sender.contactInfo.phone}}Phone: {{sender.contactInfo.phone}}{{/if}}  
{{#if sender.contactInfo.website}}Website: {{sender.contactInfo.website}}{{/if}}`;
    }
    getStatusUpdateTemplate() {
        return `Subject: Project Update - {{project.name}}

Dear {{client.contactPerson}},

I hope you're doing well. I wanted to provide you with a quick update on the progress of {{project.name}}.

## Current Status

{{#if custom.completedTasks}}
**Completed This Week:**
{{bulletList custom.completedTasks}}
{{/if}}

{{#if custom.inProgressTasks}}
**Currently Working On:**
{{bulletList custom.inProgressTasks}}
{{/if}}

{{#if custom.upcomingTasks}}
**Planned for Next Week:**
{{bulletList custom.upcomingTasks}}
{{/if}}

{{#if custom.progressPercentage}}
**Overall Progress:** {{custom.progressPercentage}}% complete
{{/if}}

{{#if custom.blockers}}
## Blockers and Challenges

{{bulletList custom.blockers}}
{{/if}}

{{#if custom.questions}}
## Questions for You

{{bulletList custom.questions}}
{{/if}}

## Next Steps

{{#if custom.nextSteps}}
{{bulletList custom.nextSteps}}
{{else}}
I'll continue working on the current tasks and will reach out if I need any clarification or input from your side.
{{/if}}

As always, please don't hesitate to reach out if you have any questions or concerns.

Best regards,

{{sender.senderName}}
{{sender.senderTitle}}
{{sender.companyName}}
{{sender.contactInfo.email}}`;
    }
    getInitialContactVariables() {
        return [
            {
                name: "client.contactPerson",
                type: "string",
                required: true,
                description: "Client contact person name",
            },
            {
                name: "project.name",
                type: "string",
                required: true,
                description: "Project name",
            },
            {
                name: "project.requirements",
                type: "array",
                required: true,
                description: "Project requirements array",
            },
            {
                name: "project.analysis",
                type: "object",
                required: false,
                description: "Project analysis results",
            },
            {
                name: "project.estimate",
                type: "object",
                required: false,
                description: "Project estimate",
            },
            {
                name: "sender",
                type: "object",
                required: true,
                description: "Sender information",
            },
        ];
    }
    getProposalVariables() {
        return [
            {
                name: "client.companyName",
                type: "string",
                required: true,
                description: "Client company name",
            },
            {
                name: "project.name",
                type: "string",
                required: true,
                description: "Project name",
            },
            {
                name: "project.requirements",
                type: "object",
                required: true,
                description: "Categorized requirements",
            },
            {
                name: "project.estimate",
                type: "object",
                required: true,
                description: "Detailed project estimate",
            },
            {
                name: "sender",
                type: "object",
                required: true,
                description: "Sender information",
            },
            {
                name: "date",
                type: "date",
                required: true,
                description: "Proposal date",
            },
        ];
    }
    getStatusUpdateVariables() {
        return [
            {
                name: "client.contactPerson",
                type: "string",
                required: true,
                description: "Client contact person name",
            },
            {
                name: "project.name",
                type: "string",
                required: true,
                description: "Project name",
            },
            {
                name: "custom.completedTasks",
                type: "array",
                required: false,
                description: "Completed tasks list",
            },
            {
                name: "custom.inProgressTasks",
                type: "array",
                required: false,
                description: "In-progress tasks list",
            },
            {
                name: "custom.upcomingTasks",
                type: "array",
                required: false,
                description: "Upcoming tasks list",
            },
            {
                name: "custom.progressPercentage",
                type: "number",
                required: false,
                description: "Overall progress percentage",
            },
            {
                name: "sender",
                type: "object",
                required: true,
                description: "Sender information",
            },
        ];
    }
}
//# sourceMappingURL=TemplateManager.js.map