# AI Toolkit Setup Guide

## 🚀 Complete Setup and Troubleshooting Guide

### **Prerequisites**
- Node.js 18+ or 20+
- npm 8+
- Git
- Docker (optional, for containerized deployment)

---

## **Phase 1: Environment Setup**

### Step 1: Check Node.js Version
```bash
node --version  # Should be 18+ or 20+
npm --version   # Should be 8+
```

### Step 2: Install Root Dependencies
```bash
npm install
```

### Step 3: Clean Previous Builds
```bash
npm run clean
```

---

## **Phase 2: Fix Known Issues**

### Step 4: Fix Swagger Configuration Issue
Edit `packages/api-server/src/config/swagger.ts` line 214:
```typescript
// Replace this:
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// With this:
app.use("/api-docs", ...swaggerUi.serve, swaggerUi.setup(specs));
```

### Step 5: Verify Shared Package Exports
```bash
cd packages/shared
npm run build
cd ../..
```

---

## **Phase 3: Build All Packages**

### Step 6: Build Shared Package First (Critical)
```bash
cd packages/shared
npm install
npm run build
cd ../..
```

### Step 7: Build API Server
```bash
cd packages/api-server
npm install
npm run build
cd ../..
```

### Step 8: Build Web Dashboard
```bash
cd packages/web-dashboard
npm install
npm run build
cd ../..
```

### Step 9: Build All Packages from Root
```bash
npm run build
```

---

## **Phase 4: Run the Application**

### Option A: Development Mode (Recommended)

#### Step 10: Start API Server
```bash
cd packages/api-server
npm run dev
```
- Should start on `http://localhost:3001`
- API docs available at `http://localhost:3001/api-docs`

#### Step 11: Start Web Dashboard (New Terminal)
```bash
cd packages/web-dashboard
npm run dev
```
- Should start on `http://localhost:5173` (Vite default)

### Option B: Production Mode with Docker

#### Step 12: Using Docker Compose
```bash
# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

---

## **Phase 5: Verify Everything Works**

### Step 13: Test API Endpoints
```bash
# Health check
curl http://localhost:3001/api/health

# API documentation
curl http://localhost:3001/api-docs
```

### Step 14: Test Integrity Check CLI
```bash
npm run check-integrity -- --help
```

### Step 15: Access Web Dashboard
- Open `http://localhost:5173` (dev) or `http://localhost:8080` (docker)
- Navigate to Settings → Debug tab to test integrity checks

---

## **Common Error Fixes**

### TypeScript Errors
```bash
# Clean and rebuild everything
npm run clean
npm run build

# If still failing, rebuild packages individually
cd packages/shared && npm run build && cd ../..
cd packages/api-server && npm run build && cd ../..
cd packages/web-dashboard && npm run build && cd ../..
```

### Import/Export Errors
```bash
# Check if all packages are properly linked
npm run build
npm ls @ai-toolkit/shared
```

### Docker Issues
```bash
# Check Docker is running
docker --version
docker-compose --version

# Clean Docker cache
docker system prune -f
docker-compose down -v
docker-compose up --build
```

### Port Conflicts
```bash
# Check what's using the ports
netstat -tulpn | grep :3001
netstat -tulpn | grep :5173

# Kill processes if needed (Linux/Mac)
sudo kill -9 $(lsof -t -i:3001)
sudo kill -9 $(lsof -t -i:5173)

# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

---

## **Optional Enhancements**

### Step 16: Set up Ollama (for AI features)
```bash
# Install Ollama locally
curl -fsSL https://ollama.ai/install.sh | sh

# Or use Docker
docker run -d -p 11434:11434 --name ollama ollama/ollama
```

### Step 17: Run Tests
```bash
npm test
```

### Step 18: Run Linting
```bash
npm run lint:fix
```

---

## **Expected Results**
- ✅ API Server running on `http://localhost:3001`
- ✅ Web Dashboard running on `http://localhost:5173` (dev) or `http://localhost:8080` (docker)
- ✅ Swagger docs at `http://localhost:3001/api-docs`
- ✅ Integrity check CLI working
- ✅ All packages building without errors

---

## **Troubleshooting**

### Get Detailed Error Information
```bash
# Enable verbose logging
DEBUG=* npm run dev

# Check specific package logs
cd packages/api-server && npm run dev
cd packages/web-dashboard && npm run dev
```

### Common Issues Checklist
1. **Port conflicts** - Make sure ports 3001, 5173, 8080 are free
2. **Node version** - Use Node 18+ or 20+
3. **Memory issues** - Close other applications if build fails
4. **File permissions** - Ensure you have write permissions in the project directory
5. **Network issues** - Check if you can access external npm registry

---

## **Project Structure**
```
ai-toolkit/
├── packages/
│   ├── api-server/          # Express.js API server
│   ├── web-dashboard/       # React web interface
│   ├── shared/              # Shared types and utilities
│   ├── ollama-interface/    # Ollama AI integration
│   ├── document-analyzer/   # Document processing
│   └── ...                  # Other packages
├── scripts/                 # Deployment and utility scripts
├── docker-compose.yml       # Docker configuration
├── Dockerfile              # Container build instructions
└── SETUP_GUIDE.md          # This file
```

---

## **Support**
If you encounter issues not covered in this guide, please:
1. Check the error logs carefully
2. Ensure all prerequisites are met
3. Try the troubleshooting steps above
4. Create an issue with detailed error information