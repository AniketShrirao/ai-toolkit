'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useTheme, Theme } from '@/hooks/useTheme';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  getResolvedTheme: () => 'light' | 'dark';
  getThemeIcon: () => string;
  getNextTheme: () => Theme;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const themeHook = useTheme();

  return (
    <ThemeContext.Provider value={themeHook}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}

// Export the hook for backward compatibility
export { useTheme };