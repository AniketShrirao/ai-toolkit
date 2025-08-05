import React from 'react';
import Link from 'next/link';
import { MDXComponents } from 'mdx/types';

// Custom components for MDX content
export const mdxComponents: MDXComponents = {
  // Override default HTML elements
  h1: ({ children, id, ...props }) => (
    <h1 id={id} className="docs-heading docs-heading--1" {...props}>
      {children}
      {id && (
        <a href={`#${id}`} className="docs-heading__anchor" aria-label="Link to this heading">
          #
        </a>
      )}
    </h1>
  ),
  
  h2: ({ children, id, ...props }) => (
    <h2 id={id} className="docs-heading docs-heading--2" {...props}>
      {children}
      {id && (
        <a href={`#${id}`} className="docs-heading__anchor" aria-label="Link to this heading">
          #
        </a>
      )}
    </h2>
  ),
  
  h3: ({ children, id, ...props }) => (
    <h3 id={id} className="docs-heading docs-heading--3" {...props}>
      {children}
      {id && (
        <a href={`#${id}`} className="docs-heading__anchor" aria-label="Link to this heading">
          #
        </a>
      )}
    </h3>
  ),
  
  h4: ({ children, id, ...props }) => (
    <h4 id={id} className="docs-heading docs-heading--4" {...props}>
      {children}
      {id && (
        <a href={`#${id}`} className="docs-heading__anchor" aria-label="Link to this heading">
          #
        </a>
      )}
    </h4>
  ),
  
  h5: ({ children, id, ...props }) => (
    <h5 id={id} className="docs-heading docs-heading--5" {...props}>
      {children}
      {id && (
        <a href={`#${id}`} className="docs-heading__anchor" aria-label="Link to this heading">
          #
        </a>
      )}
    </h5>
  ),
  
  h6: ({ children, id, ...props }) => (
    <h6 id={id} className="docs-heading docs-heading--6" {...props}>
      {children}
      {id && (
        <a href={`#${id}`} className="docs-heading__anchor" aria-label="Link to this heading">
          #
        </a>
      )}
    </h6>
  ),
  
  p: ({ children, ...props }) => (
    <p className="docs-paragraph" {...props}>
      {children}
    </p>
  ),
  
  a: ({ href, children, ...props }) => {
    // Internal links
    if (href?.startsWith('/') || href?.startsWith('#')) {
      return (
        <Link href={href} className="docs-link" {...props}>
          {children}
        </Link>
      );
    }
    
    // External links
    return (
      <a 
        href={href} 
        className="docs-link docs-link--external" 
        target="_blank" 
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    );
  },
  
  code: ({ children, className, ...props }) => {
    const isInline = !className;
    
    if (isInline) {
      return (
        <code className="docs-code docs-code--inline" {...props}>
          {children}
        </code>
      );
    }
    
    return (
      <code className={`docs-code ${className || ''}`} {...props}>
        {children}
      </code>
    );
  },
  
  pre: ({ children, ...props }) => (
    <pre className="docs-pre" {...props}>
      {children}
    </pre>
  ),
  
  blockquote: ({ children, ...props }) => (
    <blockquote className="docs-blockquote" {...props}>
      {children}
    </blockquote>
  ),
  
  ul: ({ children, ...props }) => (
    <ul className="docs-list docs-list--unordered" {...props}>
      {children}
    </ul>
  ),
  
  ol: ({ children, ...props }) => (
    <ol className="docs-list docs-list--ordered" {...props}>
      {children}
    </ol>
  ),
  
  li: ({ children, ...props }) => (
    <li className="docs-list__item" {...props}>
      {children}
    </li>
  ),
  
  table: ({ children, ...props }) => (
    <div className="docs-table-wrapper">
      <table className="docs-table" {...props}>
        {children}
      </table>
    </div>
  ),
  
  thead: ({ children, ...props }) => (
    <thead className="docs-table__head" {...props}>
      {children}
    </thead>
  ),
  
  tbody: ({ children, ...props }) => (
    <tbody className="docs-table__body" {...props}>
      {children}
    </tbody>
  ),
  
  tr: ({ children, ...props }) => (
    <tr className="docs-table__row" {...props}>
      {children}
    </tr>
  ),
  
  th: ({ children, ...props }) => (
    <th className="docs-table__header" {...props}>
      {children}
    </th>
  ),
  
  td: ({ children, ...props }) => (
    <td className="docs-table__cell" {...props}>
      {children}
    </td>
  ),
  
  hr: (props) => (
    <hr className="docs-divider" {...props} />
  ),
  
  img: ({ src, alt, ...props }) => (
    <img 
      src={src} 
      alt={alt} 
      className="docs-image" 
      loading="lazy"
      {...props} 
    />
  ),
};

