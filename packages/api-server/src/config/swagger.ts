import { Express } from "express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "AI Toolkit API",
      version: "1.0.0",
      description:
        "RESTful API for AI-powered document processing, estimation, and workflow automation",
      contact: {
        name: "AI Toolkit Support",
        email: "support@ai-toolkit.com",
      },
    },
    servers: [
      {
        url: "http://localhost:3001",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            code: {
              type: "string",
              description: "Error code",
            },
            message: {
              type: "string",
              description: "Error message",
            },
            details: {
              type: "object",
              description: "Additional error details",
            },
            recoverable: {
              type: "boolean",
              description: "Whether the error is recoverable",
            },
            suggestions: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Suggestions for resolving the error",
            },
            timestamp: {
              type: "string",
              format: "date-time",
              description: "Error timestamp",
            },
          },
        },
        Document: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Document ID",
            },
            projectId: {
              type: "string",
              description: "Associated project ID",
            },
            originalPath: {
              type: "string",
              description: "Original file path",
            },
            type: {
              type: "string",
              enum: ["pdf", "docx", "txt", "md"],
              description: "Document type",
            },
            status: {
              type: "string",
              enum: ["pending", "processing", "completed", "failed"],
              description: "Processing status",
            },
            analysis: {
              type: "object",
              description: "Document analysis results",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Requirement: {
          type: "object",
          properties: {
            id: {
              type: "string",
            },
            type: {
              type: "string",
              enum: ["functional", "non-functional"],
            },
            priority: {
              type: "string",
              enum: ["high", "medium", "low"],
            },
            description: {
              type: "string",
            },
            acceptanceCriteria: {
              type: "array",
              items: {
                type: "string",
              },
            },
            complexity: {
              type: "number",
            },
            estimatedHours: {
              type: "number",
            },
          },
        },
        ProjectEstimate: {
          type: "object",
          properties: {
            totalHours: {
              type: "number",
            },
            totalCost: {
              type: "number",
            },
            breakdown: {
              type: "array",
              items: {
                type: "object",
              },
            },
            risks: {
              type: "array",
              items: {
                type: "object",
              },
            },
            assumptions: {
              type: "array",
              items: {
                type: "string",
              },
            },
            confidence: {
              type: "number",
              minimum: 0,
              maximum: 1,
            },
          },
        },
        Workflow: {
          type: "object",
          properties: {
            id: {
              type: "string",
            },
            name: {
              type: "string",
            },
            definition: {
              type: "object",
            },
            status: {
              type: "string",
              enum: ["active", "inactive", "running", "completed", "failed"],
            },
            schedule: {
              type: "string",
              description: "Cron schedule expression",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.ts"], // paths to files containing OpenAPI definitions
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  app.use("/api-docs", ...(swaggerUi.serve as any), swaggerUi.setup(specs) as any);
};
