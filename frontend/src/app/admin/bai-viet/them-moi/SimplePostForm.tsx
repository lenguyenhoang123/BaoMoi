'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, Card, Select, message } from 'antd';
import { categoryApi, postApi } from '@/services/api-client';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import TipTapEditor from '@/components/editor/TipTapEditor';


const { TextArea } = Input;

interface Category {
  id: string | number;
  name: string;
  slug: string;
}

interface PostData {
  id?: string;
  title: string;
  slug: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
  category_id?: string | number;
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<{id: string, name: string}[]>([]);
  const [loadingTags, setLoadingTags] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);

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

  // Xử lý khi giá trị form thay đổi
  const handleValuesChange = (changedValues: any, allValues: any) => {
    console.log('Form values changed:', changedValues, allValues);
    // Cập nhật giá trị content từ editor
    if ('content' in changedValues) {
      setContent(changedValues.content);
    }
    // Cập nhật selectedTags nếu có thay đổi từ form
    if ('tags' in changedValues) {
      setSelectedTags(changedValues.tags || []);
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
      const requiredFields = ['title', 'slug', 'category_id'];
      const missingFields = requiredFields.filter(field => !values[field as keyof typeof values]);

      if (missingFields.length > 0) {
        const fieldNames: Record<string, string> = {
          'title': 'tiêu đề',
          'slug': 'đường dẫn',
          'category_id': 'danh mục'
        };
        throw new Error(`Vui lòng điền đầy đủ thông tin: ${missingFields.map(f => fieldNames[f] || f).join(', ')}`);
      }

      // Lấy danh sách thẻ từ cả input và selectedTags
      const tagsFromInput = values.tags 
        ? String(values.tags).split(',').map(tag => tag.trim()).filter(Boolean)
        : [];
      
      // Sử dụng Array.from để tránh lỗi downlevelIteration
      const allTags = Array.from(new Set([...selectedTags, ...tagsFromInput]));

      // Chuẩn bị dữ liệu gửi lên
      const postData = {
        title: values.title.trim(),
        slug: values.slug.trim().toLowerCase(),
        content: content,
        status: values.status || 'draft',
        category_id: values.category_id,
        image_url: values.image_url?.trim() || undefined, // Sử dụng undefined thay vì null
        tags: allTags
      };

      console.log('Gửi dữ liệu bài viết:', postData);

      // Sử dụng postApi để tạo bài viết mới
      const response = await postApi.createPost(postData);
      console.log('Phản hồi từ API:', response);

      message.success('Tạo bài viết thành công');
      router.push('/admin/bai-viet');
    } catch (error) {
      console.error('Lỗi khi tạo bài viết:', error);
      message.error(error instanceof Error ? error.message : 'Có lỗi xảy ra khi tạo bài viết');
    } finally {
      setSubmitting(false);
    }
  };

  // Lấy danh sách danh mục và thẻ
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Lấy danh mục
        const categoriesResponse = await categoryApi.getCategories({});
        setCategories(categoriesResponse.data || []);
        
        // Tạm thời bỏ qua lấy danh sách thẻ vì API chưa sẵn sàng
        // const tagsResponse = await tagApi.getTags();
        // setAvailableTags(tagsResponse.data || []);
        setAvailableTags([]); // Khởi tạo mảng rỗng
        
      } catch (error: any) {
        console.error('Lỗi khi lấy dữ liệu:', error);
        // Chỉ hiển thị lỗi nếu không phải lỗi 404 (API không tồn tại)
        if (error.status !== 404) {
          message.error('Không thể tải dữ liệu danh mục');
        }
      } finally {
        setLoadingCategories(false);
        setLoadingTags(false);
      }
    };

    fetchData();
  }, []);

  // Giá trị mặc định cho form
  const initialValues = {
    status: 'draft',
    tags: [], // Đảm bảo tags là mảng rỗng
    title: '',
    slug: '',
    category_id: undefined,
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
                name="category_id"
                label="Danh mục"
                rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
              >
                <Select
                  placeholder="Chọn danh mục"
                  loading={loadingCategories}
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={categories.map(category => ({
                    value: category.id,
                    label: category.name
                  }))}
                />
              </Form.Item>

              <Form.Item
                name="tags"
                label="Thẻ"
                extra="Chọn thẻ có sẵn hoặc nhập thẻ mới"
              >
                <Select
                  mode="tags"
                  placeholder="Chọn hoặc nhập thẻ"
                  loading={loadingTags}
                  tokenSeparators={[',']}
                  options={availableTags.map(tag => ({
                    value: tag.name,
                    label: tag.name
                  }))}
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
