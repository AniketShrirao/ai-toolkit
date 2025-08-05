'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { NavigationProvider as BaseNavigationProvider, useNavigation } from '@/contexts/NavigationContext';

interface EnhancedNavigationProviderProps {
  children: React.ReactNode;
}

// Enhanced navigation provider that automatically syncs with Next.js router
export function EnhancedNavigationProvider({ children }: EnhancedNavigationProviderProps) {
  return (
    <BaseNavigationProvider>
      <NavigationSync>
        {children}
      </NavigationSync>
    </BaseNavigationProvider>
  );
}

// Component that syncs navigation state with Next.js router
function NavigationSync({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { setCurrentPath, closeNavigation, isMobile } = useNavigation();

  // Sync current path with Next.js router
  useEffect(() => {
    setCurrentPath(pathname);
  }, [pathname, setCurrentPath]);

  // Close mobile navigation when route changes
  useEffect(() => {
    if (isMobile) {
      closeNavigation();
    }
  }, [pathname, isMobile, closeNavigation]);

  return <>{children}</>;
}