// Custom documentation components
export const Callout: React.FC<{
  type?: 'info' | 'warning' | 'error' | 'success';
  title?: string;
  children: React.ReactNode;
}> = ({ type = 'info', title, children }) => (
  <div className={`docs-callout docs-callout--${type}`}>
    {title && <div className="docs-callout__title">{title}</div>}
    <div className="docs-callout__content">{children}</div>
  </div>
);

export const CodeBlock: React.FC<{
  language?: string;
  title?: string;
  children: React.ReactNode;
  showLineNumbers?: boolean;
  downloadable?: boolean;
}> = ({ language, title, children, showLineNumbers = false, downloadable = false }) => (
  <div className={`docs-code-block ${downloadable ? 'downloadable' : ''}`}>
    {title && (
      <div className="docs-code-block__title">
        <span className="docs-code-block__language">{language || 'text'}</span>
        <div className="docs-code-block__actions">
          <button className="docs-code-block__copy" onClick={() => navigator.clipboard.writeText(String(children))}>
            Copy
          </button>
        </div>
      </div>
    )}
    <pre className={`docs-code-block__pre ${showLineNumbers ? 'docs-code-block__pre--line-numbers' : ''}`}>
      <code className={language ? `language-${language}` : ''}>{children}</code>
    </pre>
  </div>
);

