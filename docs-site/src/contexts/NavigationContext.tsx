'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface NavigationItem {
  title: string;
  path: string;
  icon?: string;
  children?: NavigationItem[];
  badge?: string;
}

export interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

export interface BreadcrumbItem {
  label: string;
  path: string;
  active: boolean;
}

interface NavigationContextType {
  // Navigation state
  isOpen: boolean;
  isMobile: boolean;
  currentPath: string;
  
  // Navigation actions
  toggleNavigation: () => void;
  closeNavigation: () => void;
  openNavigation: () => void;
  setCurrentPath: (path: string) => void;
  setIsMobile: (mobile: boolean) => void;
  
  // Navigation data
  navigationSections: NavigationSection[];
  breadcrumbs: BreadcrumbItem[];
  
  // Helper functions
  generateBreadcrumbs: (path: string) => BreadcrumbItem[];
  isActiveRoute: (path: string) => boolean;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

// Default navigation structure
const defaultNavigationSections: NavigationSection[] = [
  {
    title: 'Getting Started',
    items: [
      { title: 'Installation', path: '/getting-started/installation' },
      { title: 'Quick Start', path: '/getting-started/quick-start' },
      { title: 'First Example', path: '/getting-started/first-example' },
      { title: 'Troubleshooting', path: '/getting-started/troubleshooting' }
    ]
  },
  {
    title: 'API Reference',
    items: [
      { title: 'REST API', path: '/api-reference/rest-api' },
      { title: 'WebSocket API', path: '/api-reference/websocket-api' },
      { title: 'Package APIs', path: '/api-reference/package-apis' }
    ]
  },
  {
    title: 'Guides',
    items: [
      { title: 'Document Processing', path: '/guides/document-processing' },
      { title: 'AI Integration', path: '/guides/ai-integration' },
      { title: 'Web Dashboard', path: '/guides/web-dashboard' },
      { title: 'Deployment', path: '/guides/deployment' }
    ]
  },
  {
    title: 'Packages',
    items: [
      { title: 'Core', path: '/packages/core' },
      { title: 'Document Analyzer', path: '/packages/document-analyzer' },
      { title: 'AI Interface', path: '/packages/ollama-interface' },
      { title: 'Web Dashboard', path: '/packages/web-dashboard' }
    ]
  }
];

interface NavigationProviderProps {
  children: ReactNode;
  initialPath?: string;
  navigationSections?: NavigationSection[];
}

export function NavigationProvider({ 
  children, 
  initialPath = '/',
  navigationSections = defaultNavigationSections 
}: NavigationProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentPath, setCurrentPath] = useState(initialPath);

  const toggleNavigation = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const closeNavigation = useCallback(() => {
    setIsOpen(false);
  }, []);

  const openNavigation = useCallback(() => {
    setIsOpen(true);
  }, []);

  const generateBreadcrumbs = useCallback((path: string): BreadcrumbItem[] => {
    const segments = path.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Home', path: '/', active: false }
    ];

    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === segments.length - 1;
      
      // Convert segment to readable label
      const label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      breadcrumbs.push({
        label,
        path: currentPath,
        active: isLast
      });
    });

    return breadcrumbs;
  }, []);

  const isActiveRoute = useCallback((path: string): boolean => {
    return currentPath === path || currentPath.startsWith(path + '/');
  }, [currentPath]);

  const breadcrumbs = generateBreadcrumbs(currentPath);

  const value: NavigationContextType = {
    isOpen,
    isMobile,
    currentPath,
    toggleNavigation,
    closeNavigation,
    openNavigation,
    setCurrentPath,
    setIsMobile,
    navigationSections,
    breadcrumbs,
    generateBreadcrumbs,
    isActiveRoute
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}