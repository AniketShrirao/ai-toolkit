import React from 'react';
import { TableOfContents } from '@/components/ui/TableOfContents';
import { TableOfContentsItem } from '@/lib/mdx';
import styles from './MDXLayout.module.scss';

interface MDXLayoutProps {
  children: React.ReactNode;
  frontmatter?: {
    title?: string;
    description?: string;
    category?: string;
    tags?: string[];
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    estimatedReadTime?: number;
    prerequisites?: string[];
    lastModified?: string;
  };
  tableOfContents?: TableOfContentsItem[];
  showTOC?: boolean;
  tocPosition?: 'right' | 'left';
  className?: string;
}

export function MDXLayout({
  children,
  frontmatter,
  tableOfContents = [],
  showTOC = true,
  tocPosition = 'right',
  className
}: MDXLayoutProps) {
  const hasTOC = showTOC && tableOfContents.length > 0;

  return (
    <div className={`${styles.mdxLayout} ${className || ''}`}>
      {/* Page Header */}
      {frontmatter && (
        <header className={styles.pageHeader}>
          {frontmatter.title && (
            <h1 className={styles.pageTitle}>{frontmatter.title}</h1>
          )}
          
          {frontmatter.description && (
            <p className={styles.pageDescription}>{frontmatter.description}</p>
          )}
          
          <div className={styles.pageMeta}>
            {frontmatter.difficulty && (
              <span className={`${styles.badge} ${styles[`badge--${frontmatter.difficulty}`]}`}>
                {frontmatter.difficulty}
              </span>
            )}
            
            {frontmatter.estimatedReadTime && (
              <span className={styles.readTime}>
                {frontmatter.estimatedReadTime} min read
              </span>
            )}
            
            {frontmatter.category && (
              <span className={styles.category}>
                {frontmatter.category}
              </span>
            )}
          </div>
          
          {frontmatter.tags && frontmatter.tags.length > 0 && (
            <div className={styles.tags}>
              {frontmatter.tags.map(tag => (
                <span key={tag} className={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          {frontmatter.prerequisites && frontmatter.prerequisites.length > 0 && (
            <div className={styles.prerequisites}>
              <h4 className={styles.prerequisitesTitle}>Prerequisites:</h4>
              <ul className={styles.prerequisitesList}>
                {frontmatter.prerequisites.map(prereq => (
                  <li key={prereq} className={styles.prerequisite}>
                    {prereq}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </header>
      )}

      {/* Main Content Area */}
      <div className={`${styles.contentWrapper} ${hasTOC ? styles[`contentWrapper--with-toc-${tocPosition}`] : ''}`}>
        {/* Table of Contents - Left Position */}
        {hasTOC && tocPosition === 'left' && (
          <aside className={styles.tocSidebar}>
            <TableOfContents 
              items={tableOfContents}
              sticky={true}
              showNumbers={false}
              collapsible={true}
            />
          </aside>
        )}

        {/* Main Content */}
        <main className={styles.mainContent}>
          <div className={styles.prose}>
            {children}
          </div>
        </main>

        {/* Table of Contents - Right Position */}
        {hasTOC && tocPosition === 'right' && (
          <aside className={styles.tocSidebar}>
            <TableOfContents 
              items={tableOfContents}
              sticky={true}
              showNumbers={false}
              collapsible={true}
            />
          </aside>
        )}
      </div>

      {/* Page Footer */}
      {frontmatter?.lastModified && (
        <footer className={styles.pageFooter}>
          <p className={styles.lastModified}>
            Last updated: {new Date(frontmatter.lastModified).toLocaleDateString()}
          </p>
        </footer>
      )}
    </div>
  );
}