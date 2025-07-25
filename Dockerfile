# Multi-stage build for AI Toolkit with Ollama integration
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Copy workspace packages
COPY packages/ ./packages/

# Install dependencies
RUN npm ci --only=production

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install system dependencies for AI toolkit
RUN apk add --no-cache \
    python3 \
    py3-pip \
    curl \
    bash \
    git \
    && rm -rf /var/cache/apk/*

# Create app user
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/package*.json ./

# Copy configuration and scripts
COPY --chown=appuser:appgroup config/ ./config/
COPY --chown=appuser:appgroup scripts/ ./scripts/

# Create necessary directories
RUN mkdir -p /app/data/input /app/data/output /app/logs /app/temp && \
    chown -R appuser:appgroup /app/data /app/logs /app/temp

# Switch to non-root user
USER appuser

# Expose ports
EXPOSE 3000 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start command
CMD ["node", "dist/packages/api-server/src/index.js"]