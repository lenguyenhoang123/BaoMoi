'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, Card, Select, message } from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import TipTapEditor from '@/components/editor/TipTapEditor';
import axios from 'axios';

const { TextArea } = Input;

interface Category {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Tag {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface PostData {
  title: string;
  excerpt: string;
  content: string;
  categoryId: string;
  status: 'draft' | 'published';
  tags?: string[];
}

export default function SimplePostForm() {
  const [form] = Form.useForm();
  const router = useRouter();
  const [content, setContent] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Lấy danh sách danh mục
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/categories', {
          withCredentials: true
        });
        
        console.log('Categories API response:', response.data); // Log dữ liệu trả về
        
        let categoriesData: Category[] = [];
        
        if (Array.isArray(response.data)) {
          categoriesData = response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          categoriesData = response.data.data;
        } else if (response.data?.results && Array.isArray(response.data.results)) {
          categoriesData = response.data.results;
        }
        
        console.log('Processed categories:', categoriesData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching categories:', error);
        message.error('Không thể tải danh mục');
      } finally {
        setLoading(false);
      }
    };

    const fetchTags = async () => {
      try {
        setTagsLoading(true);
        const response = await axios.get('/api/tags', {
          withCredentials: true
        });
        
        let tagsData: Tag[] = [];
        
        if (Array.isArray(response.data)) {
          tagsData = response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          tagsData = response.data.data;
        } else if (response.data?.results && Array.isArray(response.data.results)) {
          tagsData = response.data.results;
        }
        
        setTags(tagsData);
      } catch (error) {
        console.error('Error fetching tags:', error);
        message.error('Không thể tải danh sách thẻ');
      } finally {
        setTagsLoading(false);
      }
    };

    fetchCategories();
    fetchTags();
  }, []);

  // Xử lý gửi form
  const handleSubmit = async (values: any) => {
    try {
      setSubmitting(true);
      
      const postData: PostData = {
        title: values.title,
        excerpt: values.excerpt,
        content: content,
        categoryId: values.categoryId,
        status: values.status || 'draft',
        tags: values.tags || []
      };

      await axios.post('/api/posts', postData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      message.success('Thêm bài viết thành công');
      router.push('/admin/bai-viet');
    } catch (error: any) {
      console.error('Error creating post:', error);
      message.error(error.response?.data?.message || 'Có lỗi xảy ra khi thêm bài viết');
    } finally {
      setSubmitting(false);
    }
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
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          status: 'draft'
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <Form.Item
                name="title"
                label="Tiêu đề bài viết"
                rules={[{ 
                  required: true, 
                  message: 'Vui lòng nhập tiêu đề' 
                }]}
              >
                <Input placeholder="Nhập tiêu đề bài viết" />
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
                label="Trạng thái"
                rules={[{ required: true }]}
              >
                <Select>
                  <Select.Option value="draft">Bản nháp</Select.Option>
                  <Select.Option value="published">Công khai</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="tags"
                label="Thẻ (Tags)"
              >
                <Select
                  mode="multiple"
                  placeholder="Chọn thẻ"
                  loading={tagsLoading}
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.children?.toString().toLowerCase() || '').includes(input.toLowerCase())
                  }
                >
                  {tags.map(tag => (
                    <Select.Option key={tag.id} value={tag.id}>
                      {tag.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="categoryId"
                label="Danh mục"
                rules={[{ 
                  required: true, 
                  message: 'Vui lòng chọn danh mục' 
                }]}
              >
                <Select
                  placeholder="Chọn danh mục"
                  loading={loading}
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.children?.toString().toLowerCase() || '').includes(input.toLowerCase())
                  }
                >
                  {categories.map(category => (
                    <Select.Option key={category.id} value={category.id}>
                      {category.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="tags"
                label="Thẻ (Tags)"
                tooltip="Nhấn Enter sau mỗi thẻ"
              >
                <Select
                  mode="tags"
                  style={{ width: '100%' }}
                  placeholder="Thêm thẻ"
                  tokenSeparators={[',']}
                />
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
