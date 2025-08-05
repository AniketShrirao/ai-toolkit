'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

export interface NavigationItem {
  title: string;
  path: string;
  icon?: string;
  children?: NavigationItem[];
  badge?: string;
  description?: string;
  isExternal?: boolean;
}

export interface NavigationSection {
  title: string;
  items: NavigationItem[];
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export interface BreadcrumbItem {
  label: string;
  path: string;
  active: boolean;
}

interface NavigationState {
  expandedSections: Set<string>;
  expandedItems: Set<string>;
}

interface NavigationContextType {
  // Navigation state
  isOpen: boolean;
  isMobile: boolean;
  currentPath: string;
  navigationState: NavigationState;
  
  // Navigation actions
  toggleNavigation: () => void;
  closeNavigation: () => void;
  openNavigation: () => void;
  setCurrentPath: (path: string) => void;
  setIsMobile: (mobile: boolean) => void;
  toggleSection: (sectionTitle: string) => void;
  toggleItem: (itemPath: string) => void;
  
  // Navigation data
  navigationSections: NavigationSection[];
  breadcrumbs: BreadcrumbItem[];
  
  // Helper functions
  generateBreadcrumbs: (path: string) => BreadcrumbItem[];
  isActiveRoute: (path: string) => boolean;
  isParentRoute: (path: string) => boolean;
  findNavigationItem: (path: string) => NavigationItem | null;
  getActiveSection: () => NavigationSection | null;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

// Enhanced navigation structure with hierarchical items
const defaultNavigationSections: NavigationSection[] = [
  {
    title: 'Getting Started',
    defaultExpanded: true,
    items: [
      { 
        title: 'Installation', 
        path: '/getting-started/installation',
        description: 'Set up the AI Toolkit in your environment'
      },
      { 
        title: 'Quick Start', 
        path: '/getting-started/quick-start',
        description: 'Get up and running in minutes'
      },
      { 
        title: 'First Example', 
        path: '/getting-started/first-example',
        description: 'Process your first document'
      },
      { 
        title: 'Troubleshooting', 
        path: '/getting-started/troubleshooting',
        description: 'Common issues and solutions'
      }
    ]
  },
  {
    title: 'API Reference',
    items: [
      { 
        title: 'REST API', 
        path: '/api-reference/rest-api',
        children: [
          { title: 'Authentication', path: '/api-reference/rest-api/authentication' },
          { title: 'Documents', path: '/api-reference/rest-api/documents' },
          { title: 'Analysis', path: '/api-reference/rest-api/analysis' },
          { title: 'Webhooks', path: '/api-reference/rest-api/webhooks' }
        ]
      },
      { 
        title: 'WebSocket API', 
        path: '/api-reference/websocket-api',
        children: [
          { title: 'Connection', path: '/api-reference/websocket-api/connection' },
          { title: 'Events', path: '/api-reference/websocket-api/events' },
          { title: 'Real-time Updates', path: '/api-reference/websocket-api/real-time' }
        ]
      },
      { 
        title: 'Package APIs', 
        path: '/api-reference/package-apis',
        children: [
          { title: 'Core API', path: '/api-reference/package-apis/core' },
          { title: 'Document Analyzer', path: '/api-reference/package-apis/document-analyzer' },
          { title: 'AI Interface', path: '/api-reference/package-apis/ai-interface' }
        ]
      }
    ]
  },
  {
    title: 'Guides',
    items: [
      { 
        title: 'Document Processing', 
        path: '/guides/document-processing',
        children: [
          { title: 'Supported Formats', path: '/guides/document-processing/formats' },
          { title: 'Batch Processing', path: '/guides/document-processing/batch' },
          { title: 'Custom Extractors', path: '/guides/document-processing/extractors' }
        ]
      },
      { 
        title: 'AI Integration', 
        path: '/guides/ai-integration',
        children: [
          { title: 'Ollama Setup', path: '/guides/ai-integration/ollama' },
          { title: 'Model Selection', path: '/guides/ai-integration/models' },
          { title: 'Prompt Engineering', path: '/guides/ai-integration/prompts' }
        ]
      },
      { 
        title: 'Web Dashboard', 
        path: '/guides/web-dashboard',
        children: [
          { title: 'Interface Overview', path: '/guides/web-dashboard/interface' },
          { title: 'Workflow Management', path: '/guides/web-dashboard/workflows' },
          { title: 'Result Interpretation', path: '/guides/web-dashboard/results' }
        ]
      },
      { 
        title: 'Deployment', 
        path: '/guides/deployment',
        children: [
          { title: 'Docker Setup', path: '/guides/deployment/docker' },
          { title: 'Cloud Deployment', path: '/guides/deployment/cloud' },
          { title: 'Configuration', path: '/guides/deployment/configuration' }
        ]
      }
    ]
  },
  {
    title: 'Packages',
    items: [
      { 
        title: 'Core', 
        path: '/packages/core',
        description: 'Essential functionality and utilities'
      },
      { 
        title: 'Document Analyzer', 
        path: '/packages/document-analyzer',
        description: 'Document processing and analysis'
      },
      { 
        title: 'AI Interface', 
        path: '/packages/ollama-interface',
        description: 'AI model integration and management'
      },
      { 
        title: 'Web Dashboard', 
        path: '/packages/web-dashboard',
        description: 'User interface and visualization'
      }
    ]
  },
  {
    title: 'Resources',
    items: [
      { 
        title: 'Examples', 
        path: '/resources/examples',
        children: [
          { title: 'Basic Usage', path: '/resources/examples/basic' },
          { title: 'Advanced Workflows', path: '/resources/examples/advanced' },
          { title: 'Integration Patterns', path: '/resources/examples/integration' }
        ]
      },
      { 
        title: 'Best Practices', 
        path: '/resources/best-practices'
      },
      { 
        title: 'Community', 
        path: '/resources/community'
      },
      { 
        title: 'GitHub', 
        path: 'https://github.com/your-org/ai-toolkit',
        isExternal: true
      }
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
  const [navigationState, setNavigationState] = useState<NavigationState>(() => {
    // Initialize with default expanded sections
    const expandedSections = new Set<string>();
    const expandedItems = new Set<string>();
    
    navigationSections.forEach(section => {
      if (section.defaultExpanded) {
        expandedSections.add(section.title);
      }
    });
    
    return { expandedSections, expandedItems };
  });

  const toggleNavigation = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const closeNavigation = useCallback(() => {
    setIsOpen(false);
  }, []);

  const openNavigation = useCallback(() => {
    setIsOpen(true);
  }, []);

  const toggleSection = useCallback((sectionTitle: string) => {
    setNavigationState(prev => {
      const newExpandedSections = new Set(prev.expandedSections);
      if (newExpandedSections.has(sectionTitle)) {
        newExpandedSections.delete(sectionTitle);
      } else {
        newExpandedSections.add(sectionTitle);
      }
      return { ...prev, expandedSections: newExpandedSections };
    });
  }, []);

  const toggleItem = useCallback((itemPath: string) => {
    setNavigationState(prev => {
      const newExpandedItems = new Set(prev.expandedItems);
      if (newExpandedItems.has(itemPath)) {
        newExpandedItems.delete(itemPath);
      } else {
        newExpandedItems.add(itemPath);
      }
      return { ...prev, expandedItems: newExpandedItems };
    });
  }, []);

  const findNavigationItem = useCallback((path: string): NavigationItem | null => {
    for (const section of navigationSections) {
      for (const item of section.items) {
        if (item.path === path) return item;
        if (item.children) {
          for (const child of item.children) {
            if (child.path === path) return child;
          }
        }
      }
    }
    return null;
  }, [navigationSections]);

  const generateBreadcrumbs = useCallback((path: string): BreadcrumbItem[] => {
    const segments = path.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Home', path: '/', active: false }
    ];

    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === segments.length - 1;
      
      // Try to find the actual navigation item for better labeling
      const navItem = findNavigationItem(currentPath);
      const label = navItem?.title || segment
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
  }, [findNavigationItem]);

  const isActiveRoute = useCallback((path: string): boolean => {
    return currentPath === path;
  }, [currentPath]);

  const isParentRoute = useCallback((path: string): boolean => {
    return currentPath.startsWith(path + '/');
  }, [currentPath]);

  const getActiveSection = useCallback((): NavigationSection | null => {
    for (const section of navigationSections) {
      for (const item of section.items) {
        if (isActiveRoute(item.path) || isParentRoute(item.path)) {
          return section;
        }
        if (item.children) {
          for (const child of item.children) {
            if (isActiveRoute(child.path) || isParentRoute(child.path)) {
              return section;
            }
          }
        }
      }
    }
    return null;
  }, [navigationSections, isActiveRoute, isParentRoute]);

  // Auto-expand sections and items based on current path
  useEffect(() => {
    const activeSection = getActiveSection();
    if (activeSection) {
      setNavigationState(prev => {
        const newExpandedSections = new Set(prev.expandedSections);
        const newExpandedItems = new Set(prev.expandedItems);
        
        // Expand the active section
        newExpandedSections.add(activeSection.title);
        
        // Expand parent items
        for (const item of activeSection.items) {
          if (item.children) {
            for (const child of item.children) {
              if (isActiveRoute(child.path) || isParentRoute(child.path)) {
                newExpandedItems.add(item.path);
                break;
              }
            }
          }
        }
        
        return { 
          expandedSections: newExpandedSections, 
          expandedItems: newExpandedItems 
        };
      });
    }
  }, [currentPath, getActiveSection, isActiveRoute, isParentRoute]);

  const breadcrumbs = generateBreadcrumbs(currentPath);

  const value: NavigationContextType = {
    isOpen,
    isMobile,
    currentPath,
    navigationState,
    toggleNavigation,
    closeNavigation,
    openNavigation,
    setCurrentPath,
    setIsMobile,
    toggleSection,
    toggleItem,
    navigationSections,
    breadcrumbs,
    generateBreadcrumbs,
    isActiveRoute,
    isParentRoute,
    findNavigationItem,
    getActiveSection
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