'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Table, 
  Button, 
  Space, 
  Tag, 
  message, 
  Input, 
  Select, 
  Popconfirm,
  Card,
  Typography,
  TableProps,
  TablePaginationConfig
} from 'antd';
import { 
  SearchOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  PlusOutlined
} from '@ant-design/icons';
import type { FilterValue, SorterResult, ColumnsType } from 'antd/es/table/interface';
import Link from 'next/link';

const { Search } = Input;
const { Option } = Select;
const { Title } = Typography;

// Định nghĩa các trạng thái bài viết dưới dạng hằng số có thể sử dụng làm cả type và value
export const POST_STATUS = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
  PENDING: 'PENDING',
  REJECTED: 'REJECTED'
} as const;

type PostStatus = typeof POST_STATUS[keyof typeof POST_STATUS];

// Định nghĩa các kiểu dữ liệu
interface Author {
  id: string;
  full_name: string;
  email: string;
  avatar?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featured_image?: string;
  status: PostStatus;
  views: number;
  likes: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
  author: Author;
  category: Category;
  tags?: Array<{ id: string; name: string }>;
}

interface TableParams {
  pagination: TablePaginationConfig;
  sortField?: string;
  sortOrder?: string;
  filters?: Record<string, FilterValue | null>;
}

interface DataType extends Post {
  key: string;
}

// Mock service gọi API (thay thế bằng service thật khi triển khai)
const postApi = {
  getPosts: async (params: any) => {
    // This is a mock implementation
    console.log('Fetching posts with params:', params);
    return {
      data: [
        {
          id: '1',
          key: '1',
          title: 'Bài viết mẫu',
          slug: 'bai-viet-mau',
          content: 'Nội dung bài viết mẫu',
          status: POST_STATUS.PUBLISHED,
          views: 100,
          likes: 10,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          published_at: new Date().toISOString(),
          author: {
            id: '1',
            full_name: 'Nguyễn Văn A',
            email: 'nguyenvana@example.com',
          },
          category: {
            id: '1',
            name: 'Công nghệ',
            slug: 'cong-nghe'
          },
          tags: [
            { id: '1', name: 'React' },
            { id: '2', name: 'Next.js' }
          ]
        }
      ],
      pagination: {
        current: params.page || 1,
        pageSize: params.pageSize || 10,
        total: 1
      }
    };
  },
  
  deletePost: async (id: string) => {
    console.log('Deleting post with id:', id);
    // This is a mock implementation
    return { success: true };
  }
};

