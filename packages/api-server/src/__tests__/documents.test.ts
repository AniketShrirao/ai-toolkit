import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import path from "path";
import { app } from "../index.js";

describe("Documents API", () => {
  let authToken: string;

  beforeAll(async () => {
    // Get auth token for protected routes
    const loginResponse = await request(app).post("/api/auth/login").send({
      username: "admin",
      password: "admin123",
    });

    authToken = loginResponse.body.token;
  });

  describe("GET /api/documents", () => {
    it("should require authentication", async () => {
      const response = await request(app).get("/api/documents");

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("code", "AUTHENTICATION_ERROR");
    });

    it("should return documents list with auth", async () => {
      const response = await request(app)
        .get("/api/documents")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("documents");
      expect(response.body).toHaveProperty("pagination");
    });

    it("should support pagination", async () => {
      const response = await request(app)
        .get("/api/documents?page=1&limit=5")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
    });
  });

  describe("POST /api/documents/upload", () => {
    it("should require authentication", async () => {
      const response = await request(app)
        .post("/api/documents/upload")
        .attach("file", Buffer.from("test content"), "test.txt");

      expect(response.status).toBe(401);
    });

    it("should upload document with auth", async () => {
      const response = await request(app)
        .post("/api/documents/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("file", Buffer.from("test content"), "test.txt")
        .field("analysisType", "summary");

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("document");
    });

    it("should validate file type", async () => {
      const response = await request(app)
        .post("/api/documents/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("file", Buffer.from("test content"), "test.exe");

      expect(response.status).toBe(500); // Multer error
    });
  });

  describe("GET /api/documents/:id", () => {
    it("should return 404 for non-existent document", async () => {
      const response = await request(app)
        .get("/api/documents/nonexistent")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("code", "NOT_FOUND");
    });
  });

  describe("DELETE /api/documents/:id", () => {
    it("should return 404 for non-existent document", async () => {
      const response = await request(app)
        .delete("/api/documents/nonexistent")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("code", "NOT_FOUND");
    });
  });
});
