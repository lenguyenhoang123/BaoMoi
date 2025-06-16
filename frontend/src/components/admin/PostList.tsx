import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Space, Input, Select, message, Modal, Tag, Badge, Spin, Tooltip } from 'antd';
import { useRouter } from 'next/navigation';
import { Post, PostStatus, UpdatePostRequest } from '@/types/post';
import { postApi } from '@/services/api';
import { AxiosError } from 'axios';

type ApiError = AxiosError<{
  message?: string;
  error?: string;
  statusCode?: number;
}>;

const { Search } = Input;
const { Option } = Select;

const POST_STATUS = {
  draft: { label: 'Bản nháp', color: 'default' },
  published: { label: 'Đã xuất bản', color: 'success' },
  archived: { label: 'Lưu trữ', color: 'warning' },
} as const;

type PostStatusType = keyof typeof POST_STATUS;

interface PostListProps {
  initialData?: Post[];
  total?: number;
  loading?: boolean;
  onRefresh?: () => void;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    showSizeChanger?: boolean;
    pageSizeOptions?: string[];
    showTotal?: (total: number, range: [number, number]) => React.ReactNode;
    onChange?: (page: number, pageSize: number) => void;
  };
}

const PostList: React.FC<PostListProps> = ({
  initialData = [],
  total = 0,
  loading = false,
  onRefresh,
  pagination: propPagination,
}) => {
  const router = useRouter();
  const [data, setData] = useState<Post[]>(initialData);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total,
  });
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});

  // Cập nhật dữ liệu khi props thay đổi
  useEffect(() => {
    console.log('Initial data received:', initialData);
    if (initialData && initialData.length > 0) {
      console.log('First post created_at:', initialData[0].created_at);
      console.log('First post updated_at:', initialData[0].updated_at);
    }
    setData(initialData);
  }, [initialData]);

  // Xử lý xóa bài viết
  const handleDelete = useCallback((id: string) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa bài viết này?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          setIsProcessing(prev => ({ ...prev, [`delete_${id}`]: true }));

          // Cập nhật giao diện ngay lập tức
          setData(prevData => prevData.filter(item => item.id !== id));

          // Gọi API xóa
          await postApi.deletePost(id);

          message.success('Đã xóa bài viết thành công');

          // Gọi callback làm mới dữ liệu nếu có
          if (onRefresh) {
            await onRefresh();
          }
        } catch (error) {
          const apiError = error as ApiError;
          console.error('Lỗi khi xóa bài viết:', error);

          // Hiển thị thông báo lỗi chi tiết hơn
          const errorMessage = apiError.response?.data?.message ||
            apiError.response?.data?.error ||
            'Có lỗi xảy ra khi xóa bài viết';
          message.error(typeof errorMessage === 'string' ? errorMessage : 'Có lỗi xảy ra khi xóa bài viết');

          // Làm mới lại dữ liệu từ server nếu có lỗi
          if (onRefresh) {
            await onRefresh();
          }
        } finally {
          setIsProcessing(prev => ({ ...prev, [`delete_${id}`]: false }));
        }
      },
    });
  }, [onRefresh]);

  // Xử lý thay đổi trạng thái
  const handleStatusChange = useCallback(async (id: string, newStatus: PostStatusType) => {
    const originalData = [...data];
    const processingKey = `status_${id}_${newStatus}`;

    try {
      setIsProcessing(prev => ({ ...prev, [processingKey]: true }));

      // Tìm bài viết cần cập nhật
      const postToUpdate = data.find(item => item.id === id);
      if (!postToUpdate) {
        throw new Error('Không tìm thấy bài viết để cập nhật');
      }

      // Cập nhật giao diện ngay lập tức
      setData(prevData =>
        prevData.map(item =>
          item.id === id ? { ...item, status: newStatus } : item
        )
      );

      // Gọi API cập nhật trạng thái
      const getTagId = (tag: any): string | undefined => {
        if (!tag) return undefined;
        if (typeof tag === 'string') return tag;
        if (typeof tag === 'object' && tag !== null && 'id' in tag) return String(tag.id);
        return undefined;
      };

      const updateData: UpdatePostRequest = {
        id,
        title: postToUpdate.title,
        content: postToUpdate.content,
        status: newStatus,
        slug: postToUpdate.slug,
        image_url: postToUpdate.image_url || undefined,
        tags: Array.isArray(postToUpdate.tags)
          ? postToUpdate.tags
            .map(tag => getTagId(tag))
            .filter((tag): tag is string => Boolean(tag))
          : []
      };

      await postApi.updatePost(id, updateData);

      message.success(`Đã cập nhật trạng thái thành ${POST_STATUS[newStatus]?.label || 'thành công'}`);

      // Làm mới dữ liệu từ server
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      // Khôi phục lại trạng thái cũ nếu có lỗi
      setData(originalData);

      const apiError = error as ApiError;
      console.error('Lỗi khi cập nhật trạng thái:', error);

      // Hiển thị thông báo lỗi chi tiết hơn
      const errorMessage = apiError.response?.data?.message ||
        apiError.response?.data?.error ||
        (error instanceof Error ? error.message : 'Có lỗi xảy ra khi cập nhật trạng thái');
      message.error(typeof errorMessage === 'string' ? errorMessage : 'Có lỗi xảy ra khi cập nhật trạng thái');
    } finally {
      setIsProcessing(prev => ({ ...prev, [processingKey]: false }));
    }
  }, [data, onRefresh]);

  // Hàm định dạng ngày tháng đơn giản
  const formatDate = (dateString?: string | Date | null) => {
    if (!dateString) return 'Chưa cập nhật';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Chưa cập nhật';
      
      return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Lỗi định dạng ngày:', error);
      return 'Chưa cập nhật';
    }
  };

  // Các cột hiển thị thông tin bài viết
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id: string) => <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{id.substring(0, 8)}...</span>,
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      width: '30%',
      render: (text: string, record: Post) => (
        <div>
          <a 
            onClick={() => router.push(`/admin/bai-viet/${record.id}`)}
            style={{ fontWeight: 500, display: 'block', marginBottom: '4px' }}
          >
            {text}
          </a>
          {record.slug && (
            <div style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
              /{record.slug}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Nội dung',
      dataIndex: 'content',
      key: 'content',
      width: '30%',
      render: (content: string) => (
        <div style={{
          maxHeight: '60px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          fontSize: '13px',
          color: '#666'
        }}>
          {content?.replace(/<[^>]*>/g, '')}
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const statusInfo = POST_STATUS[status as keyof typeof POST_STATUS] || { label: status, color: 'default' };
        return <Tag color={statusInfo.color}>{statusInfo.label}</Tag>;
      },
      filters: Object.entries(POST_STATUS).map(([key, { label }]) => ({
        text: label,
        value: key,
      })),
      onFilter: (value: any, record: Post) => record.status === value,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      sorter: (a: Post, b: Post) => {
        try {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return isNaN(dateA) || isNaN(dateB) ? 0 : dateA - dateB;
        } catch {
          return 0;
        }
      },
      render: (date: string) => (
        <Tooltip title={date || 'Không có dữ liệu'}>
          <div style={{ whiteSpace: 'nowrap' }}>
            {formatDate(date)}
          </div>
        </Tooltip>
      ),
    },
    {
      title: 'Cập nhật',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 170,
      sorter: (a: Post, b: Post) => {
        try {
          const dateA = new Date(a.updatedAt).getTime();
          const dateB = new Date(b.updatedAt).getTime();
          return isNaN(dateA) || isNaN(dateB) ? 0 : dateA - dateB;
        } catch {
          return 0;
        }
      },
      render: (date: string) => (
        <Tooltip title={date || 'Không có dữ liệu'}>
          <div style={{ whiteSpace: 'nowrap' }}>
            {formatDate(date)}
          </div>
        </Tooltip>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 200,
      render: (_: any, record: Post) => (
        <Space size="middle">
          <Button 
            type="link" 
            onClick={() => router.push(`/admin/bai-viet/${record.id}`)}
            style={{ padding: '4px 0' }}
          >
            Sửa
          </Button>
          <Button 
            type="text" 
            danger 
            onClick={() => handleDelete(record.id)}
            loading={isProcessing[`delete_${record.id}`]}
            disabled={isProcessing[`delete_${record.id}`]}
            style={{ padding: '4px 0' }}
          >
            Xóa
          </Button>
          {record.status !== 'published' && (
            <Button
              type="link"
              onClick={() => handleStatusChange(record.id, 'published')}
              loading={isProcessing[`status_${record.id}_published`]}
              disabled={isProcessing[`status_${record.id}_published`]}
            >
              Xuất bản
            </Button>
          )}
          {record.status !== 'archived' && (
            <Button
              type="link"
              onClick={() => handleStatusChange(record.id, 'archived')}
              loading={isProcessing[`status_${record.id}_archived`]}
              disabled={isProcessing[`status_${record.id}_archived`]}
            >
              Lưu trữ
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // Tạo pagination mặc định nếu không được truyền từ props
  const defaultPagination = {
    current: 1,
    pageSize: 10,
    total,
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '50', '100'],
    showTotal: (total: number, range: [number, number]) =>
      `${range[0]}-${range[1]} trong ${total} bài viết`,
  };

  // Sử dụng pagination từ props hoặc mặc định
  const tablePagination = propPagination || defaultPagination;

  return (
    <div className="post-list">
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Search
            placeholder="Tìm kiếm bài viết"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            onSearch={onRefresh}
            style={{ width: 300 }}
            allowClear
          />
          <Select
            placeholder="Lọc theo trạng thái"
            value={statusFilter}
            onChange={value => {
              setStatusFilter(value);
              if (onRefresh) onRefresh();
            }}
            style={{ width: 200 }}
            allowClear
          >
            {Object.entries(POST_STATUS).map(([value, { label }]) => (
              <Option key={value} value={value}>
                {label}
              </Option>
            ))}
          </Select>
          <Button type="primary" onClick={onRefresh}>
            Làm mới
          </Button>
          <Button type="primary" onClick={() => router.push('/admin/bai-viet/them-moi')}>
            Thêm mới
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        pagination={{
          ...tablePagination,
          onChange: (page: number, pageSize: number) => {
            if (propPagination?.onChange) {
              propPagination.onChange(page, pageSize);
            }
            if (onRefresh) onRefresh();
          },
        }}
        loading={loading}
      />
    </div>
  );
};

export default PostList;
