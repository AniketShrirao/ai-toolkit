'use client';

import { useState, useEffect, useCallback } from 'react';

interface ResponsiveNavigationConfig {
  mobileBreakpoint?: number;
  tabletBreakpoint?: number;
  desktopBreakpoint?: number;
}

interface ResponsiveNavigationState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  orientation: 'portrait' | 'landscape';
}

const defaultConfig: Required<ResponsiveNavigationConfig> = {
  mobileBreakpoint: 768,
  tabletBreakpoint: 1024,
  desktopBreakpoint: 1280,
};

export function useResponsiveNavigation(config: ResponsiveNavigationConfig = {}) {
  const finalConfig = { ...defaultConfig, ...config };
  
  const [state, setState] = useState<ResponsiveNavigationState>(() => {
    // Server-side safe defaults
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        screenWidth: 1280,
        orientation: 'landscape',
      };
    }
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    return {
      isMobile: width < finalConfig.mobileBreakpoint,
      isTablet: width >= finalConfig.mobileBreakpoint && width < finalConfig.tabletBreakpoint,
      isDesktop: width >= finalConfig.desktopBreakpoint,
      screenWidth: width,
      orientation: width > height ? 'landscape' : 'portrait',
    };
  });

  const updateState = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    setState({
      isMobile: width < finalConfig.mobileBreakpoint,
      isTablet: width >= finalConfig.mobileBreakpoint && width < finalConfig.tabletBreakpoint,
      isDesktop: width >= finalConfig.desktopBreakpoint,
      screenWidth: width,
      orientation: width > height ? 'landscape' : 'portrait',
    });
  }, [finalConfig]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Set initial state
    updateState();
    
    // Debounced resize handler
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateState, 100);
    };
    
    // Orientation change handler
    const handleOrientationChange = () => {
      // Small delay to ensure dimensions are updated
      setTimeout(updateState, 100);
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [updateState]);

  // Helper functions
  const isBreakpoint = useCallback((breakpoint: keyof typeof finalConfig) => {
    return state.screenWidth >= finalConfig[breakpoint];
  }, [state.screenWidth, finalConfig]);

  const isWithinRange = useCallback((min: number, max: number) => {
    return state.screenWidth >= min && state.screenWidth < max;
  }, [state.screenWidth]);

  return {
    ...state,
    isBreakpoint,
    isWithinRange,
    breakpoints: finalConfig,
  };
}

// Hook for managing mobile navigation state
export function useMobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const { isMobile } = useResponsiveNavigation();

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  // Auto-close when switching to desktop
  useEffect(() => {
    if (!isMobile && isOpen) {
      setIsOpen(false);
    }
  }, [isMobile, isOpen]);

  return {
    isOpen,
    isMobile,
    open,
    close,
    toggle,
  };
}

// Hook for touch gestures
export function useTouchGestures() {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  const onTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    setTouchEnd(null);
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    setTouchEnd({ x: touch.clientX, y: touch.clientY });
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return null;

    const deltaX = touchStart.x - touchEnd.x;
    const deltaY = touchStart.y - touchEnd.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Minimum swipe distance
    const minSwipeDistance = 50;

    if (Math.max(absDeltaX, absDeltaY) < minSwipeDistance) {
      return null;
    }

    // Determine swipe direction
    if (absDeltaX > absDeltaY) {
      // Horizontal swipe
      return deltaX > 0 ? 'left' : 'right';
    } else {
      // Vertical swipe
      return deltaY > 0 ? 'up' : 'down';
    }
  }, [touchStart, touchEnd]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    getSwipeDirection: onTouchEnd,
  };
}