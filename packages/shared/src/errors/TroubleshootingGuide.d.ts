/**
 * Troubleshooting guide system for the AI Toolkit
 * Provides user-friendly error messages and step-by-step troubleshooting
 */
import { BaseError, ErrorCategory, TroubleshootingStep } from "./ErrorTypes.js";
export interface TroubleshootingGuide {
    title: string;
    description: string;
    category: ErrorCategory;
    steps: TroubleshootingStep[];
    additionalResources: ResourceLink[];
    estimatedTime: string;
    difficulty: "beginner" | "intermediate" | "advanced";
}
export interface ResourceLink {
    title: string;
    url: string;
    type: "documentation" | "video" | "forum" | "github";
}
export declare class TroubleshootingGuideManager {
    private guides;
    constructor();
    /**
     * Get troubleshooting guide for an error
     */
    getGuideForError(error: BaseError): TroubleshootingGuide | null;
    /**
     * Get all available guides
     */
    getAllGuides(): TroubleshootingGuide[];
    /**
     * Get guides by category
     */
    getGuidesByCategory(category: ErrorCategory): TroubleshootingGuide[];
    /**
     * Register a custom troubleshooting guide
     */
    registerGuide(key: string, guide: TroubleshootingGuide): void;
    /**
     * Generate user-friendly error message with troubleshooting steps
     */
    generateUserMessage(error: BaseError): string;
    /**
     * Generate HTML troubleshooting guide
     */
    generateHtmlGuide(error: BaseError): string;
    /**
     * Initialize built-in troubleshooting guides
     */
    private initializeBuiltInGuides;
}
//# sourceMappingURL=TroubleshootingGuide.d.ts.map