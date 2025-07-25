import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";

import { errorHandler } from "./middleware/errorHandler.js";
import { authMiddleware } from "./middleware/auth.js";
import { setupSwagger } from "./config/swagger.js";
import { setupWebSocket } from "./websocket/index.js";
import { JSONDatabaseManager } from "@ai-toolkit/data-layer";
import { initializeGlobalErrorHandler, getLogger, ConsoleTransport, LogLevel } from "@ai-toolkit/shared";
import * as fs from "fs-extra";

// Route imports
import documentRoutes from "./routes/documents.js";
import estimationRoutes from "./routes/estimation.js";
import workflowRoutes from "./routes/workflows.js";
import authRoutes from "./routes/auth.js";
import healthRoutes from "./routes/health.js";
import { integrityRouter } from "./routes/integrity.js";

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter as any);

// Body parsing middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Setup Swagger documentation
setupSwagger(app);

// Setup WebSocket
setupWebSocket(io);

// Public routes (no auth required)
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/integrity", integrityRouter);
app.use("/api/documents", documentRoutes); // Temporarily public for testing

// Protected routes (auth required)
app.use("/api/estimation", authMiddleware, estimationRoutes);
app.use("/api/workflows", authMiddleware, workflowRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

// Initialize database and required directories
async function initializeServer() {
  try {
    // Initialize global error handler
    const logger = getLogger();
    logger.addTransport(new ConsoleTransport(LogLevel.INFO));
    initializeGlobalErrorHandler(logger, {
      enableRecovery: true,
      maxRecoveryAttempts: 3,
    });
    console.log("✅ Global error handler initialized");

    // Create required directories
    await fs.ensureDir("uploads");
    await fs.ensureDir("data");
    
    // Initialize database
    const dbManager = new JSONDatabaseManager();
    await dbManager.initialize({
      databasePath: "./data/ai-toolkit.db",
      enableWAL: true,
      enableForeignKeys: true,
      busyTimeout: 5000,
      maxConnections: 10,
    });
    
    console.log("✅ Database initialized successfully");
    console.log("✅ Required directories created");
    
    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 API Server running on port ${PORT}`);
      console.log(`📚 Swagger documentation available at http://localhost:${PORT}/api-docs`);
      console.log(`🔧 System Integrity Check available at http://localhost:${PORT}/api/integrity/status`);
    });
  } catch (error) {
    console.error("❌ Failed to initialize server:", error);
    process.exit(1);
  }
}

// Initialize and start server
initializeServer();

export { app, server, io };
