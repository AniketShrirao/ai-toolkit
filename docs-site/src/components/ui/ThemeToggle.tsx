'use client';

import { useThemeContext } from '@/contexts/ThemeContext';
import styles from './ThemeToggle.module.scss';

export default function ThemeToggle() {
  const { theme, toggleTheme, getNextTheme, mounted } = useThemeContext();

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <button className={styles.themeToggle} aria-label="Toggle theme">
        <span className="sr-only">Toggle theme</span>
        <div className={styles.themeIcon}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="5"/>
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
        </div>
      </button>
    );
  }

  return (
    <button 
      className={styles.themeToggle} 
      onClick={toggleTheme}
      aria-label={`Switch to ${getNextTheme()} theme`}
      title={`Current theme: ${theme}. Click to switch to ${getNextTheme()}.`}
    >
      <span className="sr-only">Toggle theme</span>
      <div className={styles.themeIcon}>
        {theme === 'light' && (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="5"/>
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
        )}
        {theme === 'dark' && (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        )}
        {theme === 'system' && (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
        )}
      </div>
      <span className={styles.themeLabel}>{theme}</span>
    </button>
  );
}