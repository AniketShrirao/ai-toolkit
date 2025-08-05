'use client';

import React, { useEffect } from 'react';
import { useResponsiveNavigation } from '@/hooks/useResponsiveNavigation';
import { useNavigation } from '@/contexts/NavigationContext';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Breadcrumbs } from './Breadcrumbs';
import { MobileNavigationDrawer } from '@/components/ui/navigation/MobileNavigationDrawer';
import styles from './ResponsiveLayout.module.scss';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveLayout({ children, className }: ResponsiveLayoutProps) {
  const { isMobile, isTablet, isDesktop } = useResponsiveNavigation();
  const { setIsMobile, closeNavigation } = useNavigation();

  // Sync responsive state with navigation context
  useEffect(() => {
    setIsMobile(isMobile);
  }, [isMobile, setIsMobile]);

  // Close navigation when switching to desktop
  useEffect(() => {
    if (isDesktop) {
      closeNavigation();
    }
  }, [isDesktop, closeNavigation]);

  return (
    <div className={`${styles.layout} ${className || ''}`} data-layout="responsive">
      {/* Header - always visible */}
      <Header className={styles.header} />
      
      {/* Main content area */}
      <div className={styles.main}>
        {/* Desktop/Tablet Sidebar */}
        {!isMobile && (
          <Sidebar className={styles.sidebar} />
        )}
        
        {/* Content area */}
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

      {/* Mobile Navigation Drawer */}
      {isMobile && <MobileNavigationDrawer />}
    </div>
  );
}

// Higher-order component for responsive behavior
export function withResponsiveLayout<P extends object>(
  Component: React.ComponentType<P>
) {
  const ResponsiveComponent = (props: P) => {
    return (
      <ResponsiveLayout>
        <Component {...props} />
      </ResponsiveLayout>
    );
  };

  ResponsiveComponent.displayName = `withResponsiveLayout(${Component.displayName || Component.name})`;
  
  return ResponsiveComponent;
}