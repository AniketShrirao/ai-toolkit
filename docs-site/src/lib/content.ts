import { join } from 'path';
import { 
  getAllPages, 
  getPageBySlug, 
  generateNavigation, 
  extractTableOfContents,
  DocumentationPage,
  ContentNavigationItem,
  TableOfContentsItem 
} from './mdx';

const CONTENT_DIR = join(process.cwd(), 'content');

/**
 * Get all documentation pages
 */
export function getDocumentationPages(): DocumentationPage[] {
  return getAllPages(CONTENT_DIR);
}

/**
 * Get a specific documentation page by slug
 */
export function getDocumentationPage(slug: string): DocumentationPage | null {
  return getPageBySlug(slug, CONTENT_DIR);
}

/**
 * Get navigation structure for the documentation
 */
export function getDocumentationNavigation(): ContentNavigationItem[] {
  const pages = getDocumentationPages();
  return generateNavigation(pages);
}

/**
 * Get table of contents for a specific page
 */
export function getPageTableOfContents(slug: string): TableOfContentsItem[] {
  const page = getDocumentationPage(slug);
  if (!page) return [];
  
  return extractTableOfContents(page.content);
}

/**
 * Get all page slugs for static generation
 */
export function getAllPageSlugs(): string[] {
  const pages = getDocumentationPages();
  return pages.map(page => page.slug);
}

/**
 * Get pages by category
 */
export function getPagesByCategory(category: string): DocumentationPage[] {
  const pages = getDocumentationPages();
  return pages.filter(page => page.frontmatter.category === category);
}

/**
 * Get pages by tag
 */
export function getPagesByTag(tag: string): DocumentationPage[] {
  const pages = getDocumentationPages();
  return pages.filter(page => page.frontmatter.tags.includes(tag));
}

/**
 * Get all unique categories
 */
export function getAllCategories(): string[] {
  const pages = getDocumentationPages();
  const categories = new Set(pages.map(page => page.frontmatter.category));
  return Array.from(categories).sort();
}

/**
 * Get all unique tags
 */
export function getAllTags(): string[] {
  const pages = getDocumentationPages();
  const tags = new Set(pages.flatMap(page => page.frontmatter.tags));
  return Array.from(tags).sort();
}

/**
 * Search pages by title and content
 */
export function searchPages(query: string): DocumentationPage[] {
  const pages = getDocumentationPages();
  const searchTerm = query.toLowerCase();
  
  return pages.filter(page => {
    const titleMatch = page.frontmatter.title.toLowerCase().includes(searchTerm);
    const descriptionMatch = page.frontmatter.description.toLowerCase().includes(searchTerm);
    const contentMatch = page.content.toLowerCase().includes(searchTerm);
    const tagMatch = page.frontmatter.tags.some(tag => 
      tag.toLowerCase().includes(searchTerm)
    );
    
    return titleMatch || descriptionMatch || contentMatch || tagMatch;
  });
}

/**
 * Get related pages based on tags and category
 */
export function getRelatedPages(currentPage: DocumentationPage, limit: number = 5): DocumentationPage[] {
  const allPages = getDocumentationPages();
  const currentTags = currentPage.frontmatter.tags;
  const currentCategory = currentPage.frontmatter.category;
  
  // Score pages based on similarity
  const scoredPages = allPages
    .filter(page => page.slug !== currentPage.slug)
    .map(page => {
      let score = 0;
      
      // Same category gets higher score
      if (page.frontmatter.category === currentCategory) {
        score += 3;
      }
      
      // Shared tags get points
      const sharedTags = page.frontmatter.tags.filter(tag => 
        currentTags.includes(tag)
      );
      score += sharedTags.length * 2;
      
      // Same difficulty level gets a small bonus
      if (page.frontmatter.difficulty === currentPage.frontmatter.difficulty) {
        score += 1;
      }
      
      return { page, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  
  return scoredPages.map(({ page }) => page);
}