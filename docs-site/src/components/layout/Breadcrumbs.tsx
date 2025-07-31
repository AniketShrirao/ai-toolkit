'use client';

import React from 'react';
import Link from 'next/link';
import { useNavigation } from '@/contexts/NavigationContext';
import styles from './Breadcrumbs.module.scss';

interface BreadcrumbsProps {
  className?: string;
}

export function Breadcrumbs({ className }: BreadcrumbsProps) {
  const { breadcrumbs } = useNavigation();

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className={`${styles.breadcrumbs} ${className || ''}`} aria-label="Breadcrumb">
      <ol className={styles.breadcrumbList}>
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={breadcrumb.path} className={styles.breadcrumbItem}>
            {breadcrumb.active ? (
              <span className={styles.breadcrumbCurrent} aria-current="page">
                {breadcrumb.label}
              </span>
            ) : (
              <Link href={breadcrumb.path} className={styles.breadcrumbLink}>
                {breadcrumb.label}
              </Link>
            )}
            
            {index < breadcrumbs.length - 1 && (
              <svg
                className={styles.breadcrumbSeparator}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}