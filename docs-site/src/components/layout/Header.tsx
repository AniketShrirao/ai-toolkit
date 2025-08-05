'use client';

import React from 'react';
import Link from 'next/link';
import { useNavigation } from '@/contexts/NavigationContext';
import ThemeToggle from '@/components/ui/ThemeToggle';
import styles from './Header.module.scss';

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const { toggleNavigation, isMobile } = useNavigation();

  return (
    <header className={`${styles.header} ${className || ''}`}>
      <div className={styles.container}>
        {/* Mobile menu button */}
        {isMobile && (
          <button
            className={styles.menuButton}
            onClick={toggleNavigation}
            aria-label="Toggle navigation menu"
            type="button"
            data-menu-button
          >
            <svg
              className={styles.menuIcon}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        )}

        {/* Logo and title */}
        <div className={styles.brand}>
          <Link href="/" className={styles.brandLink}>
            <div className={styles.logo}>
              <svg
                className={styles.logoIcon}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L2 7L12 12L22 7L12 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 17L12 22L22 17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 12L12 17L22 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className={styles.brandText}>AI Toolkit</span>
          </Link>
        </div>

        {/* Navigation links (desktop) */}
        <nav className={styles.nav}>
          <Link href="/getting-started" className={styles.navLink}>
            Getting Started
          </Link>
          <Link href="/api-reference" className={styles.navLink}>
            API Reference
          </Link>
          <Link href="/guides" className={styles.navLink}>
            Guides
          </Link>
          <Link href="/packages" className={styles.navLink}>
            Packages
          </Link>
        </nav>

        {/* Search and actions */}
        <div className={styles.actions}>
          {/* Search button */}
          <button
            className={styles.searchButton}
            aria-label="Search documentation"
            type="button"
          >
            <svg
              className={styles.searchIcon}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21L16.514 16.506L21 21ZM18 10.5A7.5 7.5 0 1110.5 3A7.5 7.5 0 0118 10.5V10.5Z"
              />
            </svg>
          </button>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* GitHub link */}
          <a
            href="https://github.com/your-org/ai-toolkit"
            className={styles.githubLink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View on GitHub"
          >
            <svg
              className={styles.githubIcon}
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
        </div>
      </div>
    </header>
  );
}