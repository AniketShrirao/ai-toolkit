import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../index.js";

describe("Workflows API", () => {
  let authToken: string;

  beforeAll(async () => {
    // Get auth token for protected routes
    const loginResponse = await request(app).post("/api/auth/login").send({
      username: "admin",
      password: "admin123",
    });

    authToken = loginResponse.body.token;
  });

  describe("GET /api/workflows", () => {
    it("should require authentication", async () => {
      const response = await request(app).get("/api/workflows");

      expect(response.status).toBe(401);
    });

    it("should return workflows list with auth", async () => {
      const response = await request(app)
        .get("/api/workflows")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("workflows");
      expect(response.body).toHaveProperty("pagination");
    });
  });

  describe("POST /api/workflows", () => {
    const validWorkflow = {
      name: "Document Processing Workflow",
      definition: {
        steps: [
          {
            id: "analyze",
            type: "document_analysis",
            config: {
              analysisType: "full",
            },
          },
          {
            id: "estimate",
            type: "estimation",
            config: {
              hourlyRate: 100,
            },
          },
        ],
        triggers: [
          {
            type: "file_upload",
            config: {
              watchPath: "/uploads",
            },
          },
        ],
      },
      schedule: "0 9 * * 1", // Every Monday at 9 AM
      enabled: true,
    };

    it("should create workflow with valid definition", async () => {
      const response = await request(app)
        .post("/api/workflows")
        .set("Authorization", `Bearer ${authToken}`)
        .send(validWorkflow);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("workflow");
      expect(response.body.workflow.name).toBe(validWorkflow.name);
    });

    it("should validate workflow definition", async () => {
      const response = await request(app)
        .post("/api/workflows")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Invalid Workflow",
          definition: {
            // Missing required steps array
          },
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("code", "VALIDATION_ERROR");
    });

    it("should require workflow name", async () => {
      const response = await request(app)
        .post("/api/workflows")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          definition: validWorkflow.definition,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("code", "VALIDATION_ERROR");
    });
  });

  describe("GET /api/workflows/:id", () => {
    it("should return 404 for non-existent workflow", async () => {
      const response = await request(app)
        .get("/api/workflows/nonexistent")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("code", "NOT_FOUND");
    });
  });

  describe("POST /api/workflows/:id/execute", () => {
    it("should return 404 for non-existent workflow", async () => {
      const response = await request(app)
        .post("/api/workflows/nonexistent/execute")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ input: {} });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("code", "NOT_FOUND");
    });
  });

  describe("GET /api/workflows/:id/status", () => {
    it("should return 404 for non-existent execution", async () => {
      const response = await request(app)
        .get("/api/workflows/nonexistent/status")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("code", "NOT_FOUND");
    });
  });

  describe("PUT /api/workflows/:id", () => {
    it("should return 404 for non-existent workflow", async () => {
      const response = await request(app)
        .put("/api/workflows/nonexistent")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Updated Workflow",
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("code", "NOT_FOUND");
    });
  });

  describe("DELETE /api/workflows/:id", () => {
    it("should return 404 for non-existent workflow", async () => {
      const response = await request(app)
        .delete("/api/workflows/nonexistent")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("code", "NOT_FOUND");
    });
  });
});
