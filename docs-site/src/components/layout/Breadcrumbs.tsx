'use client';

import React from 'react';
import { useNavigation } from '@/contexts/NavigationContext';
import { BreadcrumbNavigation } from '@/components/ui/navigation';
import styles from './Breadcrumbs.module.scss';

interface BreadcrumbsProps {
  className?: string;
}

export function Breadcrumbs({ className }: BreadcrumbsProps) {
  const { breadcrumbs } = useNavigation();

  return (
    <BreadcrumbNavigation 
      breadcrumbs={breadcrumbs}
      className={`${styles.breadcrumbs} ${className || ''}`}
      showHome={true}
      maxItems={5}
    />
  );
}