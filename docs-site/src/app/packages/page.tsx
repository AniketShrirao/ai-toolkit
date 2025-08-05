export default function PackagesPage() {
  return (
    <div className="docs-content">
      <h1>Packages</h1>
      <p>Documentation for individual AI Toolkit packages.</p>
      
      <h2>Core Packages</h2>
      <div className="package-list">
        <div className="package-item">
          <h3>@ai-toolkit/core</h3>
          <p>Core functionality and utilities for the AI Toolkit.</p>
        </div>
        
        <div className="package-item">
          <h3>@ai-toolkit/web-dashboard</h3>
          <p>Web-based dashboard for managing AI workflows.</p>
        </div>
        
        <div className="package-item">
          <h3>@ai-toolkit/document-processor</h3>
          <p>Document processing and analysis capabilities.</p>
        </div>
        
        <div className="package-item">
          <h3>@ai-toolkit/ui-styles</h3>
          <p>Shared UI components and styling system.</p>
        </div>
      </div>
      
      <h2>Installation</h2>
      <p>Install packages individually or as part of the complete toolkit.</p>
      
      <pre><code>npm install @ai-toolkit/core</code></pre>
    </div>
  );
}