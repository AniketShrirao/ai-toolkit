export default function GettingStartedPage() {
  return (
    <div className="docs-content">
      <h1>Getting Started with AI Toolkit</h1>
      <p>Welcome to the AI Toolkit documentation! This guide will help you get up and running with the AI Toolkit in just a few minutes.</p>
      
      <h2>What is AI Toolkit?</h2>
      <p>The AI Toolkit is a comprehensive solution for document processing, analysis, and AI-powered insights. It provides:</p>
      <ul>
        <li><strong>Document Processing</strong>: Extract text, images, and metadata from various document formats</li>
        <li><strong>AI Analysis</strong>: Leverage local AI models for content analysis and insights</li>
        <li><strong>Web Dashboard</strong>: User-friendly interface for managing documents and viewing results</li>
        <li><strong>API Access</strong>: RESTful API for programmatic access to all features</li>
      </ul>
      
      <div className="callout callout--info">
        <div className="callout__title">Prerequisites</div>
        <div className="callout__content">
          Before you begin, make sure you have Node.js 18+ and npm installed on your system.
        </div>
      </div>
      
      <h2>Quick Installation</h2>
      <p>The fastest way to get started is using our installation script:</p>
      <pre><code>npm install -g @ai-toolkit/cli
ai-toolkit init my-project
cd my-project
npm start</code></pre>
      
      <h2>Next Steps</h2>
      <p>Now that you have an overview, here are some recommended next steps:</p>
      <ul>
        <li><a href="/getting-started/installation">Installation Guide</a></li>
        <li><a href="/getting-started/quick-start">Quick Start Tutorial</a></li>
        <li><a href="/api-reference">Explore the API</a></li>
        <li><a href="/getting-started/troubleshooting">Troubleshooting Guide</a></li>
      </ul>
    </div>
  );
}