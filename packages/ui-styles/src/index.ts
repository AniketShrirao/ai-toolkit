// AI Toolkit UI Styles Package
// TypeScript definitions and utilities

export interface DesignTokens {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  spacing: {
    [key: string]: string;
  };
  typography: {
    fontFamily: {
      base: string;
      mono: string;
    };
    fontSize: {
      [key: string]: string;
    };
    fontWeight: {
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
  };
  breakpoints: {
    [key: string]: string;
  };
}

// Export design tokens for JavaScript usage
export const designTokens: DesignTokens = {
  colors: {
    primary: '#3b82f6',
    secondary: '#6b7280',
    success: '#059669',
    warning: '#d97706',
    error: '#dc2626',
    info: '#3b82f6',
  },
  spacing: {
    '0': '0',
    '1': '0.25rem',
    '2': '0.5rem',
    '3': '0.75rem',
    '4': '1rem',
    '5': '1.25rem',
    '6': '1.5rem',
    '8': '2rem',
    '10': '2.5rem',
    '12': '3rem',
    '16': '4rem',
    '20': '5rem',
    '24': '6rem',
    '32': '8rem',
  },
  typography: {
    fontFamily: {
      base: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
      mono: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
};

// Utility functions for JavaScript usage
export const getSpacing = (key: string): string => {
  return designTokens.spacing[key] || '0';
};

export const getFontSize = (key: string): string => {
  return designTokens.typography.fontSize[key] || '1rem';
};

export const getBreakpoint = (key: string): string => {
  return designTokens.breakpoints[key] || '0px';
};

// CSS Custom Properties helper
export const setCSSCustomProperties = (element: HTMLElement = document.documentElement): void => {
  // Set color custom properties
  Object.entries(designTokens.colors).forEach(([key, value]) => {
    element.style.setProperty(`--color-${key}`, value);
  });

  // Set spacing custom properties
  Object.entries(designTokens.spacing).forEach(([key, value]) => {
    element.style.setProperty(`--spacing-${key}`, value);
  });

  // Set typography custom properties
  element.style.setProperty('--font-family-base', designTokens.typography.fontFamily.base);
  element.style.setProperty('--font-family-mono', designTokens.typography.fontFamily.mono);

  Object.entries(designTokens.typography.fontSize).forEach(([key, value]) => {
    element.style.setProperty(`--font-size-${key}`, value);
  });

  Object.entries(designTokens.typography.fontWeight).forEach(([key, value]) => {
    element.style.setProperty(`--font-weight-${key}`, value.toString());
  });
};

export default designTokens;