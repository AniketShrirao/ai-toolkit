# Documentation Site Directory Structure

This document outlines the directory structure for the comprehensive documentation site.

## Content Directory (`/content`)

The content directory contains all documentation content organized by topic:

```
content/
├── getting-started/          # Installation, setup, and quick start guides
├── guides/                   # Comprehensive guides organized by topic
│   ├── ai-integration/       # AI-specific integration guides
│   ├── deployment/           # Deployment guides
│   ├── document-processing/  # Document processing workflows
│   └── web-dashboard/        # Web dashboard usage guides
├── api-reference/            # API documentation
│   ├── rest-api/            # REST API endpoints
│   ├── websocket-api/       # WebSocket API documentation
│   └── package-apis/        # Package-specific API docs
├── tutorials/               # Step-by-step tutorials
│   ├── basic-workflows/     # Basic usage tutorials
│   ├── advanced-integration/ # Advanced integration tutorials
│   └── custom-development/  # Custom development tutorials
├── packages/                # Package-specific documentation
├── dashboard/               # Web dashboard user guides
├── ai/                      # AI-specific documentation
├── deployment/              # Deployment and configuration docs
├── development/             # Development and contribution guides
├── security/                # Security documentation
└── resources/               # Additional resources
    ├── troubleshooting/     # Troubleshooting guides
    ├── best-practices/      # Best practices documentation
    └── community/           # Community resources
```

## Components Directory (`/src/components`)

The components directory contains all React components organized by type:

```
src/components/
├── layout/                  # Layout components
│   ├── DocumentationLayout.tsx
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   └── Breadcrumbs.tsx
├── interactive/             # Interactive components
│   ├── api-explorer/        # API testing interface
│   ├── code-examples/       # Live code examples
│   └── tutorials/           # Interactive tutorial components
└── ui/                      # Reusable UI components
    ├── content/             # Content-specific UI components
    ├── navigation/          # Navigation components
    └── search/              # Search interface components
```

## Styles Directory (`/src/styles`)

The styles directory contains all SCSS/CSS files organized by scope:

```
src/styles/
├── globals/                 # Global styles and variables
├── components/              # Component-specific styles
│   ├── layout/             # Layout component styles
│   ├── interactive/        # Interactive component styles
│   └── ui/                 # UI component styles
└── pages/                   # Page-specific styles
    ├── getting-started/     # Getting started page styles
    ├── guides/             # Guide page styles
    └── api-reference/      # API reference page styles
```

## Public Directory (`/public`)

The public directory contains static assets:

```
public/
├── assets/                  # Static assets (images, icons, etc.)
├── examples/                # Example files and code samples
└── downloads/               # Downloadable resources
```

## Key Features

- **Modular Structure**: Each section is clearly separated for easy maintenance
- **Scalable Organization**: Easy to add new content types and components
- **Clear Separation**: Content, components, and styles are logically separated
- **Consistent Naming**: Following Next.js and React best practices
- **Future-Proof**: Structure supports planned features like search, interactive examples, and API documentation

## Usage Guidelines

1. **Content Files**: Use MDX format for rich, interactive content
2. **Components**: Follow React best practices with TypeScript
3. **Styles**: Use SCSS modules for component-specific styles
4. **Assets**: Place all static files in the appropriate public subdirectories

This structure supports the comprehensive documentation requirements outlined in the design document and provides a solid foundation for future enhancements.