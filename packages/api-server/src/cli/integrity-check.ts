#!/usr/bin/env node

import { Command } from 'commander';
import { IntegrityChecker, DocumentProcessingVerifier } from '@ai-toolkit/shared';
import fs from 'fs/promises';
import path from 'path';

const program = new Command();

interface CLIOptions {
  type: 'code' | 'documents' | 'all';
  rootPath?: string;
  documentsPath?: string;
  output?: string;
  format: 'json' | 'text';
  exitOnIssues: boolean;
  verbose: boolean;
}

program
  .name('integrity-check')
  .description('Run system integrity checks for code quality and document processing')
  .version('1.0.0');

program
  .option('-t, --type <type>', 'Type of check to run', 'all')
  .option('-r, --root-path <path>', 'Root path for code analysis', process.cwd())
  .option('-d, --documents-path <path>', 'Path to processed documents', './data/processed')
  .option('-o, --output <file>', 'Output file for results (optional)')
  .option('-f, --format <format>', 'Output format', 'text')
  .option('--exit-on-issues', 'Exit with non-zero code if issues found', false)
  .option('-v, --verbose', 'Verbose output', false);

program.action(async (options: CLIOptions) => {
  try {
    console.log('🔧 Running System Integrity Check...\n');
    
    const results: any = {
      timestamp: new Date(),
      type: options.type
    };

    // Run code integrity check
    if (options.type === 'code' || options.type === 'all') {
      if (options.verbose) {
        console.log('📝 Running code quality check...');
      }
      
      const checker = new IntegrityChecker({
        rootPath: options.rootPath || process.cwd(),
        includePatterns: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
        excludePatterns: [
          '**/node_modules/**',
          '**/dist/**',
          '**/build/**',
          '**/*.test.*',
          '**/*.spec.*',
          '**/coverage/**',
          '**/.git/**',
          '**/uploads/**'
        ]
      });
      
      results.codeReport = await checker.checkIntegrity();
      
      if (options.verbose) {
        console.log(`✅ Code check completed: ${results.codeReport.totalIssues} issues found`);
      }
    }

    // Run document processing verification
    if (options.type === 'documents' || options.type === 'all') {
      if (options.verbose) {
        console.log('📄 Running document processing verification...');
      }
      
      const verifier = new DocumentProcessingVerifier({
        documentsPath: options.documentsPath || path.join(process.cwd(), 'data', 'processed')
      });
      
      results.documentReport = await verifier.verifyDocumentProcessing();
      
      if (options.verbose) {
        console.log(`✅ Document check completed: ${results.documentReport.totalIssues} issues found`);
      }
    }

    // Output results
    if (options.format === 'json') {
      const jsonOutput = JSON.stringify(results, null, 2);
      
      if (options.output) {
        await fs.writeFile(options.output, jsonOutput);
        console.log(`📄 Results saved to ${options.output}`);
      } else {
        console.log(jsonOutput);
      }
    } else {
      // Text format output
      displayTextResults(results);
    }

    // Save to file if specified
    if (options.output && options.format === 'text') {
      const textOutput = generateTextOutput(results);
      await fs.writeFile(options.output, textOutput);
      console.log(`📄 Results saved to ${options.output}`);
    }

    // Exit with appropriate code
    const hasIssues = (results.codeReport?.totalIssues || 0) + (results.documentReport?.totalIssues || 0) > 0;
    
    if (options.exitOnIssues && hasIssues) {
      console.log('\n❌ Exiting with error code due to integrity issues');
      process.exit(1);
    } else {
      console.log('\n✅ Integrity check completed successfully');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ Integrity check failed:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
});

function displayTextResults(results: any) {
  console.log('\n📊 INTEGRITY CHECK RESULTS');
  console.log('=' .repeat(50));
  console.log(`Timestamp: ${results.timestamp}`);
  console.log(`Check Type: ${results.type}`);
  
  // Code Quality Report
  if (results.codeReport) {
    console.log('\n🔍 CODE QUALITY REPORT');
    console.log('-'.repeat(30));
    console.log(`Total Issues: ${results.codeReport.totalIssues}`);
    console.log(`Quality Score: ${results.codeReport.summary.codeQualityScore}/100`);
    console.log(`Readiness Level: ${results.codeReport.summary.readinessLevel.toUpperCase()}`);
    
    if (Object.keys(results.codeReport.issuesByType).length > 0) {
      console.log('\nIssues by Type:');
      Object.entries(results.codeReport.issuesByType).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });
    }
    
    if (Object.keys(results.codeReport.issuesBySeverity).length > 0) {
      console.log('\nIssues by Severity:');
      Object.entries(results.codeReport.issuesBySeverity).forEach(([severity, count]) => {
        console.log(`  ${severity.toUpperCase()}: ${count}`);
      });
    }
    
    if (results.codeReport.summary.recommendations.length > 0) {
      console.log('\nRecommendations:');
      results.codeReport.summary.recommendations.forEach((rec: string, index: number) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }
  }
  
  // Document Processing Report
  if (results.documentReport) {
    console.log('\n📄 DOCUMENT PROCESSING REPORT');
    console.log('-'.repeat(35));
    console.log(`Total Documents: ${results.documentReport.totalDocuments}`);
    console.log(`Processed: ${results.documentReport.processedDocuments}`);
    console.log(`Failed: ${results.documentReport.failedDocuments}`);
    console.log(`Success Rate: ${results.documentReport.summary.processingSuccessRate.toFixed(1)}%`);
    console.log(`Data Quality Score: ${results.documentReport.summary.dataQualityScore}/100`);
    console.log(`Processing Issues: ${results.documentReport.totalIssues}`);
    
    if (Object.keys(results.documentReport.issuesByType).length > 0) {
      console.log('\nProcessing Issues by Type:');
      Object.entries(results.documentReport.issuesByType).forEach(([type, count]) => {
        console.log(`  ${type.replace('_', ' ')}: ${count}`);
      });
    }
    
    if (results.documentReport.summary.recommendations.length > 0) {
      console.log('\nRecommendations:');
      results.documentReport.summary.recommendations.forEach((rec: string, index: number) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }
  }
}

function generateTextOutput(results: any): string {
  const lines: string[] = [];
  
  lines.push('INTEGRITY CHECK RESULTS');
  lines.push('='.repeat(50));
  lines.push(`Timestamp: ${results.timestamp}`);
  lines.push(`Check Type: ${results.type}`);
  
  if (results.codeReport) {
    lines.push('');
    lines.push('CODE QUALITY REPORT');
    lines.push('-'.repeat(30));
    lines.push(`Total Issues: ${results.codeReport.totalIssues}`);
    lines.push(`Quality Score: ${results.codeReport.summary.codeQualityScore}/100`);
    lines.push(`Readiness Level: ${results.codeReport.summary.readinessLevel.toUpperCase()}`);
    
    if (Object.keys(results.codeReport.issuesByType).length > 0) {
      lines.push('');
      lines.push('Issues by Type:');
      Object.entries(results.codeReport.issuesByType).forEach(([type, count]) => {
        lines.push(`  ${type}: ${count}`);
      });
    }
    
    if (results.codeReport.summary.recommendations.length > 0) {
      lines.push('');
      lines.push('Recommendations:');
      results.codeReport.summary.recommendations.forEach((rec: string, index: number) => {
        lines.push(`  ${index + 1}. ${rec}`);
      });
    }
  }
  
  if (results.documentReport) {
    lines.push('');
    lines.push('DOCUMENT PROCESSING REPORT');
    lines.push('-'.repeat(35));
    lines.push(`Total Documents: ${results.documentReport.totalDocuments}`);
    lines.push(`Success Rate: ${results.documentReport.summary.processingSuccessRate.toFixed(1)}%`);
    lines.push(`Processing Issues: ${results.documentReport.totalIssues}`);
    
    if (results.documentReport.summary.recommendations.length > 0) {
      lines.push('');
      lines.push('Recommendations:');
      results.documentReport.summary.recommendations.forEach((rec: string, index: number) => {
        lines.push(`  ${index + 1}. ${rec}`);
      });
    }
  }
  
  return lines.join('\n');
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Parse command line arguments
program.parse();