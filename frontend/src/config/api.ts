// Cấu hình API cho toàn bộ ứng dụng
export const API_CONFIG = {
  // Base URL cho tất cả các yêu cầu API
  // Lưu ý: Không thêm /api ở đây vì nó sẽ được thêm bởi proxy
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000', // Đã bỏ /api ở đây
  VERSION: 'v1',
  TIMEOUT: 10000,
  withCredentials: true,
  
  // Lấy URL đầy đủ cho một đường dẫn
  getUrl: (path: string): string => {
    // Xóa dấu gạch chéo ở đầu nếu có để tránh lặp lại
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    
    // Trả về URL đầy đủ
    const baseUrl = API_CONFIG.BASE_URL.endsWith('/') 
      ? API_CONFIG.BASE_URL.slice(0, -1) 
      : API_CONFIG.BASE_URL;
      
    return `${baseUrl}/${cleanPath}`;
  }
};
