'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, Card, Select, message } from 'antd';
import api from '@/services/api';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import TipTapEditor from '@/components/editor/TipTapEditor';
// Using native fetch API instead of axios

const { TextArea } = Input;

interface PostData {
  id?: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  status: 'draft' | 'published' | 'archived';
  tags?: string[];
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export default function SimplePostForm() {
  const [form] = Form.useForm();
  const router = useRouter();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Tự động tạo slug từ tiêu đề khi chưa chỉnh sửa slug
  const [isSlugTouched, setIsSlugTouched] = useState(false);
  
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    if (!isSlugTouched) {
      const slug = title
        .toLowerCase()
        .normalize('NFD') // Chuyển đổi ký tự có dấu thành không dấu
        .replace(/[^\w\s-]/g, '') // Xóa các ký tự đặc biệt
        .replace(/\s+/g, '-') // Thay thế khoảng trắng bằng dấu gạch ngang
        .replace(/--+/g, '-') // Thay thế nhiều dấu gạch ngang liên tiếp bằng một dấu
        .replace(/^-+|-+$/g, '') // Xóa dấu gạch ngang ở đầu và cuối
        .trim();
      form.setFieldsValue({ slug });
    }
  };


  // Xử lý gửi form
  const handleSubmit = async (values: PostData) => {
    try {
      setSubmitting(true);

      // Validate content
      if (!content || content.trim() === '' || content === '<p></p>') {
        throw new Error('Vui lòng nhập nội dung bài viết');
      }

      // Validate các trường bắt buộc
      const requiredFields = ['title', 'slug'];
      const missingFields = requiredFields.filter(field => !values[field as keyof typeof values]);

      if (missingFields.length > 0) {
        throw new Error(`Vui lòng điền đầy đủ thông tin: ${missingFields.join(', ')}`);
      }

      // Chuẩn bị dữ liệu gửi lên
      const postData = {
        title: values.title.trim(),
        slug: values.slug.trim().toLowerCase(),
        content: content,
        status: values.status || 'draft',
        image_url: values.image_url?.trim() || null,
        excerpt: values.excerpt?.trim() || '',
        tags: values.tags
          ? String(values.tags).split(',').map(tag => tag.trim()).filter(Boolean)
          : []
      };

      // Sử dụng api service đã được cấu hình
      const response = await api.post('/posts', postData);
      const responseData = response.data;

      message.success('Tạo bài viết thành công');
      router.push('/admin/bai-viet');
    } catch (error) {
      console.error('Lỗi khi tạo bài viết:', error);
      message.error(error instanceof Error ? error.message : 'Có lỗi xảy ra khi tạo bài viết');
    } finally {
      setSubmitting(false);
    }
  };

  // Giá trị mặc định cho form
  const initialValues = {
    status: 'draft',
    tags: '',
    excerpt: '',
    title: '',
    slug: '',
    image_url: ''
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Thêm bài viết mới</h1>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.back()}
        >
          Quay lại
        </Button>
      </div>

      <Form
        form={form}
        initialValues={initialValues}
        layout="vertical"
        onFinish={handleSubmit}
        className="space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <Form.Item
                label="Tiêu đề"
                name="title"
                rules={[{ required: true, message: 'Vui lòng nhập tiêu đề bài viết' }]}
              >
                <Input
                  placeholder="Nhập tiêu đề bài viết"
                  onChange={handleTitleChange}
                />
              </Form.Item>

              <Form.Item
                label="Slug"
                name="slug"
                rules={[{ required: true, message: 'Vui lòng nhập slug cho bài viết' }]}
              >
                <Input 
                  placeholder="duong-dan-bai-viet" 
                  onChange={() => setIsSlugTouched(true)}
                />
              </Form.Item>

              <Form.Item
                label="Ảnh"
                name="image_url"
              >
                <Input placeholder="https://example.com/image.jpg" />
              </Form.Item>

              <Form.Item
                name="excerpt"
                label="Mô tả ngắn"
                rules={[{
                  required: true,
                  message: 'Vui lòng nhập mô tả ngắn',
                  max: 300
                }]}
              >
                <TextArea
                  rows={3}
                  placeholder="Mô tả ngắn về bài viết"
                  maxLength={300}
                  showCount
                />
              </Form.Item>

              <Form.Item
                name="content"
                label="Nội dung"
                rules={[{
                  required: true,
                  message: 'Vui lòng nhập nội dung bài viết',
                  validator: (_, value) =>
                    content && content.trim() !== '' && content !== '<p></p>'
                      ? Promise.resolve()
                      : Promise.reject('Nội dung không được để trống')
                }]}
                className="mb-4"
              >
                <TipTapEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Nhập nội dung bài viết..."
                />
              </Form.Item>
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="Thông tin">
              <Form.Item
                name="status"
                label="Trạng thái">
                <Select
                  placeholder="Chọn trạng thái"
                  options={[
                    { value: 'draft', label: 'Bản nháp' },
                    { value: 'published', label: 'Công khai' },
                    { value: 'archived', label: 'Lưu trữ' }
                  ]}
                />
              </Form.Item>

              <Form.Item
                name="tags"
                label="Thẻ (cách nhau bằng dấu phẩy)"
                extra="Ví dụ: tin tức, thời sự, xã hội"
              >
                <Input placeholder="Nhập các thẻ, cách nhau bởi dấu phẩy" />
              </Form.Item>
            </Card>

            <div className="flex justify-end gap-4 mt-4">
              <Button
                onClick={() => router.push('/admin/bai-viet')}
                disabled={submitting}
              >
                Hủy bỏ
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={submitting}
              >
                Lưu bài viết
              </Button>
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
}
