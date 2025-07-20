import { OllamaService } from "@ai-toolkit/ollama-interface";
import { CommunicationContext, PersonalizationConfig, CommunicationRequest, AudienceType, CommunicationType, OutputFormat } from "../types/communication.js";
import { ProjectEstimate, Requirement, DocumentAnalysis } from "@ai-toolkit/shared";
export declare const createMockOllamaService: () => OllamaService;
export declare const createTestRequirements: () => Requirement[];
export declare const createTestEstimate: () => ProjectEstimate;
export declare const createTestAnalysis: () => DocumentAnalysis;
export declare const createTestContext: () => CommunicationContext;
export declare const createTestPersonalization: () => PersonalizationConfig;
export declare const createTestRequest: (type?: CommunicationType, audienceType?: AudienceType, format?: OutputFormat) => CommunicationRequest;
//# sourceMappingURL=setup.d.ts.map