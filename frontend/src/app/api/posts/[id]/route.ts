import { NextResponse } from 'next/server';
import axios from 'axios';

// URL cơ sở cho API, mặc định là localhost:3004 nếu không có biến môi trường
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Thiếu ID bài viết' },
        { status: 400 }
      );
    }

    console.log(`[API] Gọi GET ${API_BASE_URL}/posts/${id}`);
    // Gọi API phía backend để lấy thông tin chi tiết bài viết
    const response = await axios.get(`${API_BASE_URL}/posts/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      withCredentials: true
    });
    
    return NextResponse.json({
      success: true,
      data: response.data,
      message: 'Lấy thông tin bài viết thành công'
    });
  } catch (error: any) {
    console.error('Lỗi khi lấy thông tin bài viết:', error.response?.data || error.message);
    console.error('URL được gọi:', error.config?.url);
    console.error('Method:', error.config?.method);
    console.error('Headers:', error.config?.headers);
    return NextResponse.json(
      { 
        success: false,
        message: error.response?.data?.message || 'Không tìm thấy bài viết',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: error.response?.status || 404 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Thiếu ID bài viết' },
        { status: 400 }
      );
    }
    
    // Xác thực các trường bắt buộc
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
    
    // Lọc và chỉ giữ lại các trường dữ liệu cần thiết
    const postData = {
      title: body.title,
      slug: body.slug,
      content: body.content,
      status: body.status,
      image_url: body.image_url || null,
      tags: Array.isArray(body.tags) ? body.tags : []
    };
    
    // Gửi yêu cầu cập nhật bài viết lên backend
    const response = await axios.put(`${API_BASE_URL}/posts/${id}`, postData, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      withCredentials: true
    });
    
    return NextResponse.json({
      success: true,
      data: response.data,
      message: 'Cập nhật bài viết thành công'
    });
  } catch (error: any) {
    console.error('Lỗi khi cập nhật bài viết:', error);
    return NextResponse.json(
      { 
        success: false,
        message: error.response?.data?.message || 'Không thể cập nhật bài viết',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: error.response?.status || 500 }
    );
  }
}
