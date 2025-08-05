'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { TableOfContentsItem } from '@/lib/mdx';

interface UseTableOfContentsOptions {
  /**
   * Selector for headings to include in TOC
   */
  headingSelector?: string;
  
  /**
   * Offset from top when determining active section
   */
  scrollOffset?: number;
  
  /**
   * Throttle scroll events (in milliseconds)
   */
  throttleMs?: number;
  
  /**
   * Maximum depth of headings to include
   */
  maxDepth?: number;
}

interface UseTableOfContentsReturn {
  /**
   * Table of contents items
   */
  items: TableOfContentsItem[];
  
  /**
   * Currently active section ID
   */
  activeId: string | null;
  
  /**
   * Scroll to a specific section
   */
  scrollToSection: (id: string) => void;
  
  /**
   * Generate TOC from current page content
   */
  generateTOC: () => void;
}

export function useTableOfContents(
  options: UseTableOfContentsOptions = {}
): UseTableOfContentsReturn {
  const {
    headingSelector = 'h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]',
    scrollOffset = 100,
    throttleMs = 100,
    maxDepth = 6
  } = options;

  const [items, setItems] = useState<TableOfContentsItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Generate table of contents from DOM
  const generateTOC = useCallback(() => {
    const headings = document.querySelectorAll(headingSelector);
    const tocItems: TableOfContentsItem[] = [];
    
    headings.forEach((heading) => {
      const element = heading as HTMLElement;
      const level = parseInt(element.tagName.charAt(1));
      
      if (level <= maxDepth && element.id) {
        tocItems.push({
          id: element.id,
          title: element.textContent || '',
          level,
        });
      }
    });
    
    // Build hierarchical structure
    const buildHierarchy = (items: TableOfContentsItem[]): TableOfContentsItem[] => {
      const result: TableOfContentsItem[] = [];
      const stack: TableOfContentsItem[] = [];
      
      for (const item of items) {
        // Remove items from stack that are at the same level or deeper
        while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
          stack.pop();
        }
        
        if (stack.length === 0) {
          // Top level item
          result.push(item);
        } else {
          // Child item
          const parent = stack[stack.length - 1];
          if (!parent.children) {
            parent.children = [];
          }
          parent.children.push(item);
        }
        
        stack.push(item);
      }
      
      return result;
    };
    
    setItems(buildHierarchy(tocItems));
  }, [headingSelector, maxDepth]);

  // Throttle function
  const throttle = useCallback(<T extends (...args: unknown[]) => void>(func: T, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    let lastExecTime = 0;
    
    return function (...args: Parameters<T>) {
      const currentTime = Date.now();
      
      if (currentTime - lastExecTime > delay) {
        func(...args);
        lastExecTime = currentTime;
      } else {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          func(...args);
          lastExecTime = Date.now();
        }, delay - (currentTime - lastExecTime));
      }
    };
  }, []);

  // Track active section based on scroll position
  const updateActiveSection = useCallback(() => {
    const headings = document.querySelectorAll(headingSelector);
    const scrollPosition = window.scrollY + scrollOffset;
    
    let currentActiveId: string | null = null;
    
    headings.forEach((heading) => {
      const element = heading as HTMLElement;
      const rect = element.getBoundingClientRect();
      const elementTop = rect.top + window.pageYOffset;
      
      if (elementTop <= scrollPosition && element.id) {
        currentActiveId = element.id;
      }
    });
    
    setActiveId(currentActiveId);
  }, [headingSelector, scrollOffset]);

  // Throttled scroll handler
  const throttledScrollHandler = useMemo(
    () => throttle(updateActiveSection, throttleMs),
    [updateActiveSection, throttle, throttleMs]
  );

  // Smooth scroll to section
  const scrollToSection = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 80; // Account for fixed header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      // Update URL hash without triggering scroll
      if (history.replaceState) {
        history.replaceState(null, '', `#${id}`);
      }
      
      setActiveId(id);
    }
  }, []);

  // Initialize TOC and set up scroll listener
  useEffect(() => {
    // Generate initial TOC
    generateTOC();
    
    // Set initial active section
    updateActiveSection();
    
    // Add scroll listener
    window.addEventListener('scroll', throttledScrollHandler, { passive: true });
    
    // Handle hash changes
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash) {
        setActiveId(hash);
      }
    };
    
    // Set initial state from URL hash
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    
    // Handle content changes (for dynamic content)
    const observer = new MutationObserver(() => {
      generateTOC();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['id']
    });
    
    return () => {
      window.removeEventListener('scroll', throttledScrollHandler);
      window.removeEventListener('hashchange', handleHashChange);
      observer.disconnect();
    };
  }, [generateTOC, updateActiveSection, throttledScrollHandler]);

  return {
    items,
    activeId,
    scrollToSection,
    generateTOC,
  };
}