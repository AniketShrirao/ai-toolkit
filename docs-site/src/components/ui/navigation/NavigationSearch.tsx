'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useNavigation, NavigationItem } from '@/contexts/NavigationContext';
import styles from './NavigationSearch.module.scss';

interface NavigationSearchProps {
  placeholder?: string;
  maxResults?: number;
  onItemSelect?: (item: NavigationItem) => void;
  className?: string;
}

export function NavigationSearch({ 
  placeholder = "Search documentation...",
  maxResults = 10,
  onItemSelect,
  className 
}: NavigationSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { navigationSections } = useNavigation();

  // Flatten all navigation items for searching
  const allItems = useMemo(() => {
    const items: (NavigationItem & { sectionTitle: string })[] = [];
    
    const addItems = (navItems: NavigationItem[], sectionTitle: string) => {
      navItems.forEach(item => {
        items.push({ ...item, sectionTitle });
        if (item.children) {
          addItems(item.children, sectionTitle);
        }
      });
    };

    navigationSections.forEach(section => {
      addItems(section.items, section.title);
    });

    return items;
  }, [navigationSections]);

  // Search function
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];

    const searchTerm = query.toLowerCase();
    const results = allItems
      .filter(item => {
        const titleMatch = item.title.toLowerCase().includes(searchTerm);
        const descriptionMatch = item.description?.toLowerCase().includes(searchTerm);
        const pathMatch = item.path.toLowerCase().includes(searchTerm);
        
        return titleMatch || descriptionMatch || pathMatch;
      })
      .slice(0, maxResults);

    return results;
  }, [query, allItems, maxResults]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(value.length > 0);
  }, []);

  const handleItemClick = useCallback((item: NavigationItem) => {
    setQuery('');
    setIsOpen(false);
    onItemSelect?.(item);
  }, [onItemSelect]);

  const handleInputFocus = useCallback(() => {
    if (query.length > 0) {
      setIsOpen(true);
    }
  }, [query]);

  const handleInputBlur = useCallback(() => {
    // Delay closing to allow for item clicks
    setTimeout(() => setIsOpen(false), 200);
  }, []);

  return (
    <div className={`${styles.searchContainer} ${className || ''}`}>
      <div className={styles.searchInputWrapper}>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className={styles.searchInput}
          aria-label="Search navigation"
          aria-haspopup="listbox"
        />
        
        <svg
          className={styles.searchIcon}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {isOpen && searchResults.length > 0 && (
        <div className={styles.searchResults} role="listbox">
          {searchResults.map((item, index) => (
            <button
              key={`${item.path}-${index}`}
              className={styles.searchResultItem}
              onClick={() => handleItemClick(item)}
              role="option"
              aria-selected={false}
              type="button"
            >
              <div className={styles.resultContent}>
                <div className={styles.resultTitle}>
                  {item.title}
                  {item.badge && (
                    <span className={`${styles.resultBadge} ${styles[`badge-${item.badge.toLowerCase()}`] || ''}`}>
                      {item.badge}
                    </span>
                  )}
                </div>
                
                {item.description && (
                  <div className={styles.resultDescription}>
                    {item.description}
                  </div>
                )}
                
                <div className={styles.resultPath}>
                  {item.sectionTitle} → {item.path}
                </div>
              </div>
              
              <svg
                className={styles.resultArrow}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          ))}
        </div>
      )}

      {isOpen && query.length > 0 && searchResults.length === 0 && (
        <div className={styles.searchResults}>
          <div className={styles.noResults}>
            No results found for &quot;{query}&quot;
          </div>
        </div>
      )}
    </div>
  );
}