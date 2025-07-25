#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

const TEST_TYPES = {
  unit: 'test/unit/**/*.test.ts',
  integration: 'test/integration/**/*.test.ts',
  e2e: 'test/e2e/**/*.test.ts',
  performance: 'test/performance/**/*.test.ts',
  'ai-quality': 'test/ai-quality/**/*.test.ts',
  all: 'test/**/*.test.ts',
};

const COVERAGE_THRESHOLD = {
  statements: 80,
  branches: 80,
  functions: 80,
  lines: 80,
};

class TestRunner {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
    };
  }

  async run() {
    const args = process.argv.slice(2);
    const testType = args[0] || 'all';
    const options = this.parseOptions(args.slice(1));

    console.log('🧪 AI Toolkit Test Runner');
    console.log('========================');
    console.log(`Test Type: ${testType}`);
    console.log(`Options: ${JSON.stringify(options, null, 2)}`);
    console.log('');

    if (!TEST_TYPES[testType]) {
      console.error(`❌ Unknown test type: ${testType}`);
      console.error(`Available types: ${Object.keys(TEST_TYPES).join(', ')}`);
      process.exit(1);
    }

    try {
      await this.ensureTestEnvironment();
      await this.runTests(testType, options);
      await this.generateReports(options);
      
      this.printSummary();
      
      if (this.results.failed > 0) {
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Test execution failed:', error.message);
      process.exit(1);
    }
  }

  parseOptions(args) {
    const options = {
      coverage: false,
      watch: false,
      verbose: false,
      bail: false,
      parallel: true,
      reporter: 'default',
    };

    args.forEach(arg => {
      switch (arg) {
        case '--coverage':
          options.coverage = true;
          break;
        case '--watch':
          options.watch = true;
          break;
        case '--verbose':
          options.verbose = true;
          break;
        case '--bail':
          options.bail = true;
          break;
        case '--no-parallel':
          options.parallel = false;
          break;
        case '--reporter=json':
          options.reporter = 'json';
          break;
        case '--reporter=junit':
          options.reporter = 'junit';
          break;
      }
    });

    return options;
  }

  async ensureTestEnvironment() {
    console.log('🔧 Setting up test environment...');
    
    // Ensure test directories exist
    const testDirs = [
      'test/fixtures',
      'test/fixtures/documents',
      'test/fixtures/codebases',
      'test/fixtures/workflows',
      'test/fixtures/expected-outputs',
      'test/fixtures/performance',
      'test/temp',
      'coverage',
      'test-results',
    ];

    for (const dir of testDirs) {
      try {
        await fs.access(dir);
      } catch {
        await fs.mkdir(dir, { recursive: true });
      }
    }

    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.TEST_MODE = 'true';
    
    console.log('✅ Test environment ready');
  }

  async runTests(testType, options) {
    console.log(`🚀 Running ${testType} tests...`);
    
    const vitestArgs = [
      'run',
      '--config', 'vitest.config.ts',
    ];

    // Add test pattern
    if (testType !== 'all') {
      vitestArgs.push(TEST_TYPES[testType]);
    }

    // Add options
    if (options.coverage) {
      vitestArgs.push('--coverage');
    }

    if (options.watch) {
      vitestArgs.splice(0, 1); // Remove 'run' for watch mode
    }

    if (options.verbose) {
      vitestArgs.push('--reporter=verbose');
    }

    if (options.bail) {
      vitestArgs.push('--bail');
    }

    if (!options.parallel) {
      vitestArgs.push('--no-threads');
    }

    if (options.reporter === 'json') {
      vitestArgs.push('--reporter=json', '--outputFile=test-results/results.json');
    }

    if (options.reporter === 'junit') {
      vitestArgs.push('--reporter=junit', '--outputFile=test-results/junit.xml');
    }

    return new Promise((resolve, reject) => {
      const child = spawn('npx', ['vitest', ...vitestArgs], {
        stdio: 'inherit',
        shell: true,
      });

      child.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Tests completed successfully');
          resolve();
        } else {
          console.log(`❌ Tests failed with exit code ${code}`);
          this.results.failed = 1; // Set failed flag
          resolve(); // Don't reject to allow report generation
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  async generateReports(options) {
    console.log('📊 Generating test reports...');

    try {
      // Generate coverage report if requested
      if (options.coverage) {
        await this.generateCoverageReport();
      }

      // Generate performance report
      await this.generatePerformanceReport();

      // Generate AI quality report
      await this.generateAIQualityReport();

      console.log('✅ Reports generated successfully');
    } catch (error) {
      console.warn('⚠️  Report generation failed:', error.message);
    }
  }

  async generateCoverageReport() {
    try {
      const coverageFile = 'coverage/coverage-summary.json';
      const coverage = JSON.parse(await fs.readFile(coverageFile, 'utf8'));
      
      console.log('📈 Coverage Summary:');
      console.log(`  Statements: ${coverage.total.statements.pct}%`);
      console.log(`  Branches: ${coverage.total.branches.pct}%`);
      console.log(`  Functions: ${coverage.total.functions.pct}%`);
      console.log(`  Lines: ${coverage.total.lines.pct}%`);

      // Check coverage thresholds
      const failed = [];
      if (coverage.total.statements.pct < COVERAGE_THRESHOLD.statements) {
        failed.push(`Statements: ${coverage.total.statements.pct}% < ${COVERAGE_THRESHOLD.statements}%`);
      }
      if (coverage.total.branches.pct < COVERAGE_THRESHOLD.branches) {
        failed.push(`Branches: ${coverage.total.branches.pct}% < ${COVERAGE_THRESHOLD.branches}%`);
      }
      if (coverage.total.functions.pct < COVERAGE_THRESHOLD.functions) {
        failed.push(`Functions: ${coverage.total.functions.pct}% < ${COVERAGE_THRESHOLD.functions}%`);
      }
      if (coverage.total.lines.pct < COVERAGE_THRESHOLD.lines) {
        failed.push(`Lines: ${coverage.total.lines.pct}% < ${COVERAGE_THRESHOLD.lines}%`);
      }

      if (failed.length > 0) {
        console.log('❌ Coverage thresholds not met:');
        failed.forEach(failure => console.log(`  - ${failure}`));
        this.results.failed++;
      }
    } catch (error) {
      console.warn('⚠️  Could not read coverage report:', error.message);
    }
  }

  async generatePerformanceReport() {
    // This would integrate with the PerformanceTestRunner results
    console.log('📊 Performance report generation would be implemented here');
  }

  async generateAIQualityReport() {
    // This would integrate with the AIQualityTester results
    console.log('🤖 AI quality report generation would be implemented here');
  }

  printSummary() {
    console.log('');
    console.log('📋 Test Summary');
    console.log('===============');
    
    if (this.results.failed === 0) {
      console.log('✅ All tests passed!');
    } else {
      console.log('❌ Some tests failed');
    }
    
    console.log('');
    console.log('📁 Generated Reports:');
    console.log('  - Coverage: coverage/index.html');
    console.log('  - Test Results: test-results/');
    console.log('');
  }
}

// Run the test runner
const runner = new TestRunner();
runner.run().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});