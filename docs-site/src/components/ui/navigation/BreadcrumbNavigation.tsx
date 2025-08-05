'use client';

import React from 'react';
import Link from 'next/link';
import { BreadcrumbItem } from '@/contexts/NavigationContext';
import styles from './BreadcrumbNavigation.module.scss';

interface BreadcrumbNavigationProps {
  breadcrumbs: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
  maxItems?: number;
}

export function BreadcrumbNavigation({ 
  breadcrumbs, 
  className,
  showHome = true,
  maxItems = 5
}: BreadcrumbNavigationProps) {
  // Filter out home if not wanted
  const filteredBreadcrumbs = showHome ? breadcrumbs : breadcrumbs.slice(1);
  
  // Handle truncation if there are too many items
  const shouldTruncate = filteredBreadcrumbs.length > maxItems;
  const displayBreadcrumbs = shouldTruncate 
    ? [
        filteredBreadcrumbs[0], // First item (usually Home)
        { label: '...', path: '', active: false }, // Ellipsis
        ...filteredBreadcrumbs.slice(-maxItems + 2) // Last few items
      ]
    : filteredBreadcrumbs;

  if (displayBreadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav 
      className={`${styles.breadcrumbNav} ${className || ''}`} 
      aria-label="Breadcrumb navigation"
    >
      <ol className={styles.breadcrumbList} itemScope itemType="https://schema.org/BreadcrumbList">
        {displayBreadcrumbs.map((breadcrumb, index) => (
          <li 
            key={`${breadcrumb.path}-${index}`} 
            className={styles.breadcrumbItem}
            itemProp="itemListElement"
            itemScope
            itemType="https://schema.org/ListItem"
          >
            {breadcrumb.label === '...' ? (
              <span className={styles.breadcrumbEllipsis} aria-hidden="true">
                {breadcrumb.label}
              </span>
            ) : breadcrumb.active ? (
              <span 
                className={styles.breadcrumbCurrent} 
                aria-current="page"
                itemProp="name"
              >
                {breadcrumb.label}
              </span>
            ) : (
              <Link 
                href={breadcrumb.path} 
                className={styles.breadcrumbLink}
                itemProp="item"
              >
                <span itemProp="name">{breadcrumb.label}</span>
              </Link>
            )}
            
            {/* Position for structured data */}
            <meta itemProp="position" content={String(index + 1)} />
            
            {/* Separator */}
            {index < displayBreadcrumbs.length - 1 && (
              <BreadcrumbSeparator />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function BreadcrumbSeparator() {
  return (
    <svg
      className={styles.breadcrumbSeparator}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
}

// Alternative separator styles
export function BreadcrumbSeparatorSlash() {
  return (
    <span className={styles.breadcrumbSeparator} aria-hidden="true">
      /
    </span>
  );
}

export function BreadcrumbSeparatorDot() {
  return (
    <span className={styles.breadcrumbSeparator} aria-hidden="true">
      •
    </span>
  );
}