export default function InstallationPage() {
  return (
    <div className="docs-content">
      <h1>Installation</h1>
      <p>Learn how to install the AI Toolkit on your system.</p>
      
      <h2>Prerequisites</h2>
      <ul>
        <li>Node.js 18 or higher</li>
        <li>npm or yarn package manager</li>
        <li>Git (for cloning the repository)</li>
      </ul>
      
      <h2>Quick Installation</h2>
      <p>The fastest way to get started:</p>
      <pre><code>npm install -g @ai-toolkit/cli
ai-toolkit init my-project
cd my-project
npm start</code></pre>
      
      <h2>Manual Installation</h2>
      <h3>1. Clone the Repository</h3>
      <pre><code>git clone https://github.com/your-org/ai-toolkit.git
cd ai-toolkit</code></pre>
      
      <h3>2. Install Dependencies</h3>
      <pre><code>npm install</code></pre>
      
      <h3>3. Configure Environment</h3>
      <p>Copy the example environment file and configure your settings:</p>
      <pre><code>cp .env.example .env</code></pre>
      
      <h3>4. Start the Application</h3>
      <pre><code>npm run dev</code></pre>
      
      <h2>Verify Installation</h2>
      <p>Once the application is running, you can verify the installation by:</p>
      <ol>
        <li><strong>Web Dashboard</strong>: Open http://localhost:3000 in your browser</li>
        <li><strong>API Health Check</strong>: Visit http://localhost:3000/api/health</li>
        <li><strong>Upload a Test Document</strong>: Try uploading a sample PDF or text file</li>
      </ol>
      
      <div className="callout callout--success">
        <div className="callout__title">Success!</div>
        <div className="callout__content">
          If you can see the dashboard and upload a document, your installation is complete!
        </div>
      </div>
    </div>
  );
}