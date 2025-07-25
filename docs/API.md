# AI Toolkit API Documentation

## Overview

The AI Toolkit provides a comprehensive REST API for document processing and AI analysis using Ollama models.

## Base URL

- Development: `http://localhost:3000/api`
- Production: `https://your-domain.com/api`

## Authentication

Include API key in request headers:
```
Authorization: Bearer YOUR_API_KEY
```

## Rate Limiting

- General API: 100 requests per 15 minutes
- Upload endpoints: 10 requests per 15 minutes
- Burst allowance: 20 requests

## Content Types

- Request: `application/json` or `multipart/form-data`
- Response: `application/json`

## Error Responses

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional error details"
  }
}
```

## Endpoints

### Documents

#### Upload Document
Upload a document for processing.

**Request:**
```
POST /api/documents/upload
Content-Type: multipart/form-data

file: [binary file data]
metadata: {
  "name": "document.pdf",
  "description": "Optional description"
}
```

**Response:**
```json
{
  "documentId": "doc_123456",
  "filename": "document.pdf",
  "size": 1024000,
  "type": "application/pdf",
  "uploadedAt": "2024-01-15T10:30:00Z",
  "status": "uploaded"
}
```