// Component chính
const PostManagementPage = () => {
  const router = useRouter();
  const [data, setData] = useState<DataType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<PostStatus | undefined>(undefined);
  const [tableParams, setTableParams] = useState<TableParams>({
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total, range) => `${range[0]}-${range[1]} trên ${total} bài viết`,
    },
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        // Xử lý thay đổi bảng (phân trang, bộ lọc, sắp xếp)
        page: tableParams.pagination?.current,
        pageSize: tableParams.pagination?.pageSize,
        search: searchText,
        status: statusFilter,
      };
      
      const response = await postApi.getPosts(params);
      setData(response.data);
      setTableParams({
        ...tableParams,
        pagination: {
          ...tableParams.pagination,
          total: response.pagination.total,
        },
      });
    } catch (error) {
      message.error('Có lỗi xảy ra khi tải dữ liệu');
      console.error('Lỗi tải bài viết:', error);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(tableParams), searchText, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await postApi.deletePost(id);
      message.success('Xóa bài viết thành công');
      fetchData();
    } catch (error) {
      message.error('Có lỗi xảy ra khi xóa bài viết');
      console.error('Lỗi xóa bài viết:', error);
    }
  }, [fetchData]);

  const handleTableChange: TableProps<DataType>['onChange'] = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<DataType> | SorterResult<DataType>[],
  ) => {
    setTableParams({
      pagination,
      filters,
      ...sorter,
    });
  };

  const handleSearch = (value: string) => {
    // Xử lý tìm kiếm
    setSearchText(value);
    setTableParams({
      ...tableParams,
      pagination: {
        ...tableParams.pagination,
        current: 1,
      },
    });
  };

  const handleStatusChange = (value: PostStatus | undefined) => {
    // Xử lý thay đổi bộ lọc trạng thái
    setStatusFilter(value);
    setTableParams({
      ...tableParams,
      pagination: {
        ...tableParams.pagination,
        current: 1,
      },
    });
  };

  // Định nghĩa các trạng thái và màu sắc tương ứng
  const statusMap = {
    [POST_STATUS.PUBLISHED]: { color: 'green', text: 'Đã xuất bản' },
    [POST_STATUS.DRAFT]: { color: 'orange', text: 'Bản nháp' },
    [POST_STATUS.PENDING]: { color: 'blue', text: 'Chờ duyệt' },
    [POST_STATUS.ARCHIVED]: { color: 'default', text: 'Lưu trữ' },
    [POST_STATUS.REJECTED]: { color: 'red', text: 'Từ chối' },
  };

  const columns: ColumnsType<DataType> = [
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: DataType) => (
        <Link href={`/admin/bai-viet/chinh-sua/${record.id}`}>
          {text}
        </Link>
      ),
    },
    {
      title: 'Tác giả',
      dataIndex: ['author', 'full_name'],
      key: 'author',
    },
    {
      title: 'Danh mục',
      dataIndex: ['category', 'name'],
      key: 'category',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: PostStatus) => {
        const statusInfo = statusMap[status] || { color: 'default', text: status };
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      },
      filters: [
        { text: 'Bản nháp', value: POST_STATUS.DRAFT },
        { text: 'Đã xuất bản', value: POST_STATUS.PUBLISHED },
        { text: 'Chờ duyệt', value: POST_STATUS.PENDING },
        { text: 'Lưu trữ', value: POST_STATUS.ARCHIVED },
        { text: 'Từ chối', value: POST_STATUS.REJECTED },
      ],
      filterMultiple: false,
      filteredValue: statusFilter ? [statusFilter] : undefined,
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Hành động',
      key: 'action',
      width: '15%',
      render: (_: any, record: DataType) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => router.push(`/bai-viet/${record.slug}`)}
            title="Xem"
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => router.push(`/admin/bai-viet/chinh-sua/${record.id}`)}
            title="Sửa"
          />
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa bài viết này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="text" danger icon={<DeleteOutlined />} title="Xóa" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card
        title={
          <div className="flex justify-between items-center">
            <Title level={4} className="mb-0">
              Quản lý bài viết
            </Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => router.push('/admin/bai-viet/them-moi')}
            >
              Thêm mới
            </Button>
          </div>
        }
        bordered={false}
      >
        <div className="mb-4 flex gap-4">
          <Search
            placeholder="Tìm kiếm bài viết"
            allowClear
            enterButton={
              <Button type="primary">
                <SearchOutlined />
              </Button>
            }
            onSearch={handleSearch}
            className="w-80"
          />
          <Select
            placeholder="Lọc theo trạng thái"
            allowClear
            onChange={handleStatusChange}
            value={statusFilter}
            className="w-48"
          >
            <Option value={POST_STATUS.DRAFT}>Bản nháp</Option>
            <Option value={POST_STATUS.PUBLISHED}>Đã xuất bản</Option>
            <Option value={POST_STATUS.PENDING}>Chờ duyệt</Option>
            <Option value={POST_STATUS.ARCHIVED}>Lưu trữ</Option>
            <Option value={POST_STATUS.REJECTED}>Từ chối</Option>
          </Select>
        </div>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={{
            ...tableParams.pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} trên ${total} bài viết`,
          }}
          loading={loading}
          onChange={handleTableChange}
          scroll={{ x: '100%' }}
          className="ant-table-striped"
          rowClassName={(_, index) =>
            index % 2 === 0 ? 'table-row-light' : 'table-row-dark'
          }
        />
      </Card>
    </div>
  );
};

export default PostManagementPage;
