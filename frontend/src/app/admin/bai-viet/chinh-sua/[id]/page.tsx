'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import dynamic from 'next/dynamic';

// Import động trình soạn thảo Markdown để tránh lỗi SSR
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor'),
  { 
    ssr: false,
    loading: () => <div>Đang tải trình soạn thảo...</div>
  }
) as any;

// Định nghĩa kiểu dữ liệu cho form
type PostFormData = {
  title: string;
  slug: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
  image_url: string;
  tags: string;
}

// Định nghĩa schema validation cho form
const postSchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được để trống'),
  slug: z.string().min(1, 'Slug không được để trống'),
  content: z.string().min(1, 'Nội dung không được để trống'),
  status: z.enum(['draft', 'published', 'archived']),
  image_url: z.string().url('URL hình ảnh không hợp lệ').optional().or(z.literal('')),
  tags: z.string().optional()
});

// Kiểu dữ liệu cho dữ liệu form đã được parse
type ParsedPostFormData = Omit<PostFormData, 'tags'> & {
  tags: string[];
};

export default function EditPostPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema) as any,
    defaultValues: {
      title: '',
      slug: '',
      content: '',
      status: 'draft',
      image_url: '',
      tags: ''
    },
  });

  // Theo dõi nội dung cho MDEditor
  const content = watch('content');

  // Lấy dữ liệu bài viết
  useEffect(() => {
    const fetchPost = async () => {
      if (params.id === 'new') {
        setIsLoading(false);
        return;
      }

      try {
        console.log('Đang tải bài viết với ID:', params.id);
        
        // Gọi API thông qua API Gateway
        const apiUrl = `/api/posts/${params.id}`;
        console.log('Gọi API:', apiUrl);
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        console.log('Response status:', response.status, response.statusText);
        
        if (!response.ok) {
          let errorText = await response.text();
          console.error('Lỗi từ API - Response text:', errorText);
          
          // Thử parse JSON nếu có thể
          try {
            const errorData = JSON.parse(errorText);
            console.error('Lỗi từ API (parsed):', errorData);
            throw new Error(errorData.message || `Lỗi từ API (${response.status})`);
          } catch (e) {
            throw new Error(`Lỗi khi tải bài viết: ${response.status} - ${errorText}`);
          }
        }
        
        const responseData = await response.json();
        console.log('Dữ liệu thô từ API:', JSON.stringify(responseData, null, 2));
        
        // Kiểm tra nếu responseData là mảng và lấy phần tử đầu tiên
        const postData = responseData.data || responseData;
        
        if (!postData || (Array.isArray(postData) && postData.length === 0)) {
          console.error('Không tìm thấy dữ liệu bài viết trong response:', responseData);
          throw new Error('Không tìm thấy dữ liệu bài viết');
        }
        
        console.log('Dữ liệu bài viết sau khi xử lý:', postData);

        console.log('Dữ liệu bài viết sau khi xử lý:', postData);
        
        // Đặt giá trị cho form
        const formData = {
          title: postData.title || '',
          slug: postData.slug || '',
          content: postData.content || '',
          status: postData.status || 'draft',
          image_url: postData.image_url || postData.imageUrl || '',
          tags: Array.isArray(postData.tags) 
            ? postData.tags.join(', ') 
            : (postData.tags || '')
        };
        
        console.log('Dữ liệu form sẽ được đặt:', formData);
        
        // Đặt giá trị cho từng trường
        (Object.keys(formData) as Array<keyof typeof formData>).forEach((key) => {
          setValue(key, formData[key] as any);
        });
      } catch (error) {
        console.error('Lỗi khi tải bài viết:', error);
        toast.error('Có lỗi xảy ra khi tải bài viết: ' + (error as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [params.id, setValue]);

  // Xử lý khi submit form
  const onSubmit: SubmitHandler<PostFormData> = async (formData) => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      // Chuẩn bị dữ liệu
      const postData = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : []
      };
      
      console.log('Dữ liệu gửi đi:', JSON.stringify(postData, null, 2));
      
      const method = params.id === 'new' ? 'POST' : 'PATCH';
      const url = `/api/posts${params.id === 'new' ? '' : `/${params.id}`}`;
      
      console.log(`Gửi ${method} đến ${url}`);
      
      // Thêm thông tin xác thực nếu có
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Thêm token xác thực nếu có
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(postData),
        credentials: 'include', // Quan trọng cho việc gửi cookie
      });

      // Xử lý response không phải JSON
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('Phản hồi không phải JSON:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: text
        });
        
        let errorMessage = `Lỗi từ máy chủ: ${response.status} ${response.statusText}`;
        
        try {
          // Thử parse nội dung lỗi nếu có
          const errorData = JSON.parse(text);
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (e) {
          // Nếu không parse được JSON, sử dụng nội dung lỗi gốc
          if (text) {
            errorMessage = text;
          }
        }
        
        throw new Error(errorMessage);
      }
      
      console.log('Phản hồi từ server:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data
      });
      
      if (!response.ok) {
        throw new Error(data.message || `Lỗi ${response.status}: ${response.statusText}`);
      }
      
      toast.success(params.id === 'new' ? 'Tạo bài viết thành công' : 'Cập nhật bài viết thành công');
      router.push('/admin/bai-viet');
      
    } catch (error: any) {
      console.error('Lỗi khi lưu bài viết:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        response: error.response
      });
      toast.error(error.message || 'Có lỗi xảy ra khi lưu bài viết');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        {params.id === 'new' ? 'Viết bài mới' : 'Chỉnh sửa bài viết'}
      </h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              {...register('title')}
              className={`w-full px-3 py-2 border rounded-md ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Nhập tiêu đề bài viết"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div className="mb-6">
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
              Đường dẫn (URL) <span className="text-red-500">*</span>
            </label>
            <input
              id="slug"
              type="text"
              {...register('slug')}
              className={`w-full px-3 py-2 border rounded-md ${errors.slug ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="duong-dan-bai-viet"
            />
            {errors.slug && (
              <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>
            )}
          </div>

          <div className="mb-6">
            <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-1">
              URL hình ảnh
            </label>
            <input
              id="image_url"
              type="url"
              {...register('image_url')}
              className={`w-full px-3 py-2 border rounded-md ${errors.image_url ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="https://example.com/image.jpg"
            />
            {errors.image_url && (
              <p className="mt-1 text-sm text-red-600">{errors.image_url.message}</p>
            )}
          </div>

          <div className="mb-6">
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
              Thẻ (cách nhau bằng dấu phẩy)
            </label>
            <input
              id="tags"
              type="text"
              {...register('tags')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="công nghệ, lập trình, tin tức"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <select
              id="status"
              {...register('status')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="draft">Bản nháp</option>
              <option value="published">Công khai</option>
              <option value="archived">Lưu trữ</option>
            </select>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nội dung <span className="text-red-500">*</span>
          </label>
          <div className="prose max-w-none" data-color-mode="light">
            <MDEditor
              value={content}
              onChange={(val: string | undefined) => setValue('content', val || '')}
              height={500}
              className={errors.content ? 'border border-red-500' : ''}
            />
          </div>
          {errors.content && (
            <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
          )}
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push('/admin/bai-viet')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang lưu...
              </span>
            ) : (
              'Lưu bài viết'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
