#!/usr/bin/env node

const { join } = require('path');
const { createContentValidator, formatValidationResults } = require('../src/lib/validation');
const { getAllPages } = require('../src/lib/content');

/**
 * Main validation script
 */
async function main() {
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
    console.log('📄 Loading documentation pages...');
    const pages = getAllPages(contentDir);
    console.log(`Found ${pages.length} pages to validate\n`);

    // Validate all pages
    console.log('🔍 Validating content...');
    const results = await validator.validatePages(pages);

    // Display results
    console.log('\n📊 VALIDATION RESULTS');
    console.log('='.repeat(50));
    console.log(formatValidationResults(results));

    // Exit with appropriate code
    if (!results.valid) {
      console.log('\n💥 Content validation failed!');
      process.exit(1);
    } else {
      console.log('\n✨ Content validation passed!');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Validation script failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Handle CLI arguments
const args = process.argv.slice(2);
const options = {
  verbose: args.includes('--verbose') || args.includes('-v'),
  fix: args.includes('--fix'),
  watch: args.includes('--watch'),
};

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Content Validation Script

Usage: node scripts/validate-content.js [options]

Options:
  --verbose, -v    Show detailed output
  --fix            Attempt to fix issues automatically (not implemented)
  --watch          Watch for changes and re-validate (not implemented)
  --help, -h       Show this help message

Examples:
  node scripts/validate-content.js
  node scripts/validate-content.js --verbose
  npm run validate:content
`);
  process.exit(0);
}

// Run the main function
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { main };