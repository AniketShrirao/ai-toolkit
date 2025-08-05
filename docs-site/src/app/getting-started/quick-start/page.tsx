/* eslint-disable react/no-unescaped-entities */
export default function QuickStartPage() {
  return (
    <div className="docs-content">
      <h1>Quick Start</h1>
      <p>Get up and running with the AI Toolkit in minutes.</p>
      
      <h2>Step 1: Installation</h2>
      <p>First, install the AI Toolkit following the <a href="/getting-started/installation">installation guide</a>.</p>
      <pre><code>npm install -g @ai-toolkit/cli
ai-toolkit init my-first-project
cd my-first-project</code></pre>
      
      <h2>Step 2: Basic Configuration</h2>
      <p>Configure your environment variables and basic settings:</p>
      <pre><code># Edit .env file
DATABASE_URL=postgresql://user:password@localhost:5432/ai_toolkit
OLLAMA_HOST=http://localhost:11434
DEFAULT_MODEL=llama2</code></pre>
      
      <h2>Step 3: Start the Services</h2>
      <p>Start the AI Toolkit services:</p>
      <pre><code>npm run dev</code></pre>
      
      <h2>Step 4: Your First Document</h2>
      <p>Upload and process your first document:</p>
      <ol>
        <li>Open http://localhost:3000 in your browser</li>
        <li>Click "Upload Document" in the dashboard</li>
        <li>Select a PDF, text file, or image</li>
        <li>Wait for processing to complete</li>
        <li>View the AI-generated insights</li>
      </ol>
      
      <h2>Step 5: Explore the API</h2>
      <p>Try the API endpoints:</p>
      <pre><code># Health check
curl http://localhost:3000/api/health

# Upload a document via API
curl -X POST http://localhost:3000/api/documents/upload \
  -F "file=@document.pdf"</code></pre>
      
      <div className="callout callout--info">
        <div className="callout__title">What's Next?</div>
        <div className="callout__content">
          <p>Now that you have the basics working, explore:</p>
          <ul>
            <li><a href="/api-reference">API Reference</a> - Complete API documentation</li>
            <li><a href="/guides">Guides</a> - Step-by-step tutorials</li>
            <li><a href="/packages">Packages</a> - Individual package documentation</li>
          </ul>
        </div>
      </div>
    </div>
  );
}