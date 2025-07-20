import { describe, it, expect, beforeEach } from "vitest";
import { TemplateManager } from "../templates/TemplateManager.js";
import {
  CommunicationTemplate,
  TemplateRenderContext,
} from "../types/communication.js";
import { createTestContext, createTestPersonalization } from "./setup.js";

describe("TemplateManager", () => {
  let templateManager: TemplateManager;

  beforeEach(() => {
    templateManager = new TemplateManager();
  });

  describe("Template Management", () => {
    it("should load default templates on initialization", () => {
      const initialContactTemplates =
        templateManager.getTemplatesByType("initial-contact");
      const proposalTemplates = templateManager.getTemplatesByType("proposal");
      const statusUpdateTemplates =
        templateManager.getTemplatesByType("status-update");

      expect(initialContactTemplates).toHaveLength(1);
      expect(proposalTemplates).toHaveLength(1);
      expect(statusUpdateTemplates).toHaveLength(1);
    });

    it("should add custom templates", () => {
      const customTemplate: CommunicationTemplate = {
        id: "custom-test",
        name: "Custom Test Template",
        type: "follow-up",
        subject: "Follow-up: {{project.name}}",
        body: "Hello {{client.contactPerson}}, following up on {{project.name}}.",
        variables: [],
        audienceType: "business",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      templateManager.addTemplate(customTemplate);
      const retrieved = templateManager.getTemplate("custom-test");

      expect(retrieved).toEqual(customTemplate);
    });

    it("should filter templates by type", () => {
      const proposalTemplates = templateManager.getTemplatesByType("proposal");

      expect(proposalTemplates).toHaveLength(1);
      expect(proposalTemplates[0].type).toBe("proposal");
    });

    it("should filter templates by audience", () => {
      const businessTemplates =
        templateManager.getTemplatesByAudience("business");
      const mixedTemplates = templateManager.getTemplatesByAudience("mixed");

      expect(businessTemplates.length).toBeGreaterThan(0);
      expect(mixedTemplates.length).toBeGreaterThan(0);

      businessTemplates.forEach((template) => {
        expect(template.audienceType).toBe("business");
      });
    });
  });

  describe("Template Rendering", () => {
    it("should render initial contact template correctly", () => {
      const context: TemplateRenderContext = {
        client: {
          name: "John Smith",
          contactPerson: "John Smith",
          companyName: "TechCorp Inc.",
        },
        project: {
          name: "E-commerce Platform",
          requirements: [
            {
              id: "req-1",
              type: "functional",
              priority: "high",
              description: "User authentication system",
              acceptanceCriteria: [],
              complexity: 8,
              estimatedHours: 40,
            },
          ],
        },
        sender: createTestPersonalization(),
        date: new Date("2024-01-15"),
        custom: {},
      };

      const rendered = templateManager.renderTemplate(
        "initial-contact-business",
        context
      );

      expect(rendered.subject).toContain("E-commerce Platform");
      expect(rendered.body).toContain("John Smith");
      expect(rendered.body).toContain("E-commerce Platform");
      expect(rendered.body).toContain("User authentication system");
      expect(rendered.body).toContain("Jane Developer");
    });

    it("should render proposal template with estimate data", () => {
      const testContext = createTestContext();
      const context: TemplateRenderContext = {
        client: {
          name: testContext.clientName,
          contactPerson: testContext.contactPerson,
          companyName: testContext.companyName,
        },
        project: {
          name: testContext.projectName,
          requirements: {
            functional:
              testContext.requirements?.filter(
                (r) => r.type === "functional"
              ) || [],
            nonFunctional:
              testContext.requirements?.filter(
                (r) => r.type === "non-functional"
              ) || [],
          },
          estimate: testContext.estimate,
          analysis: testContext.projectAnalysis,
        },
        sender: createTestPersonalization(),
        date: new Date("2024-01-15"),
        custom: {},
      };

      const rendered = templateManager.renderTemplate(
        "proposal-detailed",
        context
      );

      expect(rendered.subject).toContain("E-commerce Platform");
      expect(rendered.body).toContain("TechCorp Inc.");
      expect(rendered.body).toContain("80"); // total hours
      expect(rendered.body).toContain("$8,000"); // total cost
      expect(rendered.body).toContain("User authentication system");
    });

    it("should render status update template with custom data", () => {
      const testContext = createTestContext();
      const context: TemplateRenderContext = {
        client: {
          name: testContext.clientName,
          contactPerson: testContext.contactPerson,
          companyName: testContext.companyName,
        },
        project: {
          name: testContext.projectName,
        },
        sender: createTestPersonalization(),
        date: new Date("2024-01-15"),
        custom: testContext.customData,
      };

      const rendered = templateManager.renderTemplate(
        "status-update-standard",
        context
      );

      expect(rendered.body).toContain("Initial analysis");
      expect(rendered.body).toContain("UI mockups");
      expect(rendered.body).toContain("25% complete");
      expect(rendered.body).toContain("Waiting for API documentation");
    });
  });

  describe("Template Validation", () => {
    it("should validate correct templates", () => {
      const validTemplate: CommunicationTemplate = {
        id: "valid-test",
        name: "Valid Template",
        type: "initial-contact",
        subject: "Valid Subject: {{project.name}}",
        body: "Hello {{client.contactPerson}}, this is valid.",
        variables: [],
        audienceType: "business",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const errors = templateManager.validateTemplate(validTemplate);
      expect(errors).toHaveLength(0);
    });

    it("should detect invalid template syntax", () => {
      const invalidTemplate: CommunicationTemplate = {
        id: "invalid-test",
        name: "Invalid Template",
        type: "initial-contact",
        subject: "Invalid Subject: {{project.name}",
        body: "Hello {{client.contactPerson}, this has unclosed handlebars.",
        variables: [],
        audienceType: "business",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const errors = templateManager.validateTemplate(invalidTemplate);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain("Template compilation error");
    });
  });

  describe("Handlebars Helpers", () => {
    it("should format currency correctly", () => {
      const context: TemplateRenderContext = {
        client: { name: "Test Client" },
        project: { name: "Test Project" },
        sender: createTestPersonalization(),
        date: new Date(),
        custom: { amount: 1234.56 },
      };

      const template: CommunicationTemplate = {
        id: "currency-test",
        name: "Currency Test",
        type: "proposal",
        subject: "Test",
        body: "Total cost: {{currency custom.amount}}",
        variables: [],
        audienceType: "business",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      templateManager.addTemplate(template);
      const rendered = templateManager.renderTemplate("currency-test", context);

      expect(rendered.body).toContain("$1,234.56");
    });

    it("should format hours correctly", () => {
      const context: TemplateRenderContext = {
        client: { name: "Test Client" },
        project: { name: "Test Project" },
        sender: createTestPersonalization(),
        date: new Date(),
        custom: { hours: 20 },
      };

      const template: CommunicationTemplate = {
        id: "hours-test",
        name: "Hours Test",
        type: "proposal",
        subject: "Test",
        body: "Duration: {{hours custom.hours}}",
        variables: [],
        audienceType: "business",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      templateManager.addTemplate(template);
      const rendered = templateManager.renderTemplate("hours-test", context);

      expect(rendered.body).toContain("2 days and 4 hours");
    });

    it("should format bullet lists correctly", () => {
      const context: TemplateRenderContext = {
        client: { name: "Test Client" },
        project: { name: "Test Project" },
        sender: createTestPersonalization(),
        date: new Date(),
        custom: { tasks: ["Task 1", "Task 2", "Task 3"] },
      };

      const template: CommunicationTemplate = {
        id: "list-test",
        name: "List Test",
        type: "status-update",
        subject: "Test",
        body: "Tasks:\n{{bulletList custom.tasks}}",
        variables: [],
        audienceType: "business",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      templateManager.addTemplate(template);
      const rendered = templateManager.renderTemplate("list-test", context);

      expect(rendered.body).toContain("• Task 1");
      expect(rendered.body).toContain("• Task 2");
      expect(rendered.body).toContain("• Task 3");
    });
  });

  describe("Error Handling", () => {
    it("should throw error for non-existent template", () => {
      const context: TemplateRenderContext = {
        client: { name: "Test" },
        project: { name: "Test" },
        sender: createTestPersonalization(),
        date: new Date(),
        custom: {},
      };

      expect(() => {
        templateManager.renderTemplate("non-existent", context);
      }).toThrow("Template not found: non-existent");
    });
  });
});
