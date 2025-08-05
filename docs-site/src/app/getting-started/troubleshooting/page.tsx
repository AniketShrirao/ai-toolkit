/* eslint-disable react/no-unescaped-entities */
export default function TroubleshootingPage() {
  return (
    <div className="docs-content">
      <h1>Troubleshooting</h1>
      <p>Common issues and solutions for the AI Toolkit.</p>
      
      <h2>Installation Problems</h2>
      
      <h3>Node.js Version Issues</h3>
      <p>If you encounter issues during installation:</p>
      <ul>
        <li>Check your Node.js version: <code>node --version</code></li>
        <li>Ensure you have Node.js 18 or higher</li>
        <li>Clear npm cache: <code>npm cache clean --force</code></li>
        <li>Try using yarn instead of npm</li>
      </ul>
      
      <h3>Permission Errors</h3>
      <p>For permission-related errors:</p>
      <pre><code># Fix npm permissions (Linux/macOS)
sudo chown -R $(whoami) $(npm config get prefix)/lib/node_modules

# Or use a Node version manager
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18</code></pre>
      
      <h2>Runtime Errors</h2>
      
      <h3>Port Conflicts</h3>
      <p>If you get "port already in use" errors:</p>
      <pre><code># Check what's using the port
lsof -i :3000  # Linux/macOS
netstat -ano | findstr :3000  # Windows

# Kill the process or use a different port
export PORT=3001
npm run dev</code></pre>
      
      <h3>Database Connection Issues</h3>
      <p>For database-related problems:</p>
      <ul>
        <li>Ensure PostgreSQL is running</li>
        <li>Check your DATABASE_URL in .env</li>
        <li>Verify database permissions</li>
        <li>Try recreating the database</li>
      </ul>
      
      <h3>AI Service Issues</h3>
      <p>If AI features aren't working:</p>
      <pre><code># Check if Ollama is running
curl http://localhost:11434/api/tags

# Install Ollama if needed
curl -fsSL https://ollama.ai/install.sh | sh

# Download a model
ollama pull llama2</code></pre>
      
      <h2>Performance Issues</h2>
      
      <h3>Slow Processing</h3>
      <p>If document processing is slow:</p>
      <ul>
        <li>Increase Node.js memory: <code>export NODE_OPTIONS="--max-old-space-size=4096"</code></li>
        <li>Reduce concurrent jobs in .env: <code>MAX_CONCURRENT_JOBS=2</code></li>
        <li>Check available disk space</li>
        <li>Monitor system resources</li>
      </ul>
      
      <h2>Getting Help</h2>
      
      <div className="callout callout--info">
        <div className="callout__title">Still Need Help?</div>
        <div className="callout__content">
          <p>If you're still experiencing issues:</p>
          <ul>
            <li>Check our <a href="https://github.com/your-org/ai-toolkit/issues">GitHub Issues</a></li>
            <li>Join our <a href="https://github.com/your-org/ai-toolkit/discussions">Community Discussion</a></li>
            <li>Review the <a href="/api-reference">API Documentation</a></li>
            <li>Run the diagnostic tool: <code>npm run system:check</code></li>
          </ul>
        </div>
      </div>
      
      <h2>Diagnostic Commands</h2>
      <p>Use these commands to diagnose issues:</p>
      <pre><code># System health check
npm run system:check

# Check API status
curl http://localhost:3000/api/health

# View application logs
npm run logs

# Test database connection
npm run db:test</code></pre>
    </div>
  );
}