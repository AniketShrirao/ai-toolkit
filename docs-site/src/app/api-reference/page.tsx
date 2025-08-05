/* eslint-disable react/no-unescaped-entities */
export default function ApiReferencePage() {
  return (
    <div className="docs-content">
      <h1>API Reference</h1>
      <p>Complete API documentation for the AI Toolkit.</p>
      
      <h2>Base URL</h2>
      <p>All API requests should be made to:</p>
      <pre><code>http://localhost:3000/api</code></pre>
      
      <h2>Authentication</h2>
      <p>All API requests require proper authentication using API keys:</p>
      <pre><code>{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
  http://localhost:3000/api/documents`}</code></pre>
      
      <h2>API Categories</h2>
      
      <h3>Documents API</h3>
      <p>Manage document upload, processing, and retrieval.</p>
      <ul>
        <li><code>POST /api/documents/upload</code> - Upload a document</li>
        <li><code>GET /api/documents</code> - List all documents</li>
        <li><code>GET /api/documents/:id</code> - Get document details</li>
        <li><code>DELETE /api/documents/:id</code> - Delete a document</li>
      </ul>
      
      <h3>AI Analysis API</h3>
      <p>AI-powered document analysis and insights.</p>
      <ul>
        <li><code>POST /api/ai/analyze</code> - Analyze a document</li>
        <li><code>GET /api/ai/models</code> - List available AI models</li>
        <li><code>POST /api/ai/chat</code> - Chat with AI about documents</li>
      </ul>
      
      <h3>Health API</h3>
      <p>System health and status endpoints.</p>
      <ul>
        <li><code>GET /api/health</code> - System health check</li>
        <li><code>GET /api/status</code> - Detailed system status</li>
      </ul>
      
      <h2>Example Requests</h2>
      
      <h3>Upload a Document</h3>
      <pre><code>{`curl -X POST http://localhost:3000/api/documents/upload \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@document.pdf" \\
  -F "title=My Document"`}</code></pre>
      
      <h3>Get Document List</h3>
      <pre><code>{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
  http://localhost:3000/api/documents`}</code></pre>
      
      <h3>Analyze Document</h3>
      <pre><code>{`curl -X POST http://localhost:3000/api/ai/analyze \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"documentId": "doc-123", "analysisType": "summary"}'`}</code></pre>
      
      <h2>Response Format</h2>
      <p>All API responses follow this format:</p>
      <pre><code>{`{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "timestamp": "2024-01-01T00:00:00Z"
}`}</code></pre>
      
      <h2>Error Handling</h2>
      <p>Error responses include detailed information:</p>
      <pre><code>{`{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid file format",
    "details": { ... }
  },
  "timestamp": "2024-01-01T00:00:00Z"
}`}</code></pre>
      
      <h2>Rate Limiting</h2>
      <p>API requests are rate limited to prevent abuse:</p>
      <ul>
        <li>100 requests per minute for authenticated users</li>
        <li>10 requests per minute for unauthenticated requests</li>
        <li>Rate limit headers are included in responses</li>
      </ul>
      
      <div className="callout callout--info">
        <div className="callout__title">Need More Details?</div>
        <div className="callout__content">
          <p>For detailed endpoint documentation, parameter specifications, and response schemas, visit our interactive API documentation at:</p>
          <p><a href="http://localhost:3000/api-docs">http://localhost:3000/api-docs</a></p>
        </div>
      </div>
    </div>
  );
}