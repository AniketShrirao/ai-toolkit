import type { MDXComponents } from 'mdx/types';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => (
      <h1 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-3xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-2xl font-medium mb-3 text-gray-700 dark:text-gray-200">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="mb-4 text-gray-600 dark:text-gray-300 leading-relaxed">
        {children}
      </p>
    ),
    code: ({ children }) => (
      <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono">
        {children}
      </code>
    ),
    pre: ({ children }) => (
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
        {children}
      </pre>
    ),
    ul: ({ children }) => (
      <ul className="list-disc list-inside mb-4 text-gray-600 dark:text-gray-300">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-inside mb-4 text-gray-600 dark:text-gray-300">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="mb-1">{children}</li>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 dark:text-gray-300 mb-4">
        {children}
      </blockquote>
    ),
    ...components,
  };
}