// Theme initialization script to prevent FOUC and hydration mismatches
// This runs before React hydration to ensure consistent theme state

export const themeInitScript = `
(function() {
  try {
    const root = document.documentElement;
    
    // Function to apply theme consistently
    function applyTheme(theme) {
      // Clear any existing theme attributes first
      root.removeAttribute('data-theme');
      root.removeAttribute('data-resolved-theme');
      
      if (theme === 'system') {
        // Don't set data-theme for system preference
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.setAttribute('data-resolved-theme', systemPrefersDark ? 'dark' : 'light');
      } else {
        // Set both attributes for explicit themes
        root.setAttribute('data-theme', theme);
        root.setAttribute('data-resolved-theme', theme);
      }
    }
    
    // Get saved theme from localStorage, with fallback to system
    let savedTheme;
    try {
      savedTheme = localStorage.getItem('theme');
    } catch (e) {
      // localStorage might not be available (e.g., in some SSR contexts)
      savedTheme = null;
    }
    
    const theme = savedTheme || 'system';
    
    // Apply theme immediately to prevent FOUC
    applyTheme(theme);
    
    // Set up system theme change listener for system theme
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      function handleSystemThemeChange(e) {
        const currentTheme = localStorage.getItem('theme');
        if (currentTheme === 'system' || !currentTheme) {
          root.setAttribute('data-resolved-theme', e.matches ? 'dark' : 'light');
        }
      }
      
      // Use both addEventListener and addListener for broader compatibility
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleSystemThemeChange);
      } else if (mediaQuery.addListener) {
        mediaQuery.addListener(handleSystemThemeChange);
      }
    }
    
    // Mark that theme initialization is complete
    root.setAttribute('data-theme-initialized', 'true');
    
  } catch (error) {
    // Fallback to light theme if anything goes wrong
    console.warn('Theme initialization failed:', error);
    try {
      document.documentElement.setAttribute('data-resolved-theme', 'light');
      document.documentElement.setAttribute('data-theme-initialized', 'true');
    } catch (fallbackError) {
      console.error('Theme fallback failed:', fallbackError);
    }
  }
})();
`;

export const getThemeInitScript = () => themeInitScript;