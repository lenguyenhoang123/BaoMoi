declare module 'react-quill' {
  import * as React from 'react';

  interface ReactQuillProps {
    value?: string;
    defaultValue?: string;
    readOnly?: boolean;
    placeholder?: string;
    tabIndex?: number;
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
    style?: React.CSSProperties;
    className?: string;
    theme?: string;
    modules?: Record<string, any>;
    formats?: string[];
    bounds?: string | HTMLElement;
    children?: React.ReactElement;
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
