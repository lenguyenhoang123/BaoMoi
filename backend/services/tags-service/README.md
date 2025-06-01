# Tags Service

Dịch vụ quản lý tags cho hệ thống Báo Mới.

## Yêu cầu

- Node.js 16+
- PostgreSQL 13+
- npm hoặc yarn

## Cài đặt

1. Cài đặt dependencies:
```bash
npm install
```

2. Tạo file .env từ mẫu:
```bash
cp .env.example .env
```

3. Chỉnh sửa file .env theo cấu hình của bạn

## Chạy ứng dụng

- Chế độ phát triển:
```bash
npm run dev
```

- Chế độ production:
```bash
npm run build
npm start
```

## API Endpoints

- `GET /api/tags` - Lấy danh sách tags
- `POST /api/tags` - Tạo tag mới
- `GET /api/tags/:id` - Lấy chi tiết tag
- `PUT /api/tags/:id` - Cập nhật tag
- `DELETE /api/tags/:id` - Xóa tag

## Kiểm thử

```bash
npm test
```

## Linting

```bash
npm run lint
```
