# Backend Services

Đây là thư mục chứa các dịch vụ backend của ứng dụng báo điện tử.

## Các dịch vụ

1. **API Gateway** (port 3000)
   - Điều hướng các yêu cầu đến các dịch vụ tương ứng
   - Xử lý CORS và xác thực

2. **Auth Service** (port 3003)
   - Xử lý đăng nhập, đăng ký, xác thực người dùng
   - Quản lý phiên đăng nhập và token

3. **User Service** (port 3001)
   - Quản lý thông tin người dùng
   - Xử lý cập nhật thông tin cá nhân

4. **Posts Service** (port 3002)
   - Quản lý bài viết
   - Xử lý tạo, sửa, xóa bài viết

5. **Categories Service** (port 3009)
   - Quản lý danh mục bài viết
   - Phân loại bài viết

6. **Tags Service** (port 3006)
   - Quản lý các thẻ bài viết
   - Gắn thẻ cho bài viết

7. **Comments Service** (port 3008)
   - Quản lý bình luận
   - Xử lý thêm, xóa bình luận

## Cấu hình CORS

Tất cả các dịch vụ đều sử dụng cấu hình CORS chung từ file `config/cors.config.js`.

Các origin được phép truy cập:
- http://localhost:3000
- http://localhost:3004
- http://127.0.0.1:3000
- http://127.0.0.1:3004
- Các cổng khác từ 3000-3009

## Cài đặt và chạy

1. Cài đặt các dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Tạo file `.env` từ file `.env.example` và cập nhật các biến môi trường cần thiết.

3. Khởi động các dịch vụ:
   ```bash
   # Khởi động API Gateway
   cd services/api-gateway
   npm start

   # Khởi động các dịch vụ khác tương tự
   cd ../auth-service
   npm start
   ```

Hoặc sử dụng `docker-compose` để khởi động tất cả các dịch vụ cùng lúc:

```bash
docker-compose up --build
```

## Kiểm tra hoạt động

Sau khi khởi động các dịch vụ, bạn có thể kiểm tra bằng cách truy cập:

- API Gateway: http://localhost:3000/health
- Auth Service: http://localhost:3003/health
- User Service: http://localhost:3001/health
- Posts Service: http://localhost:3002/health
- Categories Service: http://localhost:3009/health
- Tags Service: http://localhost:3006/health
- Comments Service: http://localhost:3008/health

## Ghi chú

- Đảm bảo tất cả các dịch vụ đang chạy trước khi truy cập từ frontend.
- Kiểm tra log của từng dịch vụ để phát hiện lỗi nếu có.
