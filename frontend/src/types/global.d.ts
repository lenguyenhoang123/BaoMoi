// Type definitions for global objects and modules
// This file contains type declarations for global objects and modules

// Import types from dependencies
import { ReactNode, ReactElement, ComponentType, FC, SVGProps } from 'react';
import { NextPage } from 'next';
import { AppProps } from 'next/app';

// ----------------------------------------------------------------------
// Asset Modules
// ----------------------------------------------------------------------


// CSS Modules
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.module.sass' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

// CSS files
declare module '*.css' {
  const content: string;
  export default content;
}

// Image files
declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

// SVG files
declare module '*.svg' {
  import React = require('react');
  export const ReactComponent: FC<SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

// Font files
declare module '*.woff' {
  const content: string;
  export default content;
}

declare module '*.woff2' {
  const content: string;
  export default content;
}

declare module '*.ttf' {
  const content: string;
  export default content;
}

declare module '*.eot' {
  const content: string;
  export default content;
}

// Web worker files
declare module '*.worker.ts' {
  class WebpackWorker extends Worker {
    constructor();
  }
  export default WebpackWorker;
}

// ----------------------------------------------------------------------
// Third-party Libraries
// ----------------------------------------------------------------------


// Next.js Image component
declare module 'next/image' {
  interface StaticImageData {
    src: string;
    height: number;
    width: number;
    blurDataURL?: string;
    placeholder?: 'blur' | 'empty';
    blurWidth?: number;
    blurHeight?: number;
  }
  
  const Image: FC<{
    src: string | StaticImageData;
    alt: string;
    width?: number | string;
    height?: number | string;
    layout?: 'fill' | 'fixed' | 'intrinsic' | 'responsive';
    objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
    objectPosition?: string;
    priority?: boolean;
    loading?: 'eager' | 'lazy';
    lazyBoundary?: string;
    unoptimized?: boolean;
    quality?: number | string;
    placeholder?: 'blur' | 'empty';
    blurDataURL?: string;
    onLoadingComplete?: (result: {
      naturalWidth: number;
      naturalHeight: number;
    }) => void;
    onError?: (error: Error) => void;
    className?: string;
    style?: React.CSSProperties;
  }>;
  
  export default Image;
}

// React Quill
declare module 'react-quill' {
  import { ComponentType } from 'react';
  
  interface ReactQuillProps {
    value?: string;
    defaultValue?: string;
    readOnly?: boolean;
    placeholder?: string;
    onChange?: (
      content: string,
      delta: any,
      source: string,
      editor: any
    ) => void;
    onChangeSelection?: (
      range: { index: number; length: number } | null,
      source: string,
      editor: any
    ) => void;
    onFocus?: (
      range: { index: number; length: number } | null,
      source: string,
      editor: any
    ) => void;
    onBlur?: (
      previousSelection: { index: number; length: number } | null,
      source: string,
      editor: any
    ) => void;
    onKeyPress?: (event: React.KeyboardEvent) => void;
    onKeyDown?: (event: React.KeyboardEvent) => void;
    onKeyUp?: (event: React.KeyboardEvent) => void;
    className?: string;
    theme?: string;
    style?: React.CSSProperties;
    formats?: string[];
    children?: ReactNode;
    bounds?: string | HTMLElement;
    scrollingContainer?: string | HTMLElement;
    modules?: Record<string, any>;
    preserveWhitespace?: boolean;
    tabIndex?: number;
    id?: string;
  }
  
  const ReactQuill: ComponentType<ReactQuillProps>;
  
  export { ReactQuillProps };
  export default ReactQuill;
}

// React Syntax Highlighter
declare module 'react-syntax-highlighter' {
  import { CSSProperties, FC } from 'react';
  
  interface SyntaxHighlighterProps {
    language?: string;
    style?: any;
    children?: string;
    customStyle?: CSSProperties;
    codeTagProps?: {
      style?: CSSProperties;
      [key: string]: any;
    };
    useInlineStyles?: boolean;
    showLineNumbers?: boolean;
    showInlineLineNumbers?: boolean;
    startingLineNumber?: number;
    lineNumberContainerStyle?: CSSProperties;
    wrapLines?: boolean;
    wrapLongLines?: boolean;
    lineProps?: any;
    [key: string]: any;
  }
  
  const Prism: FC<SyntaxHighlighterProps>;
  
  export { SyntaxHighlighterProps };
  export { Prism };
  export * from 'react-syntax-highlighter';
}

// Lucide Icons
declare module 'lucide-react' {
  import { LucideProps } from 'lucide-react';
  
  export const Plus: FC<LucideProps>;
  export const FileText: FC<LucideProps>;
  export const Settings: FC<LucideProps>;
  export const Users: FC<LucideProps>;
  export const LogOut: FC<LucideProps>;
  export const User: FC<LucideProps>;
  export const Clock: FC<LucideProps>;
  
  // Add more Lucide icons as needed
  
  export interface LucideIcon extends FC<LucideProps> {}
  
  export const createLucideIcon: (
    displayName: string,
    iconNode: any[],
  ) => LucideIcon;
}

// ----------------------------------------------------------------------
// Global Type Definitions
// ----------------------------------------------------------------------

declare global {
  // Extend React types
  namespace React {
    // Allow CSS custom properties in React.CSSProperties
    interface CSSProperties {
      [key: `--${string}`]: string | number | undefined;
      'line-clamp'?: number | string;
      '-webkit-line-clamp'?: number | string;
      '-webkit-box-orient'?: 'vertical' | 'horizontal';
      '--line-clamp'?: number;
    }
    
    // Extend HTML attributes to allow data-* and aria-* props
    interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
      [key: string]: any;
    }
  }

  // Next.js extensions
  type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
    getLayout?: (page: ReactElement) => ReactNode;
    layout?: ComponentType<{ children: ReactNode }>;
  };

  type AppPropsWithLayout = AppProps & {
    Component: NextPageWithLayout;
  };
  
  // Environment variables (complementing next-env.d.ts)
  namespace NodeJS {
    interface ProcessEnv {
      // Add any additional environment variables here
      // that should be available in the browser
      NEXT_PUBLIC_APP_NAME?: string;
      NEXT_PUBLIC_APP_VERSION?: string;
    }
  }
  
  // Global utility types
  type Nullable<T> = T | null;
  type Optional<T> = T | undefined;
  type Maybe<T> = T | null | undefined;
  
  type ValueOf<T> = T[keyof T];
  type DeepPartial<T> = T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>;
  } : T;
  
  type OmitStrict<T, K extends keyof T> = Omit<T, K>;
  type PickRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
  
  // Utility types for React components
  type FCWithChildren<P = {}> = FC<React.PropsWithChildren<P>>;
  type FCWithClassName<P = {}> = FC<P & { className?: string }>;
  
  // Common API response types
  interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    code?: string | number;
    meta?: {
      page?: number;
      limit?: number;
      total?: number;
      totalPages?: number;
    };
  }
  
  interface PaginatedResponse<T> extends ApiResponse<T[]> {
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }
  
  // Common form types
  interface FormErrors {
    [key: string]: string | string[] | FormErrors | FormErrors[];
  }
  
  // Common query params
  interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }
  
  interface SearchParams extends PaginationParams {
    query?: string;
    [key: string]: any;
  }
  
  // Common UI types
  type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  type ThemeMode = 'light' | 'dark' | 'system';
  
  // Extend Window interface with any global browser APIs or third-party libraries
  interface Window {
    // Google Analytics
    gtag?: (...args: any[]) => void;
    
    // Any other global browser APIs or third-party libraries
    [key: string]: any;
  }
}

// This export is needed for TypeScript to treat this file as a module
export {};
