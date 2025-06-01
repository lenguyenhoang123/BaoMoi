// Add type declarations for CSS modules
declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

// Add type declarations for CSS files
declare module '*.css' {
  const content: string;
  export default content;
}

// Add type declarations for image files
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.png';
declare module '*.svg';
declare module '*.gif';

// Add type declarations for the line-clamp property
interface CSSProperties {
  'line-clamp'?: number | string;
  '-webkit-line-clamp'?: number | string;
  '-webkit-box-orient'?: 'vertical' | 'horizontal';
}
