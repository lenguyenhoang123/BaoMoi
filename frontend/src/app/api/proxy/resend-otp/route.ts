import { NextResponse } from 'next/server';

// Sử dụng URL trực tiếp đến Auth Service
const AUTH_SERVICE_URL = 'http://localhost:3005';

export async function POST(request: Request) {
  console.log('[Resend OTP Proxy] Nhận yêu cầu gửi lại OTP');
  
  try {
    const body = await request.json();
    const url = `${AUTH_SERVICE_URL}/auth/resend-otp`;
    
    console.log(`[Resend OTP Proxy] Gửi yêu cầu đến: ${url}`);
    console.log('[Resend OTP Proxy] Dữ liệu gửi đi:', JSON.stringify(body));
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log(`[Resend OTP Proxy] Nhận phản hồi với mã: ${response.status}`);
    
    // Đọc dữ liệu phản hồi dưới dạng văn bản trước để debug
    const responseText = await response.text();
    let data;
    
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
      console.error('[Resend OTP Proxy] Lỗi khi parse JSON từ phản hồi:', e);
      console.error('[Resend OTP Proxy] Nội dung phản hồi:', responseText);
      throw new Error('Phản hồi không hợp lệ từ máy chủ');
    }
    
    if (!response.ok) {
      console.error('[Resend OTP Proxy] Lỗi từ backend:', data);
      return NextResponse.json(
        { message: data.message || 'Đã xảy ra lỗi khi gửi lại OTP' },
        { status: response.status }
      );
    }
    
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Accept',
      },
    });
  } catch (error) {
    console.error('[Resend OTP Proxy] Lỗi khi xử lý yêu cầu:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Lỗi máy chủ nội bộ' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
    },
  });
}
