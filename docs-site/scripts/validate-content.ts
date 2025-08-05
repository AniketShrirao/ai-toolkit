#!/usr/bin/env tsx

import { join } from 'path';
import { createContentValidator, formatValidationResults } from '../src/lib/validation';
import { getDocumentationPages } from '../src/lib/content';

interface ValidationOptions {
  verbose: boolean;
  fix: boolean;
  watch: boolean;
  exitOnError: boolean;
}

/**
 * Main validation function
 */
async function validateContent(options: ValidationOptions = {
  verbose: false,
  fix: false,
  watch: false,
  exitOnError: true
}) {
  console.log('🔍 Starting content validation...\n');

  const contentDir = join(process.cwd(), 'content');
  const publicDir = join(process.cwd(), 'public');

  // Create validator with options
  const validator = createContentValidator(contentDir, publicDir, {
    checkLinks: true,
    checkImages: true,
    checkSpelling: false, // Disabled for now
    checkGrammar: false, // Disabled for now
    maxLineLength: 120,
    requiredFrontmatter: ['title', 'description', 'category'],
    allowedImageFormats: ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'],
    maxImageSize: 5 * 1024 * 1024, // 5MB
  });

  try {
    // Get all pages
    if (options.verbose) {
      console.log('📄 Loading documentation pages...');
    }
    
    const pages = getDocumentationPages();
    console.log(`Found ${pages.length} pages to validate\n`);

    if (pages.length === 0) {
      console.log('⚠️  No pages found to validate');
      return { valid: true, errors: [], warnings: [], info: [] };
    }

    // Validate all pages
    console.log('🔍 Validating content...');
    const results = await validator.validatePages(pages);

    // Display results
    console.log('\n📊 VALIDATION RESULTS');
    console.log('='.repeat(50));
    
    if (options.verbose || !results.valid) {
      console.log(formatValidationResults(results));
    } else {
      console.log(`✅ ${pages.length} pages validated successfully`);
      if (results.warnings.length > 0) {
        console.log(`⚠️  ${results.warnings.length} warnings found`);
      }
    }

    // Summary
    console.log('\n📈 SUMMARY');
    console.log('-'.repeat(30));
    console.log(`Pages validated: ${pages.length}`);
    console.log(`Errors: ${results.errors.length}`);
    console.log(`Warnings: ${results.warnings.length}`);
    console.log(`Info: ${results.info.length}`);

    return results;
  } catch (error) {
    console.error('❌ Validation failed:', error instanceof Error ? error.message : error);
    if (options.verbose && error instanceof Error) {
      console.error(error.stack);
    }
    
    if (options.exitOnError) {
      process.exit(1);
    }
    
    throw error;
  }
}

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  
  const options: ValidationOptions = {
    verbose: args.includes('--verbose') || args.includes('-v'),
    fix: args.includes('--fix'),
    watch: args.includes('--watch'),
    exitOnError: true,
  };

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Content Validation Script

Usage: tsx scripts/validate-content.ts [options]

Options:
  --verbose, -v    Show detailed output
  --fix            Attempt to fix issues automatically (not implemented)
  --watch          Watch for changes and re-validate (not implemented)
  --help, -h       Show this help message

Examples:
  tsx scripts/validate-content.ts
  tsx scripts/validate-content.ts --verbose
  npm run validate:content
`);
    process.exit(0);
  }

  try {
    const results = await validateContent(options);
    
    if (!results.valid) {
      console.log('\n💥 Content validation failed!');
      process.exit(1);
    } else {
      console.log('\n✨ Content validation passed!');
      process.exit(0);
    }
  } catch (error) {
    console.error('Unhandled error:', error);
    process.exit(1);
  }
}

// Export for programmatic use
export { validateContent };
export type { ValidationOptions };

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}