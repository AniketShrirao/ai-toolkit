import { readFileSync, existsSync, statSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { DocumentationPage } from './mdx';

export interface ValidationError {
  type: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  file?: string;
  line?: number;
  column?: number;
  context?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  info: ValidationError[];
}

export interface LinkValidationResult {
  url: string;
  valid: boolean;
  status?: number;
  error?: string;
  type: 'internal' | 'external' | 'anchor';
}

export interface ImageValidationResult {
  src: string;
  valid: boolean;
  exists: boolean;
  size?: number;
  dimensions?: { width: number; height: number };
  error?: string;
}

export interface ContentValidationOptions {
  checkLinks?: boolean;
  checkImages?: boolean;
  checkSpelling?: boolean;
  checkGrammar?: boolean;
  maxLineLength?: number;
  requiredFrontmatter?: string[];
  allowedImageFormats?: string[];
  maxImageSize?: number; // in bytes
}

const DEFAULT_OPTIONS: ContentValidationOptions = {
  checkLinks: true,
  checkImages: true,
  checkSpelling: false, // Requires external service
  checkGrammar: false, // Requires external service
  maxLineLength: 120,
  requiredFrontmatter: ['title', 'description'],
  allowedImageFormats: ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'],
  maxImageSize: 5 * 1024 * 1024, // 5MB
};

export class ContentValidator {
  private options: ContentValidationOptions;
  private contentDir: string;
  private publicDir: string;

  constructor(contentDir: string, publicDir: string, options: Partial<ContentValidationOptions> = {}) {
    this.contentDir = contentDir;
    this.publicDir = publicDir;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Validate a single documentation page
   */
  async validatePage(page: DocumentationPage): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const info: ValidationError[] = [];

    // Validate frontmatter
    const frontmatterResult = this.validateFrontmatter(page);
    errors.push(...frontmatterResult.errors);
    warnings.push(...frontmatterResult.warnings);
    info.push(...frontmatterResult.info);

    // Validate content structure
    const contentResult = this.validateContentStructure(page);
    errors.push(...contentResult.errors);
    warnings.push(...contentResult.warnings);
    info.push(...contentResult.info);

    // Validate links
    if (this.options.checkLinks) {
      const linkResult = await this.validateLinks(page);
      errors.push(...linkResult.errors);
      warnings.push(...linkResult.warnings);
      info.push(...linkResult.info);
    }

    // Validate images
    if (this.options.checkImages) {
      const imageResult = await this.validateImages(page);
      errors.push(...imageResult.errors);
      warnings.push(...imageResult.warnings);
      info.push(...imageResult.info);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      info,
    };
  }

  /**
   * Validate multiple pages
   */
  async validatePages(pages: DocumentationPage[]): Promise<ValidationResult> {
    const allErrors: ValidationError[] = [];
    const allWarnings: ValidationError[] = [];
    const allInfo: ValidationError[] = [];

    for (const page of pages) {
      const result = await this.validatePage(page);
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
      allInfo.push(...result.info);
    }

    // Cross-page validation
    const crossPageResult = this.validateCrossPageReferences(pages);
    allErrors.push(...crossPageResult.errors);
    allWarnings.push(...crossPageResult.warnings);
    allInfo.push(...crossPageResult.info);

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
      info: allInfo,
    };
  }

  /**
   * Validate frontmatter
   */
  private validateFrontmatter(page: DocumentationPage): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const info: ValidationError[] = [];

    // Check required fields
    for (const field of this.options.requiredFrontmatter || []) {
      if (!page.frontmatter[field as keyof typeof page.frontmatter]) {
        errors.push({
          type: 'error',
          code: 'MISSING_FRONTMATTER',
          message: `Missing required frontmatter field: ${field}`,
          file: page.filePath,
        });
      }
    }

    // Validate title length
    if (page.frontmatter.title && page.frontmatter.title.length > 100) {
      warnings.push({
        type: 'warning',
        code: 'LONG_TITLE',
        message: 'Title is longer than 100 characters',
        file: page.filePath,
        context: page.frontmatter.title,
      });
    }

    // Validate description length
    if (page.frontmatter.description && page.frontmatter.description.length > 200) {
      warnings.push({
        type: 'warning',
        code: 'LONG_DESCRIPTION',
        message: 'Description is longer than 200 characters',
        file: page.filePath,
        context: page.frontmatter.description,
      });
    }

    // Validate tags
    if (page.frontmatter.tags && page.frontmatter.tags.length > 10) {
      warnings.push({
        type: 'warning',
        code: 'TOO_MANY_TAGS',
        message: 'Page has more than 10 tags',
        file: page.filePath,
        context: page.frontmatter.tags.join(', '),
      });
    }

    // Validate difficulty level
    const validDifficulties = ['beginner', 'intermediate', 'advanced'];
    if (page.frontmatter.difficulty && !validDifficulties.includes(page.frontmatter.difficulty)) {
      errors.push({
        type: 'error',
        code: 'INVALID_DIFFICULTY',
        message: `Invalid difficulty level: ${page.frontmatter.difficulty}. Must be one of: ${validDifficulties.join(', ')}`,
        file: page.filePath,
      });
    }

    return { valid: errors.length === 0, errors, warnings, info };
  }

  /**
   * Validate content structure
   */
  private validateContentStructure(page: DocumentationPage): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const info: ValidationError[] = [];

    const lines = page.content.split('\n');

    // Check line length
    if (this.options.maxLineLength) {
      lines.forEach((line, index) => {
        if (line.length > this.options.maxLineLength!) {
          warnings.push({
            type: 'warning',
            code: 'LONG_LINE',
            message: `Line exceeds ${this.options.maxLineLength} characters`,
            file: page.filePath,
            line: index + 1,
            context: line.substring(0, 50) + '...',
          });
        }
      });
    }

    // Check for heading structure
    const headingRegex = /^(#{1,6})\s+(.+)$/;
    const headings: { level: number; text: string; line: number }[] = [];

    lines.forEach((line, index) => {
      const match = line.match(headingRegex);
      if (match) {
        headings.push({
          level: match[1].length,
          text: match[2],
          line: index + 1,
        });
      }
    });

    // Check heading hierarchy
    for (let i = 1; i < headings.length; i++) {
      const current = headings[i];
      const previous = headings[i - 1];

      if (current.level > previous.level + 1) {
        warnings.push({
          type: 'warning',
          code: 'HEADING_HIERARCHY',
          message: `Heading level jumps from h${previous.level} to h${current.level}`,
          file: page.filePath,
          line: current.line,
          context: current.text,
        });
      }
    }

    // Check for empty headings
    headings.forEach(heading => {
      if (!heading.text.trim()) {
        errors.push({
          type: 'error',
          code: 'EMPTY_HEADING',
          message: 'Heading has no text content',
          file: page.filePath,
          line: heading.line,
        });
      }
    });

    // Check content length
    const wordCount = page.content.split(/\s+/).length;
    if (wordCount < 100) {
      warnings.push({
        type: 'warning',
        code: 'SHORT_CONTENT',
        message: `Content is very short (${wordCount} words). Consider adding more detail.`,
        file: page.filePath,
      });
    }

    return { valid: errors.length === 0, errors, warnings, info };
  }

  /**
   * Validate links in content
   */
  private async validateLinks(page: DocumentationPage): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const info: ValidationError[] = [];

    // Extract all links from content
    const linkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
    const links: { text: string; url: string; line: number }[] = [];
    
    const lines = page.content.split('\n');
    lines.forEach((line, index) => {
      let match;
      while ((match = linkRegex.exec(line)) !== null) {
        links.push({
          text: match[1],
          url: match[2],
          line: index + 1,
        });
      }
    });

    // Validate each link
    for (const link of links) {
      const result = await this.validateSingleLink(link.url, page.filePath);
      
      if (!result.valid) {
        const errorType = result.type === 'external' ? 'warning' : 'error';
        const errorCode = result.type === 'external' ? 'EXTERNAL_LINK_FAILED' : 'BROKEN_LINK';
        
        (errorType === 'error' ? errors : warnings).push({
          type: errorType,
          code: errorCode,
          message: `${result.type === 'external' ? 'External link may be broken' : 'Broken link'}: ${link.url}${result.error ? ` (${result.error})` : ''}`,
          file: page.filePath,
          line: link.line,
          context: link.text,
        });
      }
    }

    return { valid: errors.length === 0, errors, warnings, info };
  }

  /**
   * Validate a single link
   */
  private async validateSingleLink(url: string, currentFile: string): Promise<LinkValidationResult> {
    // Handle anchor links
    if (url.startsWith('#')) {
      return {
        url,
        valid: true, // We assume anchor links are valid for now
        type: 'anchor',
      };
    }

    // Handle external links
    if (url.startsWith('http://') || url.startsWith('https://')) {
      try {
        // For build-time validation, we'll skip actual HTTP requests
        // In a real implementation, you might want to make HEAD requests
        return {
          url,
          valid: true,
          type: 'external',
        };
      } catch (error) {
        return {
          url,
          valid: false,
          type: 'external',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    // Handle internal links
    const resolvedPath = this.resolveInternalLink(url, currentFile);
    const exists = existsSync(resolvedPath);

    return {
      url,
      valid: exists,
      type: 'internal',
      error: exists ? undefined : 'File not found',
    };
  }

  /**
   * Resolve internal link path
   */
  private resolveInternalLink(url: string, currentFile: string): string {
    if (url.startsWith('/')) {
      // Absolute path from content root
      return join(this.contentDir, url.slice(1));
    } else {
      // Relative path from current file
      const currentDir = dirname(currentFile);
      return resolve(currentDir, url);
    }
  }

  /**
   * Validate images in content
   */
  private async validateImages(page: DocumentationPage): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const info: ValidationError[] = [];

    // Extract all images from content
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const images: { alt: string; src: string; line: number }[] = [];
    
    const lines = page.content.split('\n');
    lines.forEach((line, index) => {
      let match;
      while ((match = imageRegex.exec(line)) !== null) {
        images.push({
          alt: match[1],
          src: match[2],
          line: index + 1,
        });
      }
    });

    // Validate each image
    for (const image of images) {
      const result = await this.validateSingleImage(image.src, page.filePath);
      
      if (!result.valid) {
        errors.push({
          type: 'error',
          code: 'MISSING_IMAGE',
          message: `Image not found: ${image.src}${result.error ? ` (${result.error})` : ''}`,
          file: page.filePath,
          line: image.line,
          context: image.alt,
        });
      }

      // Check alt text
      if (!image.alt.trim()) {
        warnings.push({
          type: 'warning',
          code: 'MISSING_ALT_TEXT',
          message: `Image missing alt text: ${image.src}`,
          file: page.filePath,
          line: image.line,
        });
      }

      // Check image size
      if (result.size && this.options.maxImageSize && result.size > this.options.maxImageSize) {
        warnings.push({
          type: 'warning',
          code: 'LARGE_IMAGE',
          message: `Image is large (${Math.round(result.size / 1024)}KB): ${image.src}`,
          file: page.filePath,
          line: image.line,
        });
      }
    }

    return { valid: errors.length === 0, errors, warnings, info };
  }

  /**
   * Validate a single image
   */
  private async validateSingleImage(src: string, currentFile: string): Promise<ImageValidationResult> {
    // Handle external images
    if (src.startsWith('http://') || src.startsWith('https://')) {
      return {
        src,
        valid: true, // Assume external images are valid
        exists: true,
      };
    }

    // Handle internal images
    let imagePath: string;
    
    if (src.startsWith('/')) {
      // Absolute path from public directory
      imagePath = join(this.publicDir, src.slice(1));
    } else {
      // Relative path from current file
      const currentDir = dirname(currentFile);
      imagePath = resolve(currentDir, src);
    }

    const exists = existsSync(imagePath);
    
    if (!exists) {
      return {
        src,
        valid: false,
        exists: false,
        error: 'File not found',
      };
    }

    // Get file stats
    const stats = statSync(imagePath);
    
    return {
      src,
      valid: true,
      exists: true,
      size: stats.size,
    };
  }

  /**
   * Validate cross-page references
   */
  private validateCrossPageReferences(pages: DocumentationPage[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const info: ValidationError[] = [];

    const pageMap = new Map(pages.map(page => [page.slug, page]));

    // Check for duplicate slugs
    const slugCounts = new Map<string, number>();
    pages.forEach(page => {
      const count = slugCounts.get(page.slug) || 0;
      slugCounts.set(page.slug, count + 1);
    });

    slugCounts.forEach((count, slug) => {
      if (count > 1) {
        errors.push({
          type: 'error',
          code: 'DUPLICATE_SLUG',
          message: `Duplicate page slug found: ${slug}`,
        });
      }
    });

    // Check internal link references
    pages.forEach(page => {
      const linkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
      const lines = page.content.split('\n');
      
      lines.forEach((line, lineIndex) => {
        let match;
        while ((match = linkRegex.exec(line)) !== null) {
          const url = match[2];
          
          // Check if it's an internal page reference
          if (url.startsWith('/') && !url.includes('.')) {
            const targetSlug = url.slice(1);
            if (!pageMap.has(targetSlug)) {
              errors.push({
                type: 'error',
                code: 'BROKEN_PAGE_REFERENCE',
                message: `Reference to non-existent page: ${url}`,
                file: page.filePath,
                line: lineIndex + 1,
                context: match[1],
              });
            }
          }
        }
      });
    });

    return { valid: errors.length === 0, errors, warnings, info };
  }
}

/**
 * Create a content validator instance
 */
export function createContentValidator(
  contentDir: string,
  publicDir: string,
  options?: Partial<ContentValidationOptions>
): ContentValidator {
  return new ContentValidator(contentDir, publicDir, options);
}

/**
 * Format validation results for display
 */
export function formatValidationResults(results: ValidationResult): string {
  const lines: string[] = [];
  
  if (results.errors.length > 0) {
    lines.push('❌ ERRORS:');
    results.errors.forEach(error => {
      lines.push(`  ${error.code}: ${error.message}`);
      if (error.file) {
        lines.push(`    File: ${error.file}${error.line ? `:${error.line}` : ''}`);
      }
      if (error.context) {
        lines.push(`    Context: ${error.context}`);
      }
    });
    lines.push('');
  }
  
  if (results.warnings.length > 0) {
    lines.push('⚠️  WARNINGS:');
    results.warnings.forEach(warning => {
      lines.push(`  ${warning.code}: ${warning.message}`);
      if (warning.file) {
        lines.push(`    File: ${warning.file}${warning.line ? `:${warning.line}` : ''}`);
      }
      if (warning.context) {
        lines.push(`    Context: ${warning.context}`);
      }
    });
    lines.push('');
  }
  
  if (results.info.length > 0) {
    lines.push('ℹ️  INFO:');
    results.info.forEach(info => {
      lines.push(`  ${info.code}: ${info.message}`);
      if (info.file) {
        lines.push(`    File: ${info.file}${info.line ? `:${info.line}` : ''}`);
      }
    });
    lines.push('');
  }
  
  if (results.valid) {
    lines.push('✅ All validations passed!');
  } else {
    lines.push(`❌ Validation failed with ${results.errors.length} error(s) and ${results.warnings.length} warning(s)`);
  }
  
  return lines.join('\n');
}