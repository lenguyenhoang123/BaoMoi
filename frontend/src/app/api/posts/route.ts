import { NextResponse } from 'next/server';
import axios from 'axios';

// Sử dụng cổng 3002 cho môi trường development
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

export async function GET(request: Request) {
  try {
    // Lấy các query parameters từ URL
    const { searchParams } = new URL(request.url);
    
    // Gọi API thông qua API Gateway
    const response = await axios.get(`${API_BASE_URL}/posts?${searchParams.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Format lại dữ liệu để phù hợp với cấu trúc mong đợi của frontend
    const responseData = response.data;
    const formattedData = {
      items: responseData.data?.items || responseData.data || [],
      pagination: {
        page: responseData.data?.pagination?.page || 1,
        pageSize: responseData.data?.pagination?.limit || 10,
        totalItems: responseData.data?.pagination?.totalItems || 0,
        totalPages: responseData.data?.pagination?.totalPages || 1,
      }
    };
    
    // Trả về dữ liệu đã được định dạng
    return NextResponse.json({
      success: true,
      data: formattedData,
      message: responseData.message || 'Success'
    });
  } catch (error: any) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { 
        success: false,
        message: error.response?.data?.message || 'Failed to fetch posts',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: error.response?.status || 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Kiểm tra các trường bắt buộc
    const requiredFields = ['title', 'slug', 'content', 'status'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Thiếu các trường bắt buộc: ${missingFields.join(', ')}` 
        },
        { status: 400 }
      );
    }
    
    // Chỉ lấy các trường cần thiết
    const postData = {
      title: body.title,
      slug: body.slug,
      content: body.content,
      status: body.status,
      image_url: body.image_url || null,
      tags: Array.isArray(body.tags) ? body.tags : []
    };
    
    // Gọi API backend để tạo bài viết mới
    const response = await axios.post(`${API_BASE_URL}`, postData, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      withCredentials: true
    });
    
    return NextResponse.json({
      success: true,
      data: response.data,
      message: 'Tạo bài viết thành công'
    });
  } catch (error: any) {
    console.error('Lỗi khi tạo bài viết:', error);
    return NextResponse.json(
      { 
        success: false,
        message: error.response?.data?.message || 'Không thể tạo bài viết',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: error.response?.status || 500 }
    );
  }
}
