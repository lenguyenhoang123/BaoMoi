declare module 'react-quill' {
  import * as React from 'react';

  interface QuillOptions {
    bounds?: HTMLElement | string;
    debug?: string | boolean;
    formats?: string[];
    modules?: Record<string, any>;
    placeholder?: string;
    readOnly?: boolean;
    scrollingContainer?: HTMLElement | string | null;
    theme?: string;
  }

  interface ReactQuillProps {
    id?: string;
    className?: string;
    style?: React.CSSProperties;
    value?: string | number;
    defaultValue?: string | number;
    readOnly?: boolean;
    placeholder?: string;
    tabIndex?: number;
    bounds?: string | HTMLElement;
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
      previousRange: { index: number; length: number } | null,
      source: string,
      editor: any
    ) => void;
    onKeyPress?: React.KeyboardEventHandler;
    onKeyDown?: React.KeyboardEventHandler;
    onKeyUp?: React.KeyboardEventHandler;
    formats?: string[];
    children?: React.ReactElement;
    modules?: Record<string, any>;
    theme?: string;
    preserveWhitespace?: boolean;
    scrollingContainer?: string | HTMLElement;
  }

  interface UnprivilegedEditor {
    getLength(): number;
    getText(index?: number, length?: number): string;
    getHTML(): string;
    getBounds(index: number, length?: number): any;
    getSelection(focus?: boolean): any;
    getContents(index?: number, length?: number): any;
  }

  const ReactQuill: React.ForwardRefExoticComponent<
    ReactQuillProps & React.RefAttributes<{
      editor: any;
      editingArea: HTMLDivElement | null;
      toolbar: HTMLDivElement | null;
      unprivilegedEditor: UnprivilegedEditor;
    }>
  >;

  export { UnprivilegedEditor };
  export default ReactQuill;
}