export const Tabs: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [activeTab, setActiveTab] = React.useState(0);
  const tabItems = React.Children.toArray(children);

  return (
    <div className="docs-tabs">
      <div className="docs-tabs__list">
        {tabItems.map((_, index) => (
          <button
            key={index}
            className={`docs-tabs__tab ${index === activeTab ? 'docs-tabs__tab--active' : ''}`}
            onClick={() => setActiveTab(index)}
          >
            Tab {index + 1}
          </button>
        ))}
      </div>
      {tabItems.map((child, index) => (
        <div
          key={index}
          className={`docs-tabs__panel ${index === activeTab ? 'docs-tabs__panel--active' : ''}`}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

export const TabItem: React.FC<{
  label: string;
  children: React.ReactNode;
}> = ({ label, children }) => (
  <div className="docs-tab-item" data-label={label}>
    {children}
  </div>
);

export const ApiEndpoint: React.FC<{
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description?: string;
}> = ({ method, path, description }) => (
  <div className="docs-api-endpoint">
    <div className="docs-api-endpoint__header">
      <span className={`docs-api-endpoint__method docs-api-endpoint__method--${method.toLowerCase()}`}>
        {method}
      </span>
      <code className="docs-api-endpoint__path">{path}</code>
    </div>
    {description && (
      <p className="docs-api-endpoint__description">{description}</p>
    )}
  </div>
);

// Tutorial-specific components
export const TutorialStep: React.FC<{
  step: number;
  title: string;
  children: React.ReactNode;
}> = ({ step, title, children }) => (
  <div className="tutorial-step">
    <div className="tutorial-step__header">
      <div className="tutorial-step__number">{step}</div>
      <h3 className="tutorial-step__title">{title}</h3>
    </div>
    <div className="tutorial-step__content">{children}</div>
  </div>
);

export const RequirementsList: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => (
  <div className="requirements-list">
    <div className="requirements-list__header">System Requirements</div>
    <div className="requirements-list__items">{children}</div>
  </div>
);

export const Requirement: React.FC<{
  title: string;
  version: string;
  required: boolean;
  description: string;
}> = ({ title, version, required, description }) => (
  <div className="requirement-item">
    <div className={`requirement-item__status requirement-item__status--${required ? 'required' : 'optional'}`} />
    <div className="requirement-item__content">
      <div className="requirement-item__title">{title}</div>
      <div className="requirement-item__version">{version}</div>
      <p className="requirement-item__description">{description}</p>
    </div>
  </div>
);

export const PlatformGuide: React.FC<{
  platform: 'windows' | 'macos' | 'linux' | 'linux-rhel';
  children: React.ReactNode;
}> = ({ platform, children }) => (
  <div className="platform-guide">
    <div className={`platform-guide__header platform-guide__header--${platform}`}>
      <div className="platform-guide__icon">
        {platform === 'windows' && '⊞'}
        {platform === 'macos' && ''}
        {(platform === 'linux' || platform === 'linux-rhel') && '🐧'}
      </div>
      <h4 className="platform-guide__title">
        {platform === 'windows' && 'Windows'}
        {platform === 'macos' && 'macOS'}
        {platform === 'linux' && 'Linux (Ubuntu/Debian)'}
        {platform === 'linux-rhel' && 'Linux (CentOS/RHEL/Fedora)'}
      </h4>
    </div>
    <div className="platform-guide__content">{children}</div>
  </div>
);

export const InstallationSteps: React.FC<{
  method: 'quick' | 'manual' | 'docker';
  children: React.ReactNode;
}> = ({ method, children }) => (
  <div className="installation-steps">
    <div className="installation-steps__method">
      {method === 'quick' && 'Quick Installation'}
      {method === 'manual' && 'Manual Installation'}
      {method === 'docker' && 'Docker Installation'}
    </div>
    {children}
  </div>
);

export const VerificationSteps: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => (
  <div className="verification-steps">
    <div className="verification-steps__title">Verification</div>
    <div className="verification-steps__content">{children}</div>
  </div>
);

export const NextStepsGrid: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => (
  <div className="next-steps-grid">{children}</div>
);

export const NextStep: React.FC<{
  title: string;
  href: string;
  description: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}> = ({ title, href, description, difficulty }) => (
  <a href={href} className="next-step-card">
    <div className="next-step-card__title">{title}</div>
    <div className="next-step-card__description">{description}</div>
    <div className="next-step-card__meta">
      {difficulty && (
        <span className={`next-step-card__difficulty next-step-card__difficulty--${difficulty}`}>
          {difficulty}
        </span>
      )}
      <span className="next-step-card__arrow">→</span>
    </div>
  </a>
);

export const TroubleshootingSection: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => (
  <div className="troubleshooting-section">
    <div className="troubleshooting-section__title">Troubleshooting</div>
    {children}
  </div>
);

export const Issue: React.FC<{
  title: string;
  description: string;
}> = ({ title, description }) => (
  <div className="troubleshooting-issue">
    <div className="troubleshooting-issue__title">{title}</div>
    <p className="troubleshooting-issue__description">{description}</p>
  </div>
);

export const TestingChecklist: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => (
  <div className="testing-checklist">
    <div className="testing-checklist__header">Testing Checklist</div>
    <div className="testing-checklist__items">{children}</div>
  </div>
);

export const PerformanceTips: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => (
  <div className="performance-tips">
    <div className="performance-tips__title">Performance Tips</div>
    <div className="performance-tips__content">{children}</div>
  </div>
);

// Add custom components to MDX components
export const customMDXComponents: MDXComponents = {
  ...mdxComponents,
  Callout,
  CodeBlock,
  Tabs,
  TabItem,
  ApiEndpoint,
  TutorialStep,
  RequirementsList,
  Requirement,
  PlatformGuide,
  InstallationSteps,
  VerificationSteps,
  NextStepsGrid,
  NextStep,
  TroubleshootingSection,
  Issue,
  TestingChecklist,
  PerformanceTips,
};