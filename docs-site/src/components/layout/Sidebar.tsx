'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useNavigation, NavigationItem } from '@/contexts/NavigationContext';
import styles from './Sidebar.module.scss';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { 
    isOpen, 
    isMobile, 
    closeNavigation, 
    navigationSections, 
    isActiveRoute,
    currentPath 
  } = useNavigation();

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    if (!isMobile || !isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.querySelector('[data-sidebar]');
      const menuButton = document.querySelector('[data-menu-button]');
      
      if (
        sidebar && 
        !sidebar.contains(event.target as Node) &&
        menuButton &&
        !menuButton.contains(event.target as Node)
      ) {
        closeNavigation();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, isOpen, closeNavigation]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (isMobile) {
      closeNavigation();
    }
  }, [currentPath, isMobile, closeNavigation]);

  const sidebarClasses = [
    styles.sidebar,
    className || '',
    isOpen ? styles.open : '',
    isMobile ? styles.mobile : styles.desktop
  ].filter(Boolean).join(' ');

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div 
          className={styles.overlay} 
          onClick={closeNavigation}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={sidebarClasses}
        data-sidebar
        aria-label="Documentation navigation"
      >
        <div className={styles.sidebarContent}>
          {/* Mobile header */}
          {isMobile && (
            <div className={styles.mobileHeader}>
              <h2 className={styles.mobileTitle}>Navigation</h2>
              <button
                className={styles.closeButton}
                onClick={closeNavigation}
                aria-label="Close navigation"
                type="button"
              >
                <svg
                  className={styles.closeIcon}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}

          {/* Navigation sections */}
          <nav className={styles.nav}>
            {navigationSections.map((section, sectionIndex) => (
              <div key={sectionIndex} className={styles.section}>
                <h3 className={styles.sectionTitle}>{section.title}</h3>
                <ul className={styles.sectionList}>
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex} className={styles.sectionItem}>
                      <SidebarNavigationItem item={item} isActiveRoute={isActiveRoute} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}

interface NavigationItemProps {
  item: NavigationItem;
  isActiveRoute: (path: string) => boolean;
  level?: number;
}

function SidebarNavigationItem({ item, isActiveRoute, level = 0 }: NavigationItemProps) {
  const isActive = isActiveRoute(item.path);
  const hasChildren = item.children && item.children.length > 0;

  return (
    <>
      <Link
        href={item.path}
        className={`${styles.navLink} ${isActive ? styles.active : ''}`}
        style={{ paddingLeft: `${(level + 1) * 1}rem` }}
      >
        <span className={styles.navLinkText}>{item.title}</span>
        {item.badge && (
          <span className={styles.badge}>{item.badge}</span>
        )}
        {hasChildren && (
          <svg
            className={`${styles.chevron} ${isActive ? styles.expanded : ''}`}
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
        )}
      </Link>
      
      {hasChildren && isActive && item.children && (
        <ul className={styles.subList}>
          {item.children.map((child: NavigationItem, index: number) => (
            <li key={index} className={styles.subItem}>
              <SidebarNavigationItem 
                item={child} 
                isActiveRoute={isActiveRoute} 
                level={level + 1} 
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}