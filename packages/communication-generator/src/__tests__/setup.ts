import { vi } from "vitest";
import { OllamaService } from "@ai-toolkit/ollama-interface";
import {
  CommunicationContext,
  PersonalizationConfig,
  CommunicationRequest,
  AudienceType,
  CommunicationType,
  OutputFormat,
} from "../types/communication.js";
import {
  ProjectEstimate,
  Requirement,
  DocumentAnalysis,
} from "@ai-toolkit/shared";

// Mock OllamaService
export const createMockOllamaService = (): OllamaService => {
  return {
    generateText: vi
      .fn()
      .mockResolvedValue(
        "SUBJECT: Enhanced Subject\n\nBODY:\nEnhanced body content with AI improvements."
      ),
    connect: vi.fn().mockResolvedValue(true),
    isConnected: vi.fn().mockReturnValue(true),
    getAvailableModels: vi.fn().mockResolvedValue([]),
    loadModel: vi.fn().mockResolvedValue(undefined),
    unloadModel: vi.fn().mockResolvedValue(undefined),
    getCurrentModel: vi.fn().mockReturnValue("llama2"),
    analyzeDocument: vi.fn(),
    extractRequirements: vi.fn(),
    generateEstimate: vi.fn(),
  } as any;
};

// Test data factories
export const createTestRequirements = (): Requirement[] => [
  {
    id: "req-1",
    type: "functional",
    priority: "high",
    description: "User authentication system",
    acceptanceCriteria: [
      "Users can log in",
      "Users can log out",
      "Password reset functionality",
    ],
    complexity: 8,
    estimatedHours: 40,
    category: "Authentication",
  },
  {
    id: "req-2",
    type: "functional",
    priority: "medium",
    description: "Dashboard with analytics",
    acceptanceCriteria: [
      "Display key metrics",
      "Interactive charts",
      "Export functionality",
    ],
    complexity: 6,
    estimatedHours: 24,
    category: "UI/UX",
  },
  {
    id: "req-3",
    type: "non-functional",
    priority: "high",
    description: "System performance requirements",
    acceptanceCriteria: [
      "Page load time < 2 seconds",
      "Support 1000 concurrent users",
    ],
    complexity: 7,
    estimatedHours: 16,
    category: "Performance",
  },
];

export const createTestEstimate = (): ProjectEstimate => ({
  id: "est-1",
  totalHours: 80,
  totalCost: 8000,
  breakdown: [
    {
      category: "Authentication",
      hours: 40,
      description: "User authentication and authorization",
      requirements: ["req-1"],
    },
    {
      category: "Dashboard",
      hours: 24,
      description: "Analytics dashboard development",
      requirements: ["req-2"],
    },
    {
      category: "Performance",
      hours: 16,
      description: "Performance optimization",
      requirements: ["req-3"],
    },
  ],
  risks: [
    {
      id: "risk-1",
      name: "Third-party API integration",
      probability: 0.3,
      impact: "medium",
      description: "External API may have rate limits",
      mitigation: "Implement caching and fallback mechanisms",
    },
  ],
  assumptions: [
    "Client will provide API access",
    "Design mockups will be available within 1 week",
  ],
  confidence: 85,
  requirements: createTestRequirements(),
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const createTestAnalysis = (): DocumentAnalysis => ({
  structure: {
    sections: [
      {
        id: "sec-1",
        title: "Project Overview",
        level: 1,
        content: "This project aims to create a modern web application...",
        startPage: 1,
        endPage: 2,
      },
    ],
    headings: [
      { level: 1, text: "Project Overview", page: 1 },
      { level: 2, text: "Requirements", page: 2 },
    ],
    paragraphs: 15,
    lists: 3,
    tables: 1,
    images: 2,
  },
  requirements: {
    functional: createTestRequirements().filter((r) => r.type === "functional"),
    nonFunctional: createTestRequirements().filter(
      (r) => r.type === "non-functional"
    ),
    totalCount: 3,
  },
  keyPoints: [
    {
      id: "kp-1",
      text: "Modern web application with user authentication",
      importance: "high",
      category: "Core Feature",
      context: "Main application requirement",
    },
  ],
  actionItems: [
    {
      id: "ai-1",
      description: "Finalize API specifications",
      priority: "high",
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: "pending",
    },
  ],
  summary: {
    length: "medium",
    content:
      "This project involves developing a comprehensive web application with user authentication, analytics dashboard, and performance optimization.",
    keyPoints: [
      "User authentication",
      "Analytics dashboard",
      "Performance optimization",
    ],
    wordCount: 150,
  },
  contentCategories: [
    {
      type: "Technical Requirements",
      confidence: 0.9,
      description: "Detailed technical specifications and requirements",
    },
  ],
});

export const createTestContext = (): CommunicationContext => ({
  clientName: "John Smith",
  projectName: "E-commerce Platform",
  contactPerson: "John Smith",
  companyName: "TechCorp Inc.",
  projectAnalysis: createTestAnalysis(),
  estimate: createTestEstimate(),
  requirements: createTestRequirements(),
  customData: {
    completedTasks: ["Initial analysis", "Requirements gathering"],
    inProgressTasks: ["UI mockups", "Database design"],
    upcomingTasks: ["API development", "Frontend implementation"],
    progressPercentage: 25,
    blockers: ["Waiting for API documentation"],
    questions: ["Should we use OAuth or custom authentication?"],
  },
});

export const createTestPersonalization = (): PersonalizationConfig => ({
  senderName: "Jane Developer",
  senderTitle: "Senior Software Engineer",
  companyName: "DevSolutions LLC",
  contactInfo: {
    email: "jane@devsolutions.com",
    phone: "+1-555-0123",
    website: "https://devsolutions.com",
    address: "123 Tech Street, Silicon Valley, CA",
  },
  signature: "Best regards,\nJane Developer\nSenior Software Engineer",
  branding: {
    primaryColor: "#007bff",
    secondaryColor: "#6c757d",
    fontFamily: "Arial, sans-serif",
  },
});

export const createTestRequest = (
  type: CommunicationType = "initial-contact",
  audienceType: AudienceType = "business",
  format: OutputFormat = "email"
): CommunicationRequest => ({
  type,
  format,
  audienceType,
  context: createTestContext(),
  personalization: createTestPersonalization(),
  customInstructions: "Make it more friendly and include technical details",
});
