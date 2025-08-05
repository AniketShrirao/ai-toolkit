import type { NextConfig } from "next";
import createMDX from '@next/mdx';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import remarkToc from 'remark-toc';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
  experimental: {
    mdxRs: false,
  },
  sassOptions: {
    includePaths: ['./src/styles', './node_modules', '../packages/ui-styles/scss'],
    additionalData: `
      @use "sass:map";
      @use "../packages/ui-styles/scss/abstracts/variables" as *;
      @use "../packages/ui-styles/scss/abstracts/functions" as *;
      @use "../packages/ui-styles/scss/abstracts/mixins" as *;
      @use "./src/styles/design-system/variables" as doc-vars;
      @use "./src/styles/design-system/functions" as doc-funcs;
      @use "./src/styles/design-system/mixins" as doc-mixins;
    `,
  },
};

const withMDX = createMDX({
  options: {
    remarkPlugins: [
      remarkGfm,
      remarkFrontmatter,
      [remarkToc, { 
        heading: 'table of contents|toc',
        maxDepth: 4,
        tight: true 
      }],
    ],
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, {
        behavior: 'wrap',
        properties: {
          className: ['docs-heading__anchor'],
          ariaLabel: 'Link to this heading',
        },
      }],
      [rehypeHighlight, {
        detect: true,
        ignoreMissing: true,
      }],
    ],
  },
});

export default withMDX(nextConfig);
