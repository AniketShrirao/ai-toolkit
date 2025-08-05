export default function GuidesPage() {
  return (
    <div className="docs-content">
      <h1>Guides</h1>
      <p>Step-by-step guides for using the AI Toolkit.</p>
      
      <h2>Available Guides</h2>
      <div className="guide-categories">
        <div className="guide-category">
          <h3>AI Integration</h3>
          <p>Learn how to integrate AI capabilities into your applications.</p>
        </div>
        
        <div className="guide-category">
          <h3>Document Processing</h3>
          <p>Process and analyze documents with AI-powered tools.</p>
        </div>
        
        <div className="guide-category">
          <h3>Web Dashboard</h3>
          <p>Use the web dashboard for managing your AI workflows.</p>
        </div>
        
        <div className="guide-category">
          <h3>Deployment</h3>
          <p>Deploy your AI applications to production environments.</p>
        </div>
      </div>
    </div>
  );
}