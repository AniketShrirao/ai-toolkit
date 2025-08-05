'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { NavigationItem } from '@/contexts/NavigationContext';
import styles from './NavigationTree.module.scss';

interface NavigationTreeProps {
  items: NavigationItem[];
  isActiveRoute: (path: string) => boolean;
  level?: number;
  className?: string;
}

export function NavigationTree({ 
  items, 
  isActiveRoute, 
  level = 0, 
  className 
}: NavigationTreeProps) {
  return (
    <ul className={`${styles.navigationTree} ${className || ''}`} data-level={level}>
      {items.map((item, index) => (
        <NavigationTreeItem
          key={`${item.path}-${index}`}
          item={item}
          isActiveRoute={isActiveRoute}
          level={level}
        />
      ))}
    </ul>
  );
}

interface NavigationTreeItemProps {
  item: NavigationItem;
  isActiveRoute: (path: string) => boolean;
  level: number;
}

function NavigationTreeItem({ item, isActiveRoute, level }: NavigationTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(() => {
    // Auto-expand if this item or any child is active
    if (isActiveRoute(item.path)) return true;
    if (item.children) {
      return item.children.some(child => isActiveRoute(child.path));
    }
    return false;
  });

  const isActive = isActiveRoute(item.path);
  const hasChildren = item.children && item.children.length > 0;

  const toggleExpanded = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded(prev => !prev);
  }, []);

  // Auto-expand when route becomes active
  React.useEffect(() => {
    if (isActive || (item.children && item.children.some(child => isActiveRoute(child.path)))) {
      setIsExpanded(true);
    }
  }, [isActive, item.children, isActiveRoute]);

  return (
    <li className={styles.treeItem} data-level={level}>
      <div className={styles.itemWrapper}>
        <Link
          href={item.path}
          className={`${styles.itemLink} ${isActive ? styles.active : ''}`}
          style={{ paddingLeft: `${level * 1.5 + 1}rem` }}
        >
          {/* Icon if provided */}
          {item.icon && (
            <span className={styles.itemIcon} dangerouslySetInnerHTML={{ __html: item.icon }} />
          )}
          
          {/* Title */}
          <span className={styles.itemTitle}>{item.title}</span>
          
          {/* Badge if provided */}
          {item.badge && (
            <span className={`${styles.itemBadge} ${styles[`badge-${item.badge.toLowerCase()}`] || ''}`}>
              {item.badge}
            </span>
          )}
        </Link>

        {/* Expand/collapse button for items with children */}
        {hasChildren && (
          <button
            className={`${styles.expandButton} ${isExpanded ? styles.expanded : ''}`}
            onClick={toggleExpanded}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
            aria-expanded={isExpanded}
            type="button"
          >
            <svg
              className={styles.expandIcon}
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
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && item.children && (
        <div className={styles.childrenContainer}>
          <NavigationTree
            items={item.children}
            isActiveRoute={isActiveRoute}
            level={level + 1}
            className={styles.childrenTree}
          />
        </div>
      )}
    </li>
  );
}