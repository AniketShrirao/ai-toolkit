# AI Toolkit with Ollama Integration

A comprehensive AI-powered document processing and analysis toolkit with integrated Ollama support for local AI model execution.

## Overview

The AI Toolkit provides a complete solution for document processing, analysis, and AI-powered insights using local Ollama models. It features a modular architecture with support for various document types, real-time processing, and a web-based dashboard.

## Features

- **Document Processing**: Support for PDF, DOCX, TXT, MD, and XLSX files
- **AI Analysis**: Integrated Ollama support with multiple model options
- **Web Dashboard**: Real-time monitoring and management interface
- **REST API**: Comprehensive API for integration
- **Containerized Deployment**: Docker and Docker Compose support
- **Scalable Architecture**: Modular design with Redis caching
- **Security**: Rate limiting, file validation, and secure processing

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for development)
- 8GB+ RAM (recommended for AI models)

### Installation

1. Clone the repository
2. Run the deployment script:
   ```bash
   ./scripts/deploy.sh development
   ```

### Access Points

- API Server: http://localhost:3000
- Web Dashboard: http://localhost:8080
- Ollama API: http://localhost:11434

## Architecture

The toolkit consists of several key packages:
- `api-server`: REST API and WebSocket server
- `ollama-interface`: Ollama integration layer
- `document-analyzer`: Document processing engine
- `web-dashboard`: React-based user interface
- `workflow-engine`: Job processing and orchestration## Con
figuration

### Environment Configuration

The toolkit supports multiple environments with specific configurations:

- `development.json`: Local development settings
- `production.json`: Production deployment settings

Key configuration sections:
- **Server**: Port, CORS, and host settings
- **Ollama**: Model configuration and connection settings
- **Database**: SQLite configuration
- **Redis**: Caching and queue configuration
- **Storage**: File handling and limits
- **Security**: Rate limiting and upload restrictions

### Ollama Models

Default models included:
- `llama2:7b`: General text processing
- `codellama:7b`: Code analysis and generation
- `mistral:7b`: Advanced analysis tasks

## API Documentation

### Authentication

Currently using basic API key authentication. Include the API key in headers:
```
Authorization: Bearer YOUR_API_KEY
```

### Core Endpoints

#### Document Upload
```
POST /api/documents/upload
Content-Type: multipart/form-data

Body: file (binary)
```

#### Document Analysis
```
POST /api/documents/{id}/analyze
Content-Type: application/json

{
  "analysisType": "summary|extraction|classification",
  "model": "llama2:7b|codellama:7b|mistral:7b"
}
```

#### Job Status
```
GET /api/jobs/{jobId}/status
```

#### Health Check
```
GET /health
```## D
eployment

### Development Deployment

```bash
# Start all services
./scripts/deploy.sh development

# View logs
./scripts/deploy.sh logs

# Stop services
./scripts/deploy.sh stop
```

### Production Deployment

```bash
# Deploy to production
./scripts/deploy.sh production

# Check status
./scripts/deploy.sh status
```

### Manual Docker Commands

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Development

### Project Structure

```
ai-toolkit/
├── packages/           # Monorepo packages
│   ├── api-server/    # REST API server
│   ├── ollama-interface/ # Ollama integration
│   ├── document-analyzer/ # Document processing
│   └── web-dashboard/ # Frontend interface
├── config/            # Environment configurations
├── scripts/           # Deployment and utility scripts
├── docs/             # Documentation
└── test/             # Test suites
```

### Running Tests

```bash
# All tests
npm test

# Specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e
```

### Code Quality

```bash
# Lint and format
npm run quality:fix

# Coverage report
npm run test:coverage
```## Tr
oubleshooting

### Common Issues

#### Ollama Connection Failed
- Ensure Ollama container is running: `docker-compose ps`
- Check Ollama logs: `docker-compose logs ollama`
- Verify models are pulled: `docker exec ai-toolkit-ollama ollama list`

#### High Memory Usage
- Monitor with: `docker stats`
- Adjust model selection in configuration
- Increase Docker memory limits

#### File Upload Errors
- Check file size limits in configuration
- Verify allowed file types
- Review nginx proxy settings for large files

#### Performance Issues
- Monitor Redis cache usage
- Check concurrent job limits
- Review database performance

### Logs and Monitoring

```bash
# Application logs
docker-compose logs ai-toolkit

# Ollama logs
docker-compose logs ollama

# All service logs
docker-compose logs -f
```

### Health Checks

- Application: http://localhost:3000/health
- Ollama: http://localhost:11434/api/tags
- Redis: `docker exec ai-toolkit-redis redis-cli ping`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Run quality checks: `npm run quality:check`
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: [Repository Issues](https://github.com/your-org/ai-toolkit/issues)
- Documentation: [Full Documentation](./docs/)
- API Reference: [API Documentation](./docs/API.md)