#!/usr/bin/env node

/**
 * Backend API Integration Test for Chat Interface Enhancement
 * 
 * This script tests the actual backend API endpoints to ensure they work correctly
 * with the chat interface enhancement feature.
 */

import { execSync } from 'child_process';
import fetch from 'node-fetch';

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logHeader(message) {
  const border = '='.repeat(message.length + 4);
  log(border, colors.cyan);
  log(`  ${message}  `, colors.cyan);
  log(border, colors.cyan);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

// Test configuration
const API_BASE_URL = 'http://localhost:3000';
const TEST_TIMEOUT = 30000;

// Test data
const testConfig = {
  provider: 'ollama',
  baseUrl: 'http://localhost:11434',
  model: 'llama2',
};

const testMessage = 'Hello, this is a test message for the chat interface.';

// API test functions
async function testAIChatSend() {
  logInfo('Testing /api/ai-chat/send endpoint...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai-chat/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: testMessage,
        provider: testConfig.provider,
        model: testConfig.model,
        config: {
          baseUrl: testConfig.baseUrl,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.response && typeof data.response === 'string') {
      logSuccess('AI chat send endpoint working correctly');
      return true;
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    logError(`AI chat send test failed: ${error.message}`);
    return false;
  }
}

async function testAIChatStream() {
  logInfo('Testing /api/ai-chat/stream endpoint...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai-chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: testMessage,
        provider: testConfig.provider,
        model: testConfig.model,
        config: {
          baseUrl: testConfig.baseUrl,
        },
        options: {
          stream: true,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Check if response is streaming
    if (response.headers.get('content-type')?.includes('text/plain')) {
      logSuccess('AI chat stream endpoint working correctly');
      return true;
    } else {
      throw new Error('Response is not streaming');
    }
  } catch (error) {
    logError(`AI chat stream test failed: ${error.message}`);
    return false;
  }
}

async function testAIChatTest() {
  logInfo('Testing /api/ai-chat/test endpoint...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai-chat/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider: testConfig.provider,
        config: {
          baseUrl: testConfig.baseUrl,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.success && Array.isArray(data.models)) {
      logSuccess('AI chat test endpoint working correctly');
      return true;
    } else {
      throw new Error('Invalid test response format');
    }
  } catch (error) {
    logError(`AI chat test failed: ${error.message}`);
    return false;
  }
}

async function testAIChatModels() {
  logInfo('Testing /api/ai-chat/models endpoint...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai-chat/models?provider=${testConfig.provider}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (Array.isArray(data.models)) {
      logSuccess('AI chat models endpoint working correctly');
      return true;
    } else {
      throw new Error('Invalid models response format');
    }
  } catch (error) {
    logError(`AI chat models test failed: ${error.message}`);
    return false;
  }
}

// Server management functions
function startServer() {
  logInfo('Starting development server...');
  
  try {
    // Start the server in the background
    execSync('npm run dev &', { 
      stdio: 'pipe',
      timeout: 5000,
    });
    
    // Wait for server to start
    return new Promise((resolve) => {
      setTimeout(() => {
        logSuccess('Development server started');
        resolve(true);
      }, 3000);
    });
  } catch (error) {
    logError(`Failed to start server: ${error.message}`);
    return false;
  }
}

function stopServer() {
  logInfo('Stopping development server...');
  
  try {
    // Kill any node processes running on port 3000
    execSync('pkill -f "node.*3000" || true', { stdio: 'pipe' });
    logSuccess('Development server stopped');
    return true;
  } catch (error) {
    logError(`Failed to stop server: ${error.message}`);
    return false;
  }
}

async function checkServerHealth() {
  logInfo('Checking server health...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      timeout: 5000,
    });

    if (response.ok) {
      logSuccess('Server is healthy');
      return true;
    } else {
      throw new Error(`Server health check failed: ${response.status}`);
    }
  } catch (error) {
    logError(`Server health check failed: ${error.message}`);
    return false;
  }
}

// Main test execution
async function runBackendIntegrationTests() {
  logHeader('Chat Interface Enhancement - Backend API Integration Tests');
  
  const results = [];
  let serverStarted = false;

  try {
    // Check if server is already running
    const serverRunning = await checkServerHealth();
    
    if (!serverRunning) {
      // Start server if not running
      serverStarted = await startServer();
      if (!serverStarted) {
        logError('Failed to start server. Aborting tests.');
        process.exit(1);
      }
      
      // Wait a bit more for server to be fully ready
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check health again
      const healthCheck = await checkServerHealth();
      if (!healthCheck) {
        logError('Server failed health check. Aborting tests.');
        process.exit(1);
      }
    }

    // Run API tests
    logInfo('Running backend API integration tests...');
    
    results.push({
      name: 'AI Chat Send API',
      passed: await testAIChatSend(),
    });
    
    results.push({
      name: 'AI Chat Stream API',
      passed: await testAIChatStream(),
    });
    
    results.push({
      name: 'AI Chat Test API',
      passed: await testAIChatTest(),
    });
    
    results.push({
      name: 'AI Chat Models API',
      passed: await testAIChatModels(),
    });

  } catch (error) {
    logError(`Test execution failed: ${error.message}`);
    results.push({
      name: 'Test Execution',
      passed: false,
    });
  } finally {
    // Clean up server if we started it
    if (serverStarted) {
      stopServer();
    }
  }

  // Generate report
  logHeader('Backend Integration Test Results');
  
  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;

  log(`Total Tests: ${totalTests}`);
  log(`Passed: ${passedTests}`, colors.green);
  log(`Failed: ${failedTests}`, failedTests > 0 ? colors.red : colors.green);

  results.forEach(result => {
    if (result.passed) {
      logSuccess(`${result.name}: PASSED`);
    } else {
      logError(`${result.name}: FAILED`);
    }
  });

  if (failedTests > 0) {
    logError(`\n${failedTests} backend API test(s) failed.`);
    process.exit(1);
  } else {
    logSuccess('\nAll backend API tests passed! 🎉');
    process.exit(0);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logError(`Uncaught Exception: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// Show help if requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  logHeader('Backend API Integration Test Runner');
  log('\nUsage: node backend-integration-test.js [options]');
  log('\nOptions:');
  log('  --help, -h              Show this help message');
  log('\nDescription:');
  log('  Tests the backend API endpoints used by the chat interface enhancement.');
  log('  Automatically starts and stops the development server if needed.');
  log('\nEndpoints tested:');
  log('  - POST /api/ai-chat/send     - Send chat message');
  log('  - POST /api/ai-chat/stream   - Stream chat response');
  log('  - POST /api/ai-chat/test     - Test AI service connection');
  log('  - GET  /api/ai-chat/models   - Get available models');
  process.exit(0);
}

// Run the tests
runBackendIntegrationTests();