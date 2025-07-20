import {
  BaseEntity,
  Priority,
  ProjectEstimate,
  Requirement,
  DocumentAnalysis,
} from "./shared.js";

export type CommunicationType =
  | "initial-contact"
  | "proposal"
  | "status-update"
  | "project-completion"
  | "follow-up"
  | "clarification-request";

export type AudienceType = "technical" | "business" | "mixed" | "executive";

export type OutputFormat = "email" | "pdf" | "markdown" | "html";

export interface CommunicationTemplate {
  id: string;
  name: string;
  type: CommunicationType;
  subject: string;
  body: string;
  variables: TemplateVariable[];
  audienceType: AudienceType;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateVariable {
  name: string;
  type: "string" | "number" | "date" | "array" | "object";
  required: boolean;
  description: string;
  defaultValue?: any;
}

export interface CommunicationContext {
  clientName: string;
  projectName: string;
  contactPerson?: string;
  companyName?: string;
  projectAnalysis?: DocumentAnalysis;
  estimate?: ProjectEstimate;
  requirements?: Requirement[];
  customData?: Record<string, any>;
}

export interface PersonalizationConfig {
  senderName: string;
  senderTitle: string;
  companyName: string;
  contactInfo: ContactInfo;
  signature: string;
  branding?: BrandingConfig;
}

export interface ContactInfo {
  email: string;
  phone?: string;
  website?: string;
  address?: string;
}

export interface BrandingConfig {
  primaryColor: string;
  secondaryColor: string;
  logo?: string;
  fontFamily?: string;
}

export interface GeneratedCommunication extends BaseEntity {
  type: CommunicationType;
  format: OutputFormat;
  subject: string;
  content: string;
  context: CommunicationContext;
  templateId: string;
  audienceType: AudienceType;
  wordCount: number;
  estimatedReadTime: number;
}

export interface CommunicationRequest {
  type: CommunicationType;
  format: OutputFormat;
  audienceType: AudienceType;
  context: CommunicationContext;
  personalization: PersonalizationConfig;
  templateId?: string;
  customInstructions?: string;
}

export interface TemplateRenderContext {
  client: {
    name: string;
    contactPerson?: string;
    companyName?: string;
  };
  project: {
    name: string;
    requirements?: Requirement[];
    estimate?: ProjectEstimate;
    analysis?: DocumentAnalysis;
  };
  sender: PersonalizationConfig;
  date: Date;
  custom?: Record<string, any>;
}
