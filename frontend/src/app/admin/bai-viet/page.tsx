'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  Button,
  Tag,
  Input,
  Select,
  Space,
  message,
  Card,
  Typography,
  Spin,
  Empty,
  Tooltip,
  Popconfirm
} from 'antd';
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { postApi, categoryApi } from '@/services/api-client';
import { Post, PostStatus } from '@/types/post';
import { debounce } from 'lodash';
import Link from 'next/link';

// Định nghĩa các tùy chọn trạng thái
const POST_STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'draft', label: 'Bản nháp' },
  { value: 'published', label: 'Đã xuất bản' },
  { value: 'archived', label: 'Lưu trữ' },
];

// Định dạng ngày tháng
const formatDate = (dateString: string) => {
  if (!dateString) return 'Chưa cập nhật';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Chưa cập nhật';

    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch (error) {
    console.error('Lỗi định dạng ngày:', error);
    return 'Chưa cập nhật';
  }
};

// Định dạng trạng thái
const getStatusTag = (status: PostStatus) => {
  switch (status) {
    case 'published':
      return <Tag color="success">Đã xuất bản</Tag>;
    case 'draft':
      return <Tag color="default">Bản nháp</Tag>;
    case 'archived':
      return <Tag color="error">Lưu trữ</Tag>;
    default:
      return <Tag>{status}</Tag>;
  }
};

