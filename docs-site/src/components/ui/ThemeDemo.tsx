'use client';

import { useThemeContext } from '@/contexts/ThemeContext';
import styles from './ThemeDemo.module.scss';

export default function ThemeDemo() {
  const { theme, getResolvedTheme, mounted } = useThemeContext();

  if (!mounted) {
    return <div className={styles.loading}>Loading theme...</div>;
  }

  return (
    <div className={styles.themeDemo}>
      <h3>Theme Demo</h3>
      <div className={styles.info}>
        <p><strong>Current theme setting:</strong> {theme}</p>
        <p><strong>Resolved theme:</strong> {getResolvedTheme()}</p>
      </div>
      
      <div className={styles.colorSamples}>
        <div className={styles.sample} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
          Primary Background
        </div>
        <div className={styles.sample} style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
          Secondary Background
        </div>
        <div className={styles.sample} style={{ background: 'var(--primary)', color: 'var(--text-inverse)' }}>
          Primary Color
        </div>
      </div>

      <div className={styles.codeExample}>
        <pre>
          <code>
{`// This code block should change colors with theme
function greet(name: string) {
  return \`Hello, \${name}!\`;
}

const message = greet("World");
console.log(message);`}
          </code>
        </pre>
      </div>
    </div>
  );
}