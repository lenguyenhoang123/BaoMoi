'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

// Disable SSR for the editor to prevent hydration issues
const DynamicEditor = dynamic(
  () => import('@tiptap/react').then((mod) => mod.EditorContent),
  { 
    ssr: false,
    loading: () => (
      <div className="prose max-w-none min-h-[300px] p-4 border rounded-md">
        Đang tải trình soạn thảo...
      </div>
    )
  }
);

interface TipTapEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const TipTapEditor = ({
  value,
  onChange,
  placeholder = 'Nhập nội dung...',
  className = '',
}: TipTapEditorProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const firstRender = useRef(true);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: `prose max-w-none focus:outline-none min-h-[300px] p-4 ${className}`,
      },
    },
    autofocus: false,
    injectCSS: true,
    enablePasteRules: true,
    enableInputRules: true,
    enableCoreExtensions: true,
  });

  // Update content when value prop changes
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  // Handle SSR
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !editor) {
    return (
      <div className={`border rounded p-4 min-h-[300px] ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <MenuBar editor={editor} />
      <DynamicEditor
        editor={editor}
        className="border-t border-gray-200"
      />
    </div>
  );
};

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="border-b p-2 flex flex-wrap gap-1">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1 rounded ${
          editor.isActive('bold') ? 'bg-gray-200' : 'hover:bg-gray-100'
        }`}
        title="In đậm (Ctrl+B)"
      >
        <span className="font-bold">B</span>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1 rounded ${
          editor.isActive('italic') ? 'bg-gray-200' : 'hover:bg-gray-100'
        }`}
        title="In nghiêng (Ctrl+I)"
      >
        <em>I</em>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-1 rounded ${
          editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : 'hover:bg-gray-100'
        }`}
        title="Tiêu đề 2"
      >
        H2
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1 rounded ${
          editor.isActive('bulletList') ? 'bg-gray-200' : 'hover:bg-gray-100'
        }`}
        title="Danh sách không thứ tự"
      >
        •
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1 rounded ${
          editor.isActive('orderedList') ? 'bg-gray-200' : 'hover:bg-gray-100'
        }`}
        title="Danh sách có thứ tự"
      >
        1.
      </button>
      <button
        onClick={() => {
          const url = window.prompt('Nhập URL ảnh:');
          if (url) {
            editor.chain().focus().setImage({ src: url }).run();
          }
        }}
        className="p-1 rounded hover:bg-gray-100"
        title="Chèn ảnh"
      >
        🖼️
      </button>
      <button
        onClick={() => {
          const previousUrl = editor.getAttributes('link').href;
          const url = window.prompt('Nhập URL liên kết:', previousUrl);

          // Xóa liên kết nếu URL rỗng
          if (url === null) {
            return;
          }

          if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
          }

          // Thêm liên kết
          editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        }}
        className={`p-1 rounded ${
          editor.isActive('link') ? 'bg-gray-200' : 'hover:bg-gray-100'
        }`}
        title="Thêm liên kết (Ctrl+K)"
      >
        🔗
      </button>
    </div>
  );
};

export default TipTapEditor;
