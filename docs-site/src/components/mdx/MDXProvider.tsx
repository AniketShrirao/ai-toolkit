import React from 'react';
import { MDXProvider as BaseMDXProvider } from '@mdx-js/react';
import { customMDXComponents } from './MDXComponents';

interface MDXProviderProps {
  children: React.ReactNode;
}

export const MDXProvider: React.FC<MDXProviderProps> = ({ children }) => {
  return (
    <BaseMDXProvider components={customMDXComponents}>
      {children}
    </BaseMDXProvider>
  );
};