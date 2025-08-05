'use client';

import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('system');
  const [mounted, setMounted] = useState(false);

  // Apply theme to document
  const applyTheme = useCallback((newTheme: Theme) => {
    const root = document.documentElement;
    
    if (newTheme === 'system') {
      root.removeAttribute('data-theme');
      // Apply system preference immediately
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-resolved-theme', systemPrefersDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', newTheme);
      root.setAttribute('data-resolved-theme', newTheme);
    }
  }, []);

  // Handle system theme changes
  useEffect(() => {
    if (!mounted || theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        const root = document.documentElement;
        root.setAttribute('data-resolved-theme', e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [theme, mounted]);

  // Initialize theme on mount
  useEffect(() => {
    // Wait for theme initialization script to complete
    const checkInitialization = () => {
      const root = document.documentElement;
      const isInitialized = root.getAttribute('data-theme-initialized') === 'true';
      
      if (isInitialized) {
        setMounted(true);
        
        // Get saved theme from localStorage or default to system
        const savedTheme = (localStorage.getItem('theme') as Theme) || 'system';
        setTheme(savedTheme);
        
        // Don't re-apply theme here since initialization script already did it
        // This prevents hydration mismatches
      } else {
        // If initialization script hasn't run yet, wait a bit and try again
        setTimeout(checkInitialization, 10);
      }
    };
    
    checkInitialization();
  }, []);

  const setThemeAndSave = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
    
    // Dispatch custom event for other components to listen to
    window.dispatchEvent(new CustomEvent('themeChange', { 
      detail: { theme: newTheme } 
    }));
  }, [applyTheme]);

  const toggleTheme = useCallback(() => {
    const themes: Theme[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setThemeAndSave(nextTheme);
  }, [theme, setThemeAndSave]);

  const getResolvedTheme = useCallback((): 'light' | 'dark' => {
    if (!mounted) return 'light'; // Default for SSR
    
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  }, [theme, mounted]);

  const getThemeIcon = useCallback(() => {
    switch (theme) {
      case 'light':
        return 'sun';
      case 'dark':
        return 'moon';
      case 'system':
        return 'monitor';
      default:
        return 'sun';
    }
  }, [theme]);

  const getNextTheme = useCallback(() => {
    const themes: Theme[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    return themes[(currentIndex + 1) % themes.length];
  }, [theme]);

  return {
    theme,
    setTheme: setThemeAndSave,
    toggleTheme,
    getResolvedTheme,
    getThemeIcon,
    getNextTheme,
    mounted
  };
}