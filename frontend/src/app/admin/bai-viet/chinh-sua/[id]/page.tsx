'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import dynamic from 'next/dynamic';
import { Select, Spin, Card, Button, Form, Input } from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';

// Import động MD Editor để tránh lỗi SSR
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor'),
  { 
    ssr: false,
    loading: () => <div>Đang tải trình soạn thảo...</div>
  }
) as any;

// Type definitions
interface Tag {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

type PostFormData = {
  id?: string;
  title: string;
  slug: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
  category_id?: string | number;
  image_url: string;
  tags: string[];
};

// Form validation schema
const postSchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được để trống'),
  slug: z.string().min(1, 'Đường dẫn không được để trống'),
  content: z.string().min(1, 'Nội dung không được để trống'),
  status: z.enum(['draft', 'published', 'archived']),
  category_id: z.union([z.string(), z.number()]).refine(val => !!val, 'Vui lòng chọn danh mục'),
  image_url: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export default function EditPostPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [existingTags, setExistingTags] = useState<string[]>([]);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema) as any,
    defaultValues: {
      title: '',
      slug: '',
      content: '',
      status: 'draft',
      image_url: '',
      tags: [],
      category_id: undefined
    },
  });
  
  const title = watch('title');
  const content = watch('content');
  const imageUrl = watch('image_url');
  const status = watch('status');

  // Auto-generate slug from title when slug is empty
  useEffect(() => {
    const currentSlug = watch('slug');
    if (title && (!currentSlug || currentSlug === generateSlug(watch('title')))) {
      const slug = generateSlug(title);
      setValue('slug', slug, { shouldValidate: true });
    }
  }, [title, setValue, watch]);
  
  // Handle slug generation on blur
  const handleSlugBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const currentSlug = e.target.value;
    if (!currentSlug && title) {
      const newSlug = generateSlug(title);
      setValue('slug', newSlug, { shouldValidate: true });
    } else if (currentSlug) {
      const cleanedSlug = generateSlug(currentSlug);
      if (cleanedSlug !== currentSlug) {
        setValue('slug', cleanedSlug, { shouldValidate: true });
      }
    }
  };

  // Fetch categories
  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.message || 'Không thể tải danh mục');
        }
        
        if (result.success) {
          setCategories(Array.isArray(result.data) ? result.data : []);
        } else {
          throw new Error('Dữ liệu danh mục không hợp lệ');
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Không thể tải danh sách danh mục. Vui lòng thử lại sau.');
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Memoize the fetchTags function to prevent unnecessary re-renders
  const fetchTags = useCallback(async () => {
    if (params.id === 'new') return; // Skip for new post
    
    try {
      const response = await fetch('/api/posts?fields=tags');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Không thể tải danh sách thẻ');
      }
      
      if (Array.isArray(result.data)) {
        setExistingTags(result.data);
      } else {
        console.warn('Unexpected tags format:', result.data);
        setExistingTags([]);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
      toast.error('Không thể tải danh sách thẻ. Vui lòng thử lại sau.');
      setExistingTags([]);
    }
  }, [params.id]);
  
  // Memoize the tags options to prevent unnecessary re-renders
  const tagOptions = useMemo(() => {
    return Array.from(new Set([...existingTags, ...selectedTags]))
      .filter(Boolean)
      .map(tag => ({
        value: tag,
        label: tag
      }));
  }, [existingTags, selectedTags]);
  
  // Fetch existing tags for suggestions
  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  // Fetch post data if in edit mode
  useEffect(() => {
    const fetchPost = async () => {
      if (params.id === 'new') {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const postResponse = await fetch(`/api/posts/${params.id}`);
        
        if (!postResponse.ok) {
          const result = await postResponse.json();
          throw new Error(result.message || 'Không thể tải dữ liệu bài viết');
        }

        const result = await postResponse.json();
        const post = result.data;
        const tagNames = Array.isArray(post.tags) ? post.tags : [];
        
        setSelectedTags(tagNames);
        
        // Reset form với dữ liệu từ API
        reset({
          title: post.title || '',
          slug: post.slug || '',
          content: post.content || '',
          status: post.status || 'draft',
          image_url: post.image_url || '',
          category_id: post.category_id || post.category?.id || undefined,
          tags: tagNames,
        }, {
          keepDefaultValues: true // Giữ lại giá trị mặc định cho các trường không có trong dữ liệu API
        });
      } catch (error) {
        console.error('Error loading post:', error);
        toast.error(error instanceof Error ? error.message : 'Không thể tải dữ liệu bài viết');
        router.push('/admin/bai-viet');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [params.id, router, reset]);

  // Handle form submission
  const onSubmit: SubmitHandler<PostFormData> = async (data) => {
    let redirectTimer: NodeJS.Timeout | null = null;
    
    try {
      setIsSubmitting(true);
      
      // Validate required fields
      if (!data.title || !data.content) {
        throw new Error('Vui lòng điền đầy đủ thông tin bắt buộc');
      }

      // Normalize data before submission
      const postData = {
        title: data.title.trim(),
        slug: data.slug?.trim() || generateSlug(data.title),
        content: data.content,
        status: data.status || 'draft',
        image_url: data.image_url?.trim() || null,
        category_id: data.category_id ? Number(data.category_id) : null,
        tags: selectedTags.filter(Boolean).map(tag => tag.trim()).filter(Boolean),
      };

      const isNewPost = params.id === 'new';
      const url = isNewPost ? '/api/posts' : `/api/posts/${params.id}`;
      const method = isNewPost ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.message || 'Có lỗi xảy ra khi lưu bài viết';
        console.error('API Error:', { status: response.status, error: result });
        throw new Error(errorMessage);
      }

      // Show success message and redirect
      const successMessage = isNewPost 
        ? 'Tạo bài viết thành công' 
        : 'Cập nhật bài viết thành công';
      
      toast.success(successMessage);
      
      // Set up redirect
      return new Promise<void>((resolve) => {
        redirectTimer = setTimeout(() => {
          router.push('/admin/bai-viet');
          router.refresh();
          resolve();
        }, 1000);
      });
      
    } catch (error) {
      console.error('Error saving post:', error);
      toast.error(
        error instanceof Error ? error.message : 'Có lỗi xảy ra khi lưu bài viết'
      );
      return Promise.reject(error);
    } finally {
      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }
      setIsSubmitting(false);
    }
  };
  
  // Helper function to generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/--+/g, '-') // Replace multiple hyphens with a single one
      .trim();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3 text-gray-600 font-medium">Đang tải dữ liệu bài viết...</p>
          <p className="text-sm text-gray-500 mt-1">Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card 
        title={params.id === 'new' ? 'Thêm bài viết mới' : 'Chỉnh sửa bài viết'}
        extra={
          <Button 
            key="back" 
            icon={<ArrowLeftOutlined />} 
            onClick={() => router.push('/admin/bai-viet')}
          >
            Quay lại
          </Button>
        }
      >
        <Form 
          layout="vertical" 
          onFinish={handleSubmit(onSubmit)}
          className="space-y-6"
        >
          {/* Title */}
          <Form.Item
            label="Tiêu đề"
            required
            validateStatus={errors.title ? 'error' : ''}
            help={errors.title?.message}
          >
            <Input
              {...register('title')}
              value={watch('title')}
              onChange={(e) => setValue('title', e.target.value, { shouldValidate: true })}
              disabled={isSubmitting}
              size="large"
              placeholder="Nhập tiêu đề bài viết"
            />
          </Form.Item>

          {/* Slug */}
          <Form.Item
            label="Đường dẫn (URL)"
            validateStatus={errors.slug ? 'error' : ''}
            help={errors.slug?.message || 'Để trống để tự động tạo từ tiêu đề'}
          >
            <Input
              {...register('slug')}
              value={watch('slug')}
              onChange={(e) => setValue('slug', e.target.value, { shouldValidate: true })}
              onBlur={handleSlugBlur}
              disabled={isSubmitting}
              size="large"
              placeholder="duong-dan-bai-viet"
              suffix={
                <Button 
                  type="text" 
                  size="small" 
                  onClick={() => {
                    const currentTitle = watch('title');
                    if (currentTitle) {
                      const newSlug = generateSlug(currentTitle);
                      setValue('slug', newSlug, { shouldValidate: true });
                    }
                  }}
                >
                  Tạo tự động
                </Button>
              }
            />
          </Form.Item>

          {/* Category */}
          <Form.Item
            label="Danh mục"
            required
            validateStatus={errors.category_id ? 'error' : ''}
            help={errors.category_id?.message}
          >
            <Select
              value={watch('category_id')}
              onChange={(value) => setValue('category_id', value, { shouldValidate: true })}
              loading={loadingCategories}
              disabled={isSubmitting || loadingCategories}
              placeholder="Chọn danh mục"
              size="large"
              options={categories.map(category => ({
                value: category.id,
                label: category.name
              }))}
            />
          </Form.Item>

          {/* Status */}
          <Form.Item
            label="Trạng thái"
            required
          >
            <Select
              value={watch('status')}
              onChange={(value) => setValue('status', value, { shouldValidate: true })}
              options={[
                { value: 'draft', label: 'Bản nháp' },
                { value: 'published', label: 'Công khai' },
                { value: 'archived', label: 'Lưu trữ' },
              ]}
              size="large"
            />
          </Form.Item>

          {/* Tags */}
          <Form.Item 
            label="Thẻ"
            help="Nhấn Enter sau mỗi thẻ để thêm"
          >
            <Select
              mode="tags"
              style={{ width: '100%' }}
              placeholder="Nhập và nhấn Enter để thêm thẻ..."
              value={selectedTags}
              onChange={(value) => {
                const uniqueTags = Array.from(new Set(value));
                setSelectedTags(uniqueTags);
                setValue('tags', uniqueTags);
              }}
              options={tagOptions}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              showSearch
              allowClear
              disabled={isSubmitting}
              size="large"
              notFoundContent={null}
              styles={{
                popup: {
                  root: { display: 'none' }
                }
              }}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter' && (e.target as HTMLInputElement).value) {
                  e.preventDefault();
                  const input = (e.target as HTMLInputElement).value.trim();
                  if (input) {
                    const newTags = [...new Set([...selectedTags, input])];
                    setSelectedTags(newTags);
                    setValue('tags', newTags);
                    // Clear the input
                    (e.target as HTMLInputElement).value = '';
                  }
                }
              }}
            />
          </Form.Item>



          {/* Content */}
          <Form.Item
            label="Nội dung"
            required
            validateStatus={errors.content ? 'error' : ''}
            help={errors.content?.message}
            className="mt-4"
          >
            <div className="mt-2 border rounded-md overflow-hidden">
              <MDEditor
                value={watch('content')}
                onChange={(value) => setValue('content', value || '', { shouldValidate: true })}
                height={500}
                visibleDragbar={false}
                textareaProps={{
                  placeholder: 'Nhập nội dung bài viết...',
                }}
                previewOptions={{
                  wrapperClassName: 'prose max-w-none',
                }}
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Sử dụng Markdown để định dạng nội dung. Nhấn Ctrl+Space để xem gợi ý.
            </p>
          </Form.Item>

          {/* Image URL */}
          <Form.Item
            label="Ảnh đại diện (URL)"
            validateStatus={errors.image_url ? 'error' : ''}
            help={errors.image_url?.message || 'Đường dẫn đến ảnh đại diện bài viết'}
          >
            <Input
              {...register('image_url')}
              disabled={isSubmitting}
              size="large"
              placeholder="https://example.com/image.jpg"
            />
            {watch('image_url') && (
              <div className="mt-2">
                <div className="relative w-40 h-24 border rounded-md overflow-hidden">
                  <img
                    src={watch('image_url')}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
          </Form.Item>

          {/* Submit Button */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end space-x-4">
            <Button
              type="default"
              onClick={() => router.push('/admin/bai-viet')}
              disabled={isSubmitting}
              size="large"
              className="min-w-[100px]"
            >
              Hủy bỏ
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isSubmitting}
              icon={<SaveOutlined />}
              size="large"
              className="min-w-[150px]"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu bài viết'}
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}
