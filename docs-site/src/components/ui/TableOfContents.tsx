'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TableOfContentsItem } from '@/lib/mdx';
import styles from './TableOfContents.module.scss';

interface TableOfContentsProps {
  items: TableOfContentsItem[];
  className?: string;
  maxDepth?: number;
  sticky?: boolean;
  showNumbers?: boolean;
  collapsible?: boolean;
  title?: string;
}

interface ActiveSection {
  id: string;
  level: number;
}

export function TableOfContents({
  items,
  className,
  maxDepth = 4,
  sticky = true,
  showNumbers = false,
  collapsible = true,
  title = "Table of Contents"
}: TableOfContentsProps) {
  const [activeSection, setActiveSection] = useState<ActiveSection | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Filter items by max depth
  const filteredItems = useMemo(() => {
    const filterByDepth = (items: TableOfContentsItem[]): TableOfContentsItem[] => {
      return items
        .filter(item => item.level <= maxDepth)
        .map(item => ({
          ...item,
          children: item.children ? filterByDepth(item.children) : undefined
        }));
    };
    return filterByDepth(items);
  }, [items, maxDepth]);

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
      history.replaceState(null, '', `#${id}`);
    }
  }, []);

  // Track active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const headings = document.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]');
      const scrollPosition = window.scrollY + 100; // Offset for better UX

      let currentActive: ActiveSection | null = null;

      headings.forEach((heading) => {
        const element = heading as HTMLElement;
        const rect = element.getBoundingClientRect();
        const elementTop = rect.top + window.pageYOffset;

        if (elementTop <= scrollPosition) {
          const level = parseInt(element.tagName.charAt(1));
          currentActive = {
            id: element.id,
            level
          };
        }
      });

      setActiveSection(currentActive);
    };

    // Set initial active section
    handleScroll();

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Handle hash changes (e.g., from direct links)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash) {
        const element = document.getElementById(hash);
        if (element) {
          const level = parseInt(element.tagName.charAt(1));
          setActiveSection({ id: hash, level });
        }
      }
    };

    // Set initial state from URL hash
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  const renderTOCItems = useCallback((items: TableOfContentsItem[], level = 1): React.ReactNode => {
    return (
      <ul className={`${styles.tocList} ${styles[`tocList--level-${level}`]}`}>
        {items.map((item, index) => {
          const isActive = activeSection?.id === item.id;
          const hasActiveChild = item.children && 
            item.children.some(child => activeSection?.id === child.id);

          return (
            <li key={item.id} className={styles.tocItem}>
              <button
                className={`${styles.tocLink} ${isActive ? styles.tocLinkActive : ''} ${hasActiveChild ? styles.tocLinkParentActive : ''}`}
                onClick={() => scrollToSection(item.id)}
                type="button"
              >
                {showNumbers && (
                  <span className={styles.tocNumber}>
                    {level === 1 ? index + 1 : `${index + 1}`}
                  </span>
                )}
                <span className={styles.tocTitle}>{item.title}</span>
              </button>
              
              {item.children && item.children.length > 0 && (
                <div className={styles.tocChildren}>
                  {renderTOCItems(item.children, level + 1)}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  }, [activeSection, scrollToSection, showNumbers]);

  if (!filteredItems.length) {
    return null;
  }

  return (
    <nav 
      className={`${styles.toc} ${sticky ? styles.tocSticky : ''} ${className || ''}`}
      aria-label="Table of contents"
    >
      <div className={styles.tocHeader}>
        <h3 className={styles.tocTitle}>{title}</h3>
        {collapsible && (
          <button
            className={styles.tocToggle}
            onClick={toggleCollapse}
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? 'Expand table of contents' : 'Collapse table of contents'}
            type="button"
          >
            <svg
              className={`${styles.tocToggleIcon} ${isCollapsed ? styles.tocToggleIconCollapsed : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        )}
      </div>
      
      <div className={`${styles.tocContent} ${isCollapsed ? styles.tocContentCollapsed : ''}`}>
        {renderTOCItems(filteredItems)}
      </div>
    </nav>
  );
}