'use client';

import React, { useEffect, useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Breadcrumbs } from './Breadcrumbs';
import { useNavigation } from '@/contexts/NavigationContext';
import styles from './DocumentationLayout.module.scss';

interface DocumentationLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function DocumentationLayout({ children, className }: DocumentationLayoutProps) {
  const { setIsMobile, closeNavigation } = useNavigation();
  const [mounted, setMounted] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    setMounted(true);
    
    const handleResize = () => {
      const isMobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(isMobile);
      
      // Close sidebar when switching to desktop
      if (!isMobile) {
        closeNavigation();
      }
    };

    // Set initial state
    handleResize();
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [setIsMobile, closeNavigation]);

  // Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <div className={`${styles.layout} ${className || ''}`}>
      {/* Header */}
      <Header className={styles.header} />
      
      {/* Main content area */}
      <div className={styles.main}>
        {/* Sidebar */}
        <Sidebar className={styles.sidebar} />
        
        {/* Content */}
        <main className={styles.content}>
          {/* Breadcrumbs */}
          <div className={styles.breadcrumbsContainer}>
            <Breadcrumbs />
          </div>
          
          {/* Page content */}
          <div className={styles.pageContent}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}