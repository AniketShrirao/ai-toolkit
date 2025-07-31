# AI Toolkit Documentation Site

This is the comprehensive documentation site for the AI Toolkit, built with Next.js, MDX, and TypeScript.

## Features

- 📝 **MDX Support**: Write documentation with Markdown and React components
- 🎨 **Tailwind CSS**: Modern styling with utility-first CSS framework
- 🔍 **Syntax Highlighting**: Code blocks with syntax highlighting
- 📱 **Responsive Design**: Mobile-first responsive layout
- 🚀 **Static Export**: Optimized for static hosting
- 🔧 **TypeScript**: Full type safety throughout the application

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the docs-site directory
3. Install dependencies:

```bash
npm install
```

4. Start the development server:

```bash
npm run dev
```

5. Open [http://localhost:9898](http://localhost:9898) in your browser

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build the application for production
- `npm run build:static` - Build and export static files
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run serve` - Serve the static build locally
- `npm run clean` - Clean build artifacts

## Project Structure

```
docs-site/
├── content/                 # MDX content files
│   ├── getting-started/
│   ├── api-reference/
│   ├── packages/
│   ├── deployment/
│   ├── dashboard/
│   ├── ai/
│   ├── security/
│   └── development/
├── src/
│   ├── app/                # Next.js app directory
│   ├── components/         # React components
│   │   ├── layout/        # Layout components
│   │   ├── interactive/   # Interactive components
│   │   └── ui/           # UI components
│   ├── contexts/          # React contexts
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Utility functions
│   ├── styles/           # Styling files
│   └── types/            # TypeScript type definitions
├── public/               # Static assets
└── out/                 # Static export output (generated)
```

## Deployment

### Static Hosting

The site is configured for static export and can be deployed to any static hosting service:

```bash
npm run build:static
```

This generates static files in the `out` directory.

### Docker

Build and run with Docker:

```bash
# Build the image
docker build -t ai-toolkit-docs .

# Run the container
docker run -p 9898:80 ai-toolkit-docs
```

Or use docker-compose:

```bash
# Production
docker-compose up

# Development
docker-compose --profile dev up docs-dev
```

### GitHub Actions

The repository includes a GitHub Actions workflow for automated deployment. Configure the following secrets in your repository:

- `SITE_URL` - Your site's URL
- `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` (if using Netlify)
- `VERCEL_TOKEN`, `ORG_ID`, and `PROJECT_ID` (if using Vercel)

## Configuration

### Environment Variables

Copy `.env.local.example` to `.env.local` and configure:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:9898
NEXT_PUBLIC_SITE_NAME=AI Toolkit Documentation
```

### MDX Components

Custom MDX components are configured in `mdx-components.tsx`. You can customize the styling and behavior of Markdown elements.

## Contributing

1. Create content in the appropriate `content/` subdirectory
2. Use MDX format for rich content with React components
3. Follow the existing file structure and naming conventions
4. Test your changes locally before submitting

## License

This documentation site is part of the AI Toolkit project.