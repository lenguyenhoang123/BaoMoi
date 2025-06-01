'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  Form, 
  Input, 
  Button, 
  Select, 
  Card, 
  Row, 
  Col, 
  Upload, 
  message, 
  Typography, 
  Tag, 
  Spin,
  Tooltip
} from 'antd';
import { 
  ArrowLeftOutlined, 
  UploadOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  CheckOutlined, 
  CloseOutlined,
  SaveOutlined
} from '@ant-design/icons';
import dynamic from 'next/dynamic';
import type { RcFile, UploadFile, UploadProps } from 'antd/es/upload/interface';
import styles from './page.module.css';

// Helper function to convert file to base64
const getBase64 = (img: RcFile, callback: (url: string) => void) => {
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result as string));
  reader.readAsDataURL(img);
};

const { Option } = Select;
const { Title } = Typography;

const { TextArea } = Input;

// Types
interface TagType {
  id?: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

enum PostStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  PENDING = 'pending'
}

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  meta_title?: string;
  meta_description?: string;
  status: PostStatus;
  category_id: string;
  tags: TagType[];
  featured_image?: string;
  created_at?: string;
  updated_at?: string;
}

interface FormValues {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: PostStatus;
  category_id: string;
  tags: TagType[];
  meta_title?: string;
  meta_description?: string;
  featured_image?: string;
}

interface EditPostPageProps {
  params: {
    id: string;
  };
}

interface EditingTag {
  index: number;
  value: string;
}

const categoryApi = {
  getCategories: async (): Promise<Category[]> => {
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error('Không thể tải danh sách danh mục');
      }
      return response.json();
    } catch (error) {
      console.error('Lỗi khi tải danh mục:', error);
      message.error('Không thể tải danh sách danh mục');
      return [];
    }
  }
};

const postApi = {
  getPostById: async (id: string): Promise<Post> => {
    try {
      const response = await fetch(`/api/posts/${id}`);
      if (!response.ok) {
        throw new Error('Không tìm thấy bài viết');
      }
      return response.json();
    } catch (error) {
      console.error('Lỗi khi lấy thông tin bài viết:', error);
      throw error;
    }
  },
  
  updatePost: async (id: string, data: any) => {
    try {
      const response = await fetch(`/api/posts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }
      
      return response.json();
    } catch (error) {
      console.error('Lỗi khi cập nhật bài viết:', error);
      throw error;
    }
  }
};

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(
  () => import('react-quill'),
  { 
    ssr: false,
    loading: () => <span>Đang tải trình soạn thảo...</span>
  }
) as any;

const EditPostPage: React.FC<EditPostPageProps> = ({ params }) => {
  const [form] = Form.useForm<FormValues>();
  const router = useRouter();
  const { id } = params;
  
  // State management
  const [loading, setLoading] = useState<boolean>(true);
  const [post, setPost] = useState<Post | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [content, setContent] = useState<string>('');
  const [featuredImage, setFeaturedImage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isImageUploading, setIsImageUploading] = useState<boolean>(false);
  const [tags, setTags] = useState<TagType[]>([]);
  const [editingTag, setEditingTag] = useState<{ index: number; value: string } | null>(null);
  const [slugModified, setSlugModified] = useState<boolean>(false);
  const [newTag, setNewTag] = useState<string>('');
  const [showInMenu, setShowInMenu] = useState<boolean>(true);

  // Lấy thông tin bài viết
  const fetchPost = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const response = await postApi.getPostById(id);
      setPost(response);
      setContent(response.content);
      setFeaturedImage(response.featured_image || '');
      setTags(response.tags || []);
      
      // Đặt giá trị form
      form.setFieldsValue({
        title: response.title,
        slug: response.slug,
        excerpt: response.excerpt,
        status: response.status,
        category_id: response.category_id,
        meta_title: response.meta_title || response.title,
        meta_description: response.meta_description || response.excerpt,
        tags: response.tags || []
      });
    } catch (error) {
      console.error('Lỗi khi tải bài viết:', error);
      message.error('Không thể tải thông tin bài viết');
      router.push('/admin/bai-viet');
    } finally {
      setLoading(false);
    }
  }, [id, form, router]);

  // Lấy danh sách danh mục
  const fetchCategories = useCallback(async () => {
    try {
      const categories = await categoryApi.getCategories();
      setCategories(categories);
    } catch (error) {
      console.error('Lỗi khi tải danh mục:', error);
      message.error('Không thể tải danh sách danh mục');
    }
  }, []);

  // Xử lý tải ảnh lên
  const handleImageUpload = (file: RcFile) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('Bạn chỉ có thể tải lên file JPG/PNG!');
      return Upload.LIST_IGNORE as unknown as boolean;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Kích thước ảnh không được vượt quá 2MB!');
      return Upload.LIST_IGNORE as unknown as boolean;
    }
    return isJpgOrPng && isLt2M;
  };

  const handleImageChange: UploadProps['onChange'] = async (info) => {
    if (info.file.status === 'uploading') {
      try {
        setIsImageUploading(true);
      } catch (error) {
        console.error('Error uploading image:', error);
        message.error('Có lỗi xảy ra khi tải ảnh lên');
      }
      return;
    }

    if (info.file.status === 'done') {
      // Get this url from response in real world.
      getBase64(info.file.originFileObj as RcFile, (url) => {
        setIsImageUploading(false);
        setFeaturedImage(url);
        form.setFieldsValue({ featured_image: url });
      });
    }
  };

  // Xử lý gửi form
  const handleSubmit = async (values: FormValues) => {
    if (!content) {
      message.warning('Vui lòng nhập nội dung bài viết');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const postData = {
        ...values,
        content,
        featured_image: featuredImage,
        tags: tags.map(tag => ({ name: tag.name }))
      };

      console.log('Submitting post data:', postData);
      
      await postApi.updatePost(id, postData);
      
      message.success('Cập nhật bài viết thành công!');
      router.push('/admin/bai-viet');
    } catch (error: any) {
      console.error('Lỗi khi cập nhật bài viết:', error);
      message.error(
        error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật bài viết!'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render loading state
  if (loading || !post) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spin size="large" tip="Đang tải..." />
      </div>
    );
  }

  // Tạo slug từ tiêu đề
  const generateSlug = (title: string): string => {
    if (!title) return '';
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  // Xử lý thay đổi tiêu đề để tự động tạo slug
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    form.setFieldsValue({ title });
    
    // Auto-generate slug from title if slug is empty or hasn't been manually modified
    if (!slugModified && title) {
      const generatedSlug = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      
      form.setFieldsValue({ slug: generatedSlug });
    }
  };

  // Xử lý thay đổi slug để lưu trạng thái đã được chỉnh sửa
  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugModified(true);
  };

  // Xử lý xóa ảnh đại diện
  const handleRemoveImage = () => {
    setFeaturedImage('');
    form.setFieldsValue({ featured_image: undefined });
  };

  // Xử lý thêm tag mới
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      const tagToAdd = { name: newTag.trim() };
      const updatedTags = [...tags, tagToAdd];
      setTags(updatedTags);
      form.setFieldsValue({ tags: updatedTags });
      setNewTag('');
    }
  };

  // Xử lý xóa tag
  const handleRemoveTag = (tagIndex: number) => {
    const updatedTags = tags.filter((_, index) => index !== tagIndex);
    setTags(updatedTags);
    form.setFieldsValue({ tags: updatedTags });
  };

  // Xử lý cập nhật tag
  const handleUpdateTag = (tagIndex: number, newName: string) => {
    if (!newName.trim()) {
      handleRemoveTag(tagIndex);
      return;
    }

    const updatedTags = [...tags];
    updatedTags[tagIndex] = { ...updatedTags[tagIndex], name: newName.trim() };
    setTags(updatedTags);
    form.setFieldsValue({ tags: updatedTags });
    setEditingTag(null);
  };

  useEffect(() => {
    if (!params?.id) {
      message.error('Không tìm thấy ID bài viết');
      router.push('/admin/bai-viet');
      return;
    }
    
    const loadData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchPost(),
          fetchCategories()
        ]);
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
        message.error('Không thể tải dữ liệu bài viết');
        router.push('/admin/bai-viet');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [params.id]);

  if (loading || !post) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spin size="large" tip="Đang tải..." />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className="flex items-center">
          <Button 
            type="text" 
            icon={<ArrowLeftOutlined />} 
            onClick={() => router.back()}
            className="mr-2"
          >
            Quay lại
          </Button>
          <Title level={4} className="mb-0">Chỉnh sửa bài viết</Title>
        </div>
        <div>
          <Button 
            type="default" 
            className="mr-2"
            onClick={() => router.push('/admin/bai-viet')}
          >
            Hủy
          </Button>
          <Button 
            type="primary" 
            icon={<SaveOutlined />} 
            onClick={() => form.submit()}
            loading={isSubmitting}
          >
            Lưu thay đổi
          </Button>
        </div>
      </div>
      
      <div className={styles.contentWrapper}>
        <div className={styles.formContainer}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              ...post,
              status: post?.status || PostStatus.DRAFT,
              tags: post?.tags || []
            }}
          >
        <Row gutter={24}>
          <Col span={16}>
            <Card title="Nội dung chính" className="mb-6">
              <Form.Item
                name="title"
                label="Tiêu đề bài viết"
                rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
              >
                <Input 
                  placeholder="Nhập tiêu đề bài viết" 
                  onChange={handleTitleChange}
                />
              </Form.Item>

              <Form.Item
                name="slug"
                label="Đường dẫn tĩnh"
                rules={[{ required: true, message: 'Vui lòng nhập đường dẫn' }]}
              >
                <Input placeholder="duong-dan-bai-viet" />
              </Form.Item>

              <Form.Item
                name="excerpt"
                label="Mô tả ngắn"
                rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
              >
                <TextArea rows={3} placeholder="Nhập mô tả ngắn về bài viết" />
              </Form.Item>

              <Form.Item
                label="Nội dung"
                name="content"
                rules={[{ required: true, message: 'Vui lòng nhập nội dung' }]}
              >
                <ReactQuill
                  theme="snow"
                  value={content}
                  onChange={setContent}
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      ['link', 'image'],
                      ['clean']
                    ],
                  }}
                  className="h-64 mb-16"
                />
              </Form.Item>
            </Card>

            <Card title="Cài đặt SEO" className="mb-6">
              <Form.Item
                name="meta_title"
                label="Tiêu đề SEO"
                tooltip="Nếu để trống, hệ thống sẽ tự động lấy tiêu đề bài viết"
              >
                <Input placeholder="Nhập tiêu đề SEO" />
              </Form.Item>

              <Form.Item
                name="meta_description"
                label="Mô tả SEO"
                tooltip="Nếu để trống, hệ thống sẽ tự động lấy mô tả ngắn"
              >
                <TextArea rows={3} placeholder="Nhập mô tả SEO" />
              </Form.Item>
            </Card>
          </Col>

          <Col span={8}>
            <Card title="Xuất bản" className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <span>Trạng thái:</span>
                <Form.Item name="status" noStyle>
                  <Select 
                    style={{ width: 150 }}
                    onChange={(value) => form.setFieldsValue({ status: value })}
                  >
                    <Select.Option value={PostStatus.PUBLISHED}>Công khai</Select.Option>
                    <Select.Option value={PostStatus.DRAFT}>Bản nháp</Select.Option>
                    <Select.Option value={PostStatus.PENDING}>Chờ duyệt</Select.Option>
                  </Select>
                </Form.Item>
              </div>

              <div className="flex justify-between">
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  icon={<SaveOutlined />} 
                  loading={isSubmitting}
                  block
                >
                  Lưu thay đổi
                </Button>
              </div>
            </Card>

            <Card title="Danh mục" className="mb-6">
              <Form.Item
                name="category_id"
                rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
              >
                <Select
                  placeholder="Chọn danh mục"
                  loading={loading}
                >
                  {categories.map((category) => (
                    <Option key={category.id} value={category.id}>
                      {category.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Card>

            <Card title="Thẻ" className="mb-6">
              <div className="mb-4">
                <Input
                  placeholder="Nhập và nhấn Enter để thêm thẻ"
                  onKeyDown={handleAddTag}
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <Tag
                    key={tag.id || index}
                    closable
                    onClose={(e) => {
                      e.preventDefault();
                      handleRemoveTag(index);
                    }}
                    className="flex items-center"
                  >
                    {editingTag?.index === index ? (
                      <Input
                        autoFocus
                        size="small"
                        style={{ width: 100 }}
                        defaultValue={tag.name}
                        onBlur={(e) => handleUpdateTag(index, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdateTag(index, (e.target as HTMLInputElement).value);
                          }
                        }}
                      />
                    ) : (
                      <span 
                        className="cursor-pointer"
                        onClick={() => setEditingTag({ index, value: tag.name })}
                      >
                        {tag.name}
                      </span>
                    )}
                  </Tag>
                ))}
              </div>
            </Card>

            <Card title="Ảnh đại diện">
              <Form.Item name="featured_image">
                <Upload
                  name="featured_image"
                  listType="picture-card"
                  className="avatar-uploader"
                  showUploadList={false}
                  beforeUpload={handleImageUpload}
                  onChange={handleImageChange}
                  disabled={isImageUploading}
                >
                  {featuredImage ? (
                    <div className="relative">
                      <img 
                        src={featuredImage} 
                        alt="Ảnh đại diện" 
                        className="w-full h-40 object-cover rounded"
                      />
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={handleRemoveImage}
                        className="absolute top-1 right-1 bg-white rounded-full p-1 shadow"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-4">
                      {isImageUploading ? (
                        <Spin />
                      ) : (
                        <>
                          <UploadOutlined className="text-2xl mb-2" />
                          <div>Tải ảnh lên</div>
                        </>
                      )}
                    </div>
                  )}
                </Upload>
                <div className="text-xs text-gray-500 mt-2">
                  Tỷ lệ khuyến nghị: 1200x630px. Dung lượng tối đa: 2MB
                </div>
              </Form.Item>
            </Card>

            <Card title="Từ khóa SEO" className="mb-6">
              <Form.Item
                name="meta_keywords"
                label="Từ khóa SEO (cách nhau bằng dấu phẩy)"
              >
                <Input placeholder="Ví dụ: tin tức, thời sự, xã hội" />
              </Form.Item>
              <div className="text-xs text-gray-500">
                Các từ khóa giúp bài viết của bạn dễ dàng được tìm thấy hơn trên công cụ tìm kiếm
              </div>
            </Card>
          </Col>
        </Row>

          </Form>
        </div>
      </div>
      
      <div className={styles.footer}>
        <Button 
          onClick={() => router.push('/admin/bai-viet')}
          disabled={isSubmitting}
        >
          Hủy
        </Button>
        <Button 
          type="primary" 
          htmlType="submit" 
          loading={isSubmitting}
          icon={<SaveOutlined />}
          onClick={() => form.submit()}
        >
          Lưu thay đổi
        </Button>
      </div>
    </div>
  );
};

export default EditPostPage;