const PostManagementPage = () => {
  const router = useRouter();
  const [data, setData] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchText, setSearchText] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<PostStatus | 'all'>('all');
  const [error, setError] = useState<string | null>(null);

  // Debounce search input
  const debouncedSearch = useRef(
    debounce((value: string) => {
      setSearchText(value);
      setPagination(prev => ({ ...prev, current: 1 }));
    }, 500)
  ).current;

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  // Hàm lấy danh sách bài viết
  const fetchPosts = useCallback(async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  } = {}): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await postApi.getPosts({
        page: params.page ?? pagination.current,
        limit: params.limit ?? pagination.pageSize,
        search: params.search ?? searchText.trim() ?? undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        sortBy: 'created_at',
        sortOrder: 'desc',
        include: 'category'
      });

      // Chuyển đổi dữ liệu để đảm bảo tương thích
      const formattedData = (response.data || []).map((post: any) => ({
        ...post,
        key: post.id,
        createdAt: post.created_at || post.createdAt,
        updatedAt: post.updated_at || post.updatedAt,
        imageUrl: post.image_url || post.imageUrl
      }));

      setData(formattedData);
      setPagination(prev => ({
        ...prev,
        total: response.total || 0
      }));
    } catch (error: any) {
      console.error('Lỗi khi tải danh sách bài viết:', error);
      setError('Không thể tải danh sách bài viết. Vui lòng thử lại sau.');

      const errorMessage = error.response?.data?.message ||
        (error instanceof Error ? error.message : 'Có lỗi xảy ra khi tải danh sách bài viết');
      message.error(typeof errorMessage === 'string' ? errorMessage : 'Đã xảy ra lỗi không xác định');
    }
  }, [pagination.current, pagination.pageSize, searchText, statusFilter]);

  // Gọi API khi có thay đổi về phân trang, tìm kiếm hoặc bộ lọc
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadData = async () => {
      try {
        setLoading(true);

        // Gọi API với các tham số phân trang, tìm kiếm, lọc
        const response = await postApi.getPosts({
          page: pagination.current,
          limit: pagination.pageSize,
          search: searchText.trim() || undefined,
          status: statusFilter === 'all' ? undefined : statusFilter,
          sortBy: 'created_at',
          sortOrder: 'desc',
          include: 'category' // Thêm include để lấy thông tin category
        });

        if (!isMounted) return;

        console.log('Dữ liệu bài viết từ API:', response);

        // Lấy danh sách categories từ API
        const categoriesResponse = await categoryApi.getCategories({ limit: 1000 });
        const categories = Array.isArray(categoriesResponse.data) ? categoriesResponse.data : [];
        
        // Tạo map để ánh xạ category_id -> category name
        const categoriesMap = new Map(
          categories.map((cat: any) => [cat.id, cat.name || cat.title || `Danh mục ${cat.id}`])
        );
        
        console.log('Danh sách categories:', Array.from(categoriesMap.entries()));

        // Chuyển đổi dữ liệu bài viết
        const formattedData = (response.data || []).map((post: any) => {
          // Lấy category_id từ post
          const categoryId = post.category_id || (post.category?.id || '');
          
          // Lấy tên danh mục từ categoriesMap
          const categoryName = categoryId 
            ? (categoriesMap.get(categoryId) || `Danh mục ${categoryId}`)
            : 'Chưa phân loại';


          return {
            ...post,
            key: post.id,
            createdAt: post.created_at || post.createdAt,
            updatedAt: post.updated_at || post.updatedAt,
            image_url: post.image_url || post.image,
            tags: post.tags || [],
            category: {
              id: post.category_id || '',
              name: categoryName
            }
          };
        });

        console.log('Dữ liệu đã định dạng:', formattedData);

        setData(formattedData);
        setPagination(prev => ({
          ...prev,
          total: response.total || 0
        }));
        setError(null);
      } catch (error: any) {
        if (!isMounted) return;

        console.error('Lỗi khi tải danh sách bài viết:', error);

        // Kiểm tra lỗi cụ thể từ API
        if (error.response?.data?.error === 'SOURCE_LANG_VI') {
          message.error('Vui lòng cung cấp thông tin ngôn ngữ');
        } else {
          const errorMessage = error.response?.data?.message ||
            (error instanceof Error ? error.message : 'Có lỗi xảy ra khi tải danh sách bài viết');
          message.error(typeof errorMessage === 'string' ? errorMessage : 'Đã xảy ra lỗi không xác định');
        }

        setError('Không thể tải danh sách bài viết. Vui lòng thử lại sau.');
      } finally {
        if (isMounted) {
          setLoading(false);
          setIsRefreshing(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [pagination.current, pagination.pageSize, searchText, statusFilter]);

  // Xử lý tìm kiếm
  const handleSearch = useCallback(() => {
    setSearchText(searchInput.trim());
    setPagination(prev => ({ ...prev, current: 1 }));
  }, [searchInput]);

  // Xử lý thay đổi bộ lọc trạng thái
  const handleStatusFilterChange = useCallback((value: PostStatus | 'all') => {
    setStatusFilter(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  }, []);

  // Xử lý làm mới dữ liệu
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchPosts();
  }, [fetchPosts]);

  // Xử lý xóa bài viết
  const handleDelete = useCallback(async (id: string) => {
    try {
      await postApi.deletePost(id);
      message.success('Xóa bài viết thành công');
      fetchPosts();
    } catch (error) {
      message.error('Có lỗi xảy ra khi xóa bài viết');
      console.error('Lỗi khi xóa bài viết:', error);
    }
  }, [fetchPosts]);

  // Xử lý thay đổi phân trang
  const handleTableChange = (pagination: any) => {
    setPagination(prev => ({
      ...prev,
      current: pagination.current,
      pageSize: pagination.pageSize,
    }));
  };

  // Cấu hình cột cho bảng
  const columns = [
    {
      title: 'Danh mục',
      dataIndex: 'category',
      key: 'category',
      width: 200,
      render: (category: any) => {
        // Nếu không có thông tin danh mục
        if (!category) {
          return <span className="text-gray-400">Chưa phân loại</span>;
        }

        // Chỉ hiển thị tên danh mục
        const displayName = category.name || category.title || 
                         (typeof category === 'string' ? category : 'Danh mục');
        
        return (
          <span className="text-blue-600">
            {displayName}
          </span>
        );
      },
    },
    {
      title: 'Ảnh',
      dataIndex: 'image_url',
      key: 'image',
      width: 100,
      render: (image_url: string, record: Post) => {
        // Lấy trực tiếp image_url từ dữ liệu
        const imgSrc = image_url;

        // Nếu không có ảnh, hiển thị placeholder
        if (!imgSrc) {
          return (
            <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded text-gray-400 text-xs">
              No Image
            </div>
          );
        }

        // Kiểm tra nếu URL ảnh là tương đối thì thêm base URL
        let finalImageUrl = imgSrc;
        if (imgSrc.startsWith('/')) {
          finalImageUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}${imgSrc}`;
        }

        console.log('Đang tải ảnh:', {
          id: record.id,
          originalSrc: imgSrc,
          finalSrc: finalImageUrl,
          record: record
        });

        return (
          <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded overflow-hidden">
            <img
              src={finalImageUrl}
              alt="Ảnh đại diện"
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error('Lỗi tải ảnh:', {
                  id: record.id,
                  src: finalImageUrl,
                  error: e,
                  record: record
                });
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.style.display = 'none';
                target.parentElement!.innerHTML = 'Lỗi ảnh';
              }}
              onLoad={() => console.log('Ảnh đã tải thành công:', finalImageUrl)}
            />
          </div>
        );
      },
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Post) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500">/{record.slug}</div>
          {record.tags && record.tags.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {record.tags.slice(0, 3).map((tag, index) => (
                <Tag key={index} color="blue" className="text-xs">
                  {tag}
                </Tag>
              ))}
              {record.tags.length > 3 && (
                <Tag className="text-xs">+{record.tags.length - 3}</Tag>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: PostStatus) => getStatusTag(status),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => (
        <Tooltip title={formatDate(date)}>
          <span>{formatDate(date)}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Ngày cập nhật',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 150,
      render: (date: string) => (
        <Tooltip title={formatDate(date)}>
          <span>{formatDate(date)}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 120,
      render: (_: any, record: Post) => (
        <Space size="small">
          <Tooltip title="Xem">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => window.open(`/bai-viet/${record.slug}`, '_blank')}
            />
          </Tooltip>
          <Tooltip title="Sửa">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => router.push(`/admin/bai-viet/chinh-sua/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Popconfirm
              title="Bạn có chắc chắn muốn xóa bài viết này?"
              onConfirm={() => handleDelete(record.id)}
              okText="Xóa"
              cancelText="Hủy"
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4">
      <Card
        title={
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center">
              <Typography.Title level={4} className="m-0">
                Quản lý bài viết
              </Typography.Title>
              <Button
                type="text"
                icon={<ReloadOutlined spin={isRefreshing} />}
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="ml-2"
                title="Làm mới"
              />
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => router.push('/admin/bai-viet/them-moi')}
            >
              Thêm mới
            </Button>
          </div>
        }
        className="shadow-sm"
      >
        <div className="mb-6">
          <Space size="middle" className="w-full mb-4 flex flex-col md:flex-row" wrap>
            <div className="w-full md:w-1/3">
              <Input
                placeholder="Tìm kiếm theo tiêu đề, mô tả..."
                prefix={<SearchOutlined />}
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  debouncedSearch(e.target.value);
                }}
                onPressEnter={handleSearch}
                allowClear
                disabled={loading}
              />
            </div>
            <div className="w-full md:w-48">
              <Select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="w-full"
                placeholder="Lọc theo trạng thái"
                disabled={loading}
              >
                {POST_STATUS_OPTIONS.map(option => (
                  <Select.Option key={option.value} value={option.value}>
                    {option.label}
                  </Select.Option>
                ))}
              </Select>
            </div>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearch}
              loading={loading}
              className="w-full md:w-auto"
            >
              Tìm kiếm
            </Button>
          </Space>
        </div>

        <div className="overflow-x-auto">
          <Spin spinning={loading && !isRefreshing} tip="Đang tải dữ liệu...">
            {error ? (
              <div className="text-center py-8">
                <Empty
                  description={
                    <div>
                      <div className="text-red-500 mb-4">{error}</div>
                      <Button
                        type="primary"
                        onClick={handleRefresh}
                        loading={isRefreshing}
                      >
                        Thử lại
                      </Button>
                    </div>
                  }
                />
              </div>
            ) : (
              <>
                <Table
                  columns={columns}
                  dataSource={data}
                  rowKey="id"
                  pagination={{
                    ...pagination,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '20', '50', '100'],
                    showTotal: (total, range) => `${range[0]}-${range[1]} trong ${total} bài viết`,
                    locale: {
                      items_per_page: 'bài/trang',
                    },
                  }}
                  onChange={handleTableChange}
                  scroll={{ x: 'max-content' }}
                />
              </>
            )}
          </Spin>
        </div>
      </Card>
    </div>
  );
};

export default PostManagementPage;
