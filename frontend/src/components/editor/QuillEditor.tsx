'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

// Tùy chỉnh CSS cho ReactQuill
import 'react-quill/dist/quill.snow.css';

// Tải ReactQuill một cách động để tránh lỗi SSR
const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => (
    <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      Đang tải trình soạn thảo...
    </div>
  ),
});

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
}

const QuillEditor = ({
  value,
  onChange,
  placeholder = 'Nhập nội dung...',
  readOnly = false,
  className = '',
}: QuillEditorProps) => {
  const [mounted, setMounted] = useState(false);
  const quillRef = useRef<any>(null);

  // Đảm bảo component đã được mount trước khi render ReactQuill
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Cấu hình các module cho thanh công cụ
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image'],
      ['clean'],
    ],
  };

  if (!mounted) {
    return (
      <div 
        className={`quill-editor-loading ${className}`} 
        style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        Đang tải trình soạn thảo...
      </div>
    );
  }

  return (
    <div className={`quill-editor-container ${className}`} style={{ minHeight: '300px' }}>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder}
        readOnly={readOnly}
        style={{ height: '100%' }}
        className="h-full"
      />
    </div>
  );
};

export default QuillEditor;
