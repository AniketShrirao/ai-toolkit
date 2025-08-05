#!/usr/bin/env node

/**
 * Test runner for Chat Interface Enhancement comprehensive test suite
 * 
 * This script runs all tests for the chat interface enhancement feature,
 * including unit tests, integration tests, and end-to-end tests.
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

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

// Test configuration
const testConfig = {
  unit: {
    name: 'Unit Tests',
    pattern: 'test/unit/chat-interface-enhancement/**/*.test.{ts,tsx}',
    timeout: 30000,
  },
  integration: {
    name: 'Integration Tests',
    pattern: 'test/integration/chat-interface-enhancement/**/*.test.{ts,tsx}',
    timeout: 60000,
  },
  e2e: {
    name: 'End-to-End Tests',
    pattern: 'test/e2e/chat-interface-enhancement/**/*.test.{ts,tsx}',
    timeout: 120000,
  },
};

// Utility functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logHeader(message) {
  const border = '='.repeat(message.length + 4);
  log(border, colors.cyan);
  log(`  ${message}  `, colors.cyan);
  log(border, colors.cyan);
}

function logSection(message) {
  log(`\n${colors.bright}${message}${colors.reset}`);
  log('-'.repeat(message.length), colors.blue);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

// Check if test files exist
function checkTestFiles() {
  logSection('Checking Test Files');
  
  const testFiles = [
    'test/unit/chat-interface-enhancement/Chat.test.tsx',
    'test/unit/chat-interface-enhancement/StickyChat.test.tsx',
    'test/unit/chat-interface-enhancement/useAIChat.test.ts',
    'test/integration/chat-interface-enhancement/ChatAPI.integration.test.tsx',
    'test/integration/chat-interface-enhancement/CrossInterfaceSync.integration.test.tsx',
    'test/integration/chat-interface-enhancement/ErrorScenarios.integration.test.tsx',
    'test/e2e/chat-interface-enhancement/ChatWorkflow.e2e.test.ts',
  ];

  let allFilesExist = true;

  testFiles.forEach(file => {
    if (fs.existsSync(file)) {
      logSuccess(`Found: ${file}`);
    } else {
      logError(`Missing: ${file}`);
      allFilesExist = false;
    }
  });

  if (!allFilesExist) {
    logError('Some test files are missing. Please ensure all test files are created.');
    process.exit(1);
  }

  logSuccess('All test files found');
}

// Run a specific test suite
function runTestSuite(suiteKey, options = {}) {
  const suite = testConfig[suiteKey];
  logSection(`Running ${suite.name}`);

  const vitestArgs = [
    'vitest',
    'run',
    '--reporter=verbose',
    `--testTimeout=${suite.timeout}`,
    suite.pattern,
  ];

  if (options.coverage) {
    vitestArgs.push('--coverage');
  }

  if (options.watch) {
    vitestArgs.splice(1, 1, 'watch'); // Replace 'run' with 'watch'
  }

  try {
    const startTime = Date.now();
    execSync(vitestArgs.join(' '), {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    const duration = Date.now() - startTime;
    logSuccess(`${suite.name} completed in ${duration}ms`);
    return true;
  } catch (error) {
    logError(`${suite.name} failed`);
    if (options.continueOnError) {
      return false;
    } else {
      process.exit(1);
    }
  }
}

// Generate test report
function generateTestReport(results) {
  logSection('Test Report Summary');
  
  const totalSuites = Object.keys(testConfig).length;
  const passedSuites = results.filter(r => r.passed).length;
  const failedSuites = results.filter(r => !r.passed).length;

  log(`Total Test Suites: ${totalSuites}`);
  log(`Passed: ${passedSuites}`, colors.green);
  log(`Failed: ${failedSuites}`, failedSuites > 0 ? colors.red : colors.green);

  results.forEach(result => {
    if (result.passed) {
      logSuccess(`${result.name}: PASSED`);
    } else {
      logError(`${result.name}: FAILED`);
    }
  });

  if (failedSuites > 0) {
    logError(`\n${failedSuites} test suite(s) failed. Please check the output above for details.`);
    return false;
  } else {
    logSuccess('\nAll test suites passed! 🎉');
    return true;
  }
}

// Main execution function
function main() {
  const args = process.argv.slice(2);
  const options = {
    coverage: args.includes('--coverage'),
    watch: args.includes('--watch'),
    continueOnError: args.includes('--continue-on-error'),
    suite: args.find(arg => arg.startsWith('--suite='))?.split('=')[1],
  };

  logHeader('Chat Interface Enhancement Test Suite');
  
  logInfo('Test Configuration:');
  log(`  Coverage: ${options.coverage ? 'enabled' : 'disabled'}`);
  log(`  Watch Mode: ${options.watch ? 'enabled' : 'disabled'}`);
  log(`  Continue on Error: ${options.continueOnError ? 'enabled' : 'disabled'}`);
  if (options.suite) {
    log(`  Specific Suite: ${options.suite}`);
  }

  // Check prerequisites
  checkTestFiles();

  // Run tests
  const results = [];

  if (options.suite) {
    // Run specific test suite
    if (!testConfig[options.suite]) {
      logError(`Unknown test suite: ${options.suite}`);
      logInfo(`Available suites: ${Object.keys(testConfig).join(', ')}`);
      process.exit(1);
    }

    const passed = runTestSuite(options.suite, options);
    results.push({
      name: testConfig[options.suite].name,
      passed,
    });
  } else {
    // Run all test suites
    for (const [suiteKey, suite] of Object.entries(testConfig)) {
      const passed = runTestSuite(suiteKey, options);
      results.push({
        name: suite.name,
        passed,
      });

      if (!passed && !options.continueOnError) {
        break;
      }
    }
  }

  // Generate report
  const allPassed = generateTestReport(results);

  // Exit with appropriate code
  process.exit(allPassed ? 0 : 1);
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
  logHeader('Chat Interface Enhancement Test Runner');
  log('\nUsage: node run-tests.js [options]');
  log('\nOptions:');
  log('  --coverage              Enable code coverage reporting');
  log('  --watch                 Run tests in watch mode');
  log('  --continue-on-error     Continue running tests even if some fail');
  log('  --suite=<name>          Run only a specific test suite (unit|integration|e2e)');
  log('  --help, -h              Show this help message');
  log('\nExamples:');
  log('  node run-tests.js                    # Run all tests');
  log('  node run-tests.js --coverage         # Run all tests with coverage');
  log('  node run-tests.js --suite=unit       # Run only unit tests');
  log('  node run-tests.js --watch            # Run tests in watch mode');
  log('  node run-tests.js --continue-on-error # Run all tests, don\'t stop on failures');
  process.exit(0);
}

// Run the main function
main();