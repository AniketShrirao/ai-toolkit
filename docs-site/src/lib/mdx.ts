import matter from 'gray-matter';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, basename } from 'path';

export interface PageFrontmatter {
  title: string;
  description: string;
  category: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedReadTime: number;
  prerequisites?: string[];
  lastModified?: string;
  draft?: boolean;
}

export interface DocumentationPage {
  slug: string;
  frontmatter: PageFrontmatter;
  content: string;
  filePath: string;
  lastModified: Date;
}

export interface TableOfContentsItem {
  id: string;
  title: string;
  level: number;
  children?: TableOfContentsItem[];
}

/**
 * Generate a URL-friendly slug from a string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Generate a slug from a file path
 */
export function generateSlugFromPath(filePath: string): string {
  const pathWithoutExt = filePath.replace(/\.(mdx?|tsx?)$/, '');
  const segments = pathWithoutExt.split('/').filter(Boolean);
  
  // Remove 'content' from the beginning if present
  if (segments[0] === 'content') {
    segments.shift();
  }
  
  // Convert index files to their parent directory name
  if (segments[segments.length - 1] === 'index') {
    segments.pop();
  }
  
  return segments.join('/');
}

/**
 * Parse MDX file and extract frontmatter and content
 */
export function parseMDXFile(filePath: string): DocumentationPage {
  const fileContent = readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContent);
  
  const stats = statSync(filePath);
  const slug = generateSlugFromPath(filePath.replace(process.cwd(), ''));
  
  // Validate and set default frontmatter values
  const frontmatter: PageFrontmatter = {
    title: data.title || basename(filePath, extname(filePath)),
    description: data.description || '',
    category: data.category || 'general',
    tags: Array.isArray(data.tags) ? data.tags : [],
    difficulty: ['beginner', 'intermediate', 'advanced'].includes(data.difficulty) 
      ? data.difficulty 
      : 'beginner',
    estimatedReadTime: data.estimatedReadTime || estimateReadTime(content),
    prerequisites: Array.isArray(data.prerequisites) ? data.prerequisites : undefined,
    lastModified: data.lastModified || stats.mtime.toISOString(),
    draft: Boolean(data.draft),
  };
  
  return {
    slug,
    frontmatter,
    content,
    filePath,
    lastModified: stats.mtime,
  };
}

/**
 * Estimate reading time based on content length
 */
export function estimateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

/**
 * Get all MDX files from a directory recursively
 */
export function getAllMDXFiles(dir: string): string[] {
  const files: string[] = [];
  
  function traverse(currentDir: string) {
    const items = readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = join(currentDir, item);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (item.match(/\.(mdx?|tsx?)$/)) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

/**
 * Get all documentation pages from the content directory
 */
export function getAllPages(contentDir: string): DocumentationPage[] {
  const files = getAllMDXFiles(contentDir);
  return files
    .map(parseMDXFile)
    .filter(page => !page.frontmatter.draft)
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

/**
 * Get a specific page by slug
 */
export function getPageBySlug(slug: string, contentDir: string): DocumentationPage | null {
  const pages = getAllPages(contentDir);
  return pages.find(page => page.slug === slug) || null;
}

/**
 * Extract table of contents from MDX content
 */
export function extractTableOfContents(content: string): TableOfContentsItem[] {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings: TableOfContentsItem[] = [];
  let match;
  
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const title = match[2].trim();
    const id = generateSlug(title);
    
    headings.push({
      id,
      title,
      level,
    });
  }
  
  // Build hierarchical structure
  return buildTOCHierarchy(headings);
}

/**
 * Build hierarchical table of contents structure
 */
function buildTOCHierarchy(headings: TableOfContentsItem[]): TableOfContentsItem[] {
  const result: TableOfContentsItem[] = [];
  const stack: TableOfContentsItem[] = [];
  
  for (const heading of headings) {
    // Remove items from stack that are at the same level or deeper
    while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
      stack.pop();
    }
    
    if (stack.length === 0) {
      // Top level heading
      result.push(heading);
    } else {
      // Child heading
      const parent = stack[stack.length - 1];
      if (!parent.children) {
        parent.children = [];
      }
      parent.children.push(heading);
    }
    
    stack.push(heading);
  }
  
  return result;
}

/**
 * Generate navigation structure from pages
 */
export interface ContentNavigationItem {
  title: string;
  slug: string;
  children?: ContentNavigationItem[];
}

interface NavigationNode {
  title: string;
  slug: string;
  children: { [key: string]: NavigationNode };
}

export function generateNavigation(pages: DocumentationPage[]): ContentNavigationItem[] {
  const navigation: { [key: string]: NavigationNode } = {};
  
  for (const page of pages) {
    const segments = page.slug.split('/').filter(Boolean);
    let current = navigation;
    let path = '';
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      path += (path ? '/' : '') + segment;
      
      if (!current[segment]) {
        current[segment] = {
          title: i === segments.length - 1 ? page.frontmatter.title : segment,
          slug: path,
          children: {},
        };
      }
      
      if (i < segments.length - 1) {
        current = current[segment].children;
      }
    }
  }
  
  // Convert to array and clean up
  function convertToArray(obj: { [key: string]: NavigationNode }): ContentNavigationItem[] {
    return Object.values(obj).map(item => ({
      title: item.title,
      slug: item.slug,
      children: Object.keys(item.children).length > 0 
        ? convertToArray(item.children)
        : undefined,
    }));
  }
  
  return convertToArray(navigation);
}