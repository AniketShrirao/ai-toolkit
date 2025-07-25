import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    username: string;
    role: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export const setupWebSocket = (io: SocketIOServer) => {
  io.on("connection", (socket: AuthenticatedSocket) => {
    console.log("Socket.IO connection established:", socket.id);

    // Handle authentication
    socket.on("authenticate", (data) => {
      try {
        if (data.token) {
          try {
            const decoded = jwt.verify(data.token, JWT_SECRET) as any;
            socket.user = decoded;
            socket.emit("auth_success", {
              message: "Authentication successful",
            });
            console.log("Socket authenticated for user:", decoded.username);
          } catch (error) {
            socket.emit("auth_error", {
              message: "Invalid token",
            });
          }
        } else {
          // Allow unauthenticated connections for now
          socket.emit("auth_success", {
            message: "Connected without authentication",
          });
        }
      } catch (error) {
        console.error("Socket authentication error:", error);
        socket.emit("auth_error", {
          message: "Authentication failed",
        });
      }
    });

    // Handle document processing updates
    socket.on("subscribe_document_updates", () => {
      socket.join("document_updates");
      console.log("Socket subscribed to document updates:", socket.id);
    });

    // Handle system status updates
    socket.on("subscribe_system_status", () => {
      socket.join("system_status");
      console.log("Socket subscribed to system status:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket.IO connection closed:", socket.id, reason);
    });

    socket.on("error", (error) => {
      console.error("Socket.IO error:", error);
    });

    // Send initial connection success
    socket.emit("connected", {
      message: "Connected to AI Toolkit",
      timestamp: new Date().toISOString(),
    });
  });
};

export const broadcastToAll = (io: SocketIOServer, event: string, message: any) => {
  io.emit(event, message);
};

export const broadcastToRoom = (io: SocketIOServer, room: string, event: string, message: any) => {
  io.to(room).emit(event, message);
};

export const broadcastToUser = (
  io: SocketIOServer,
  userId: string,
  event: string,
  message: any
) => {
  // Find sockets for the specific user
  io.sockets.sockets.forEach((socket: AuthenticatedSocket) => {
    if (socket.user?.id === userId) {
      socket.emit(event, message);
    }
  });
};
