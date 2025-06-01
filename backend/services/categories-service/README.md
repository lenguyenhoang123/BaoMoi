# Categories Service

Dịch vụ quản lý danh mục cho ứng dụng Báo Mới, được phát triển bằng TypeScript.

## 🚀 Yêu cầu hệ thống

- Node.js 18.x trở lên
- PostgreSQL 12.x trở lên
- npm 9.x trở lên hoặc yarn 1.22.x trở lên
- TypeScript 5.x

## Cài đặt

1. Sao chép file cấu hình môi trường:
   ```bash
   cp .env.example .env
   ```

2. Cập nhật các biến môi trường trong file `.env` theo cấu hình của bạn.

3. Cài đặt các dependencies:
   ```bash
   npm install
   ```

4. Chạy migrations để tạo bảng dữ liệu:
   ```bash
   npm run migrate
   ```

## Khởi động

- Chạy ở chế độ development:
  ```bash
  npm run dev
  ```

- Chạy ở chế độ production:
  ```bash
  npm start
  ```

- Chạy với chế độ debug:
  ```bash
  npm run debug
  ```

## API Endpoints

### Danh mục

- `GET /api/categories` - Lấy danh sách tất cả danh mục
- `GET /api/categories/:id` - Lấy thông tin chi tiết một danh mục
- `POST /api/categories` - Tạo mới danh mục (Yêu cầu xác thực)
- `PUT /api/categories/:id` - Cập nhật danh mục (Yêu cầu xác thực)
- `DELETE /api/categories/:id` - Xóa danh mục (Yêu cầu xác thực)

### Health Check

- `GET /health` - Kiểm tra trạng thái dịch vụ

## Biến môi trường

Xem file `.env.example` để biết danh sách đầy đủ các biến môi trường có thể cấu hình.

## Kiểm thử

```bash
npm test
```

## Kiểm tra lỗi cú pháp

```bash
npm run lint
```

## Đóng góp

1. Fork repository
2. Tạo branch mới (`git checkout -b feature/AmazingFeature`)
3. Commit các thay đổi (`git commit -m 'Add some AmazingFeature'`)
4. Push lên branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## Giấy phép

Dự án này được cấp phép theo giấy phép MIT - xem file [LICENSE](LICENSE) để biết thêm chi tiết.
