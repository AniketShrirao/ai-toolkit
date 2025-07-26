#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';
import { createClient } from 'redis';

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

class SystemReadinessChecker {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      checks: [],
    };
    this.environment = process.env.NODE_ENV || 'development';
    this.config = this.loadConfiguration();
  }

  loadConfiguration() {
    try {
      const configPath = join(process.cwd(), 'config', `${this.environment}.json`);
      if (existsSync(configPath)) {
        return JSON.parse(readFileSync(configPath, 'utf-8'));
      }
      
      // Fallback to environment variables
      return {
        server: { port: process.env.PORT || 3000 },
        ollama: { 
          host: process.env.OLLAMA_HOST || 'localhost',
          port: process.env.OLLAMA_PORT || 11434,
        },
        database: { path: process.env.DATABASE_PATH || './data/ai-toolkit.db' },
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379,
          db: process.env.REDIS_DB || 0,
        },
        storage: {
          inputPath: process.env.STORAGE_INPUT_PATH || './data/input',
          outputPath: process.env.STORAGE_OUTPUT_PATH || './data/output',
          tempPath: process.env.STORAGE_TEMP_PATH || './temp',
        },
      };
    } catch (error) {
      this.log('error', 'Failed to load configuration', error.message);
      return {};
    }
  }

  log(level, message, details = '') {
    const timestamp = new Date().toISOString();
    const levelColors = {
      info: colors.blue,
      success: colors.green,
      warning: colors.yellow,
      error: colors.red,
    };
    
    const color = levelColors[level] || colors.reset;
    const icon = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
    }[level] || '•';

    console.log(`${color}${icon} ${message}${colors.reset}${details ? ` - ${details}` : ''}`);
  }

  async runCheck(name, checkFunction) {
    try {
      this.log('info', `Checking ${name}...`);
      const result = await checkFunction();
      
      if (result.status === 'pass') {
        this.results.passed++;
        this.log('success', `${name}: PASSED`, result.message);
      } else if (result.status === 'warning') {
        this.results.warnings++;
        this.log('warning', `${name}: WARNING`, result.message);
      } else {
        this.results.failed++;
        this.log('error', `${name}: FAILED`, result.message);
      }
      
      this.results.checks.push({
        name,
        status: result.status,
        message: result.message,
        details: result.details,
      });
    } catch (error) {
      this.results.failed++;
      this.log('error', `${name}: ERROR`, error.message);
      this.results.checks.push({
        name,
        status: 'fail',
        message: error.message,
        details: error.stack,
      });
    }
  }

  async checkEnvironmentConfiguration() {
    const requiredEnvVars = [
      'NODE_ENV',
      'PORT',
      'OLLAMA_HOST',
      'DATABASE_PATH',
      'REDIS_HOST',
    ];

    const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missing.length === 0) {
      return {
        status: 'pass',
        message: 'All required environment variables are set',
      };
    } else if (missing.length <= 2) {
      return {
        status: 'warning',
        message: `Some environment variables missing: ${missing.join(', ')}`,
        details: 'Using default values',
      };
    } else {
      return {
        status: 'fail',
        message: `Critical environment variables missing: ${missing.join(', ')}`,
        details: 'System may not function correctly',
      };
    }
  }

  async checkNodeVersion() {
    const currentVersion = process.version;
    const majorVersion = parseInt(currentVersion.slice(1).split('.')[0]);
    
    if (majorVersion >= 18) {
      return {
        status: 'pass',
        message: `Node.js version ${currentVersion} is supported`,
      };
    } else if (majorVersion >= 16) {
      return {
        status: 'warning',
        message: `Node.js version ${currentVersion} is deprecated`,
        details: 'Consider upgrading to Node.js 18+',
      };
    } else {
      return {
        status: 'fail',
        message: `Node.js version ${currentVersion} is not supported`,
        details: 'Minimum required version is Node.js 16',
      };
    }
  }

  async checkDependencies() {
    return new Promise((resolve) => {
      const npm = spawn('npm', ['list', '--depth=0'], { stdio: 'pipe' });
      let output = '';
      
      npm.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      npm.on('close', (code) => {
        if (code === 0) {
          resolve({
            status: 'pass',
            message: 'All dependencies are installed',
          });
        } else {
          const missingDeps = output.match(/UNMET DEPENDENCY/g);
          resolve({
            status: 'fail',
            message: `Missing dependencies detected`,
            details: missingDeps ? `${missingDeps.length} unmet dependencies` : 'Run npm install',
          });
        }
      });
    });
  }

  async checkOllamaConnection() {
    try {
      const response = await fetch(`http://${this.config.ollama?.host || 'localhost'}:${this.config.ollama?.port || 11434}/api/tags`);
      
      if (response.ok) {
        const data = await response.json();
        const modelCount = data.models?.length || 0;
        
        if (modelCount > 0) {
          return {
            status: 'pass',
            message: `Ollama connected with ${modelCount} models available`,
          };
        } else {
          return {
            status: 'warning',
            message: 'Ollama connected but no models available',
            details: 'Download models using: ollama pull <model-name>',
          };
        }
      } else {
        return {
          status: 'fail',
          message: `Ollama server returned ${response.status}`,
          details: 'Check if Ollama is running',
        };
      }
    } catch (error) {
      return {
        status: 'fail',
        message: 'Cannot connect to Ollama server',
        details: 'Install and start Ollama: https://ollama.ai',
      };
    }
  }

  async checkRedisConnection() {
    try {
      const client = createClient({
        socket: {
          host: this.config.redis?.host || 'localhost',
          port: this.config.redis?.port || 6379,
        },
        database: this.config.redis?.db || 0,
      });

      await client.connect();
      await client.ping();
      await client.disconnect();

      return {
        status: 'pass',
        message: 'Redis connection successful',
      };
    } catch (error) {
      return {
        status: 'fail',
        message: 'Cannot connect to Redis',
        details: 'Install and start Redis server',
      };
    }
  }

  async checkStoragePaths() {
    const paths = [
      this.config.storage?.inputPath || './data/input',
      this.config.storage?.outputPath || './data/output',
      this.config.storage?.tempPath || './temp',
    ];

    const issues = [];
    
    for (const path of paths) {
      if (!existsSync(path)) {
        issues.push(`${path} does not exist`);
      }
    }

    if (issues.length === 0) {
      return {
        status: 'pass',
        message: 'All storage paths exist',
      };
    } else if (issues.length <= 1) {
      return {
        status: 'warning',
        message: 'Some storage paths missing',
        details: issues.join(', '),
      };
    } else {
      return {
        status: 'fail',
        message: 'Multiple storage paths missing',
        details: issues.join(', '),
      };
    }
  }

  async checkDatabaseFile() {
    const dbPath = this.config.database?.path || './data/ai-toolkit.db';
    
    if (existsSync(dbPath)) {
      return {
        status: 'pass',
        message: 'Database file exists',
      };
    } else {
      return {
        status: 'warning',
        message: 'Database file does not exist',
        details: 'Will be created on first run',
      };
    }
  }

  async checkPortAvailability() {
    const port = this.config.server?.port || 3000;
    
    return new Promise((resolve) => {
      const net = require('net');
      const server = net.createServer();
      
      server.listen(port, () => {
        server.once('close', () => {
          resolve({
            status: 'pass',
            message: `Port ${port} is available`,
          });
        });
        server.close();
      });
      
      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          resolve({
            status: 'fail',
            message: `Port ${port} is already in use`,
            details: 'Choose a different port or stop the conflicting service',
          });
        } else {
          resolve({
            status: 'fail',
            message: `Cannot bind to port ${port}`,
            details: err.message,
          });
        }
      });
    });
  }

  async checkBuildStatus() {
    const distExists = existsSync(join(process.cwd(), 'packages/api-server/dist'));
    
    if (distExists) {
      return {
        status: 'pass',
        message: 'Application is built',
      };
    } else {
      return {
        status: 'warning',
        message: 'Application not built',
        details: 'Run: npm run build',
      };
    }
  }

  async checkHealthEndpoint() {
    try {
      const port = this.config.server?.port || 3000;
      const response = await fetch(`http://localhost:${port}/api/health`);
      
      if (response.ok) {
        const health = await response.json();
        return {
          status: 'pass',
          message: `Health endpoint responding (${health.status})`,
        };
      } else {
        return {
          status: 'fail',
          message: `Health endpoint returned ${response.status}`,
          details: 'Server may not be running',
        };
      }
    } catch (error) {
      return {
        status: 'fail',
        message: 'Health endpoint not accessible',
        details: 'Start the server first',
      };
    }
  }

  async runAllChecks() {
    console.log(`${colors.bright}${colors.cyan}🚀 AI Toolkit System Readiness Check${colors.reset}`);
    console.log(`${colors.blue}Environment: ${this.environment}${colors.reset}`);
    console.log(`${colors.blue}Timestamp: ${new Date().toISOString()}${colors.reset}\n`);

    // Core system checks
    await this.runCheck('Environment Configuration', () => this.checkEnvironmentConfiguration());
    await this.runCheck('Node.js Version', () => this.checkNodeVersion());
    await this.runCheck('Dependencies', () => this.checkDependencies());
    await this.runCheck('Build Status', () => this.checkBuildStatus());
    await this.runCheck('Port Availability', () => this.checkPortAvailability());

    // External service checks
    await this.runCheck('Ollama Connection', () => this.checkOllamaConnection());
    await this.runCheck('Redis Connection', () => this.checkRedisConnection());

    // Storage checks
    await this.runCheck('Storage Paths', () => this.checkStoragePaths());
    await this.runCheck('Database File', () => this.checkDatabaseFile());

    // Optional: Health endpoint check (only if server is running)
    if (process.argv.includes('--check-server')) {
      await this.runCheck('Health Endpoint', () => this.checkHealthEndpoint());
    }

    this.printSummary();
    return this.results.failed === 0;
  }

  printSummary() {
    console.log(`\n${colors.bright}${colors.cyan}📊 Summary${colors.reset}`);
    console.log(`${colors.green}✅ Passed: ${this.results.passed}${colors.reset}`);
    console.log(`${colors.yellow}⚠️  Warnings: ${this.results.warnings}${colors.reset}`);
    console.log(`${colors.red}❌ Failed: ${this.results.failed}${colors.reset}`);

    const total = this.results.passed + this.results.warnings + this.results.failed;
    const successRate = ((this.results.passed / total) * 100).toFixed(1);
    
    console.log(`\n${colors.bright}Success Rate: ${successRate}%${colors.reset}`);

    if (this.results.failed === 0) {
      console.log(`\n${colors.green}${colors.bright}🎉 System is ready for deployment!${colors.reset}`);
    } else {
      console.log(`\n${colors.red}${colors.bright}🚨 System is NOT ready for deployment${colors.reset}`);
      console.log(`${colors.red}Please fix the failed checks before proceeding.${colors.reset}`);
    }

    // Show recommendations
    if (this.results.warnings > 0 || this.results.failed > 0) {
      console.log(`\n${colors.bright}${colors.yellow}📋 Recommendations:${colors.reset}`);
      
      this.results.checks
        .filter(check => check.status === 'fail' || check.status === 'warning')
        .forEach(check => {
          console.log(`${colors.yellow}• ${check.name}: ${check.message}${colors.reset}`);
          if (check.details) {
            console.log(`  ${colors.cyan}  → ${check.details}${colors.reset}`);
          }
        });
    }
  }
}

// CLI execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
${colors.bright}AI Toolkit System Readiness Check${colors.reset}

Usage: npm run readiness-check [options]

Options:
  --help, -h          Show this help message
  --check-server      Also check if the server is running and responding
  --env=<environment> Set the environment (development, production, test)
  --json              Output results in JSON format

Examples:
  npm run readiness-check
  npm run readiness-check --check-server
  npm run readiness-check --env=production
  npm run readiness-check --json
    `);
    process.exit(0);
  }

  // Set environment from CLI flag
  const envFlag = args.find(arg => arg.startsWith('--env='));
  if (envFlag) {
    process.env.NODE_ENV = envFlag.split('=')[1];
  }

  const checker = new SystemReadinessChecker();
  const success = await checker.runAllChecks();

  if (args.includes('--json')) {
    console.log(JSON.stringify(checker.results, null, 2));
  }

  process.exit(success ? 0 : 1);
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}