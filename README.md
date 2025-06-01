# Ứng dụng Báo Điện Tử

Đây là dự án báo điện tử được xây dựng bằng Next.js cho frontend và kiến trúc microservices cho backend sử dụng Node.js và Express.

## 🚀 Công nghệ sử dụng

### Frontend (Next.js)
- Next.js 14 với App Router
- TypeScript
- TailwindCSS cho giao diện
- React Hook Form cho xử lý form
- React Query cho quản lý server state
- NextAuth.js cho xác thực
- Shadcn/ui cho component UI

### Backend (Microservices)
- **API Gateway**: Node.js với Express, xử lý định tuyến và CORS
- **Auth Service**: Xác thực người dùng, JWT, OTP
- **Posts Service**: Quản lý bài viết
- **Categories Service**: Quản lý danh mục
- **Tags Service**: Quản lý thẻ bài viết
- **Comments Service**: Quản lý bình luận

### Công nghệ khác
- **Cơ sở dữ liệu**: PostgreSQL
- **ORM**: Prisma
- **Xác thực**: JWT, OTP qua email
- **API**: RESTful API

## 📁 Cấu trúc dự án

```
bao-moi-react/
├── frontend/                 # Ứng dụng Next.js
│   ├── src/
│   │   ├── app/             # App Router
│   │   ├── components/       # Components dùng chung
│   │   ├── lib/              # Utilities, helpers
│   │   └── styles/           # Global styles
│   └── public/               # Static files
│
└── backend/                 # Các dịch vụ backend
    ├── services/
    │   ├── api-gateway/    # API Gateway
    │   ├── auth-service/     # Xác thực người dùng
    │   ├── posts-service/    # Quản lý bài viết
    │   ├── categories-service/# Quản lý danh mục
    │   ├── tags-service/     # Quản lý thẻ
    │   └── comments-service/ # Quản lý bình luận
    └── .env.example         # Mẫu file cấu hình
```

## 🚀 Bắt đầu

### Yêu cầu hệ thống
- Node.js 18+
- npm 9+ hoặc pnpm 8+
- PostgreSQL 14+

### Chạy thủ công

1. **Cài đặt frontend**
```bash
cd frontend
pnpm install
pnpm dev
```

2. **Cài đặt backend**
Mỗi service cần được cài đặt và chạy riêng:

```bash
# Vào thư mục service
cd backend/services/auth-service

# Cài đặt dependencies
pnpm install

# Chạy service
pnpm dev
```

## 🌐 Các endpoint chính

- **Frontend**: http://localhost:3004
- **API Gateway**: http://localhost:3000
- **Auth Service**: http://localhost:3005
- **Posts Service**: http://localhost:3002
- **Categories Service**: http://localhost:3009
- **Tags Service**: http://localhost:3006
- **Comments Service**: http://localhost:3008

## 🔒 Biến môi trường

Mỗi service có file `.env` riêng. Sao chép từ file `.env.example` và điền các giá trị phù hợp.

## 📝 Ghi chú phát triển

- Luôn chạy `pnpm lint` trước khi commit code
- Sử dụng Conventional Commits cho thông điệp commit
- Tạo pull request mới cho mỗi tính năng/sửa lỗi
```bash
cd backend
npm install
```

2. Tạo file `.env` từ `.env.example` và cập nhật các biến môi trường

3. Khởi động các service:
```bash
# Khởi động API Gateway
cd services/api-gateway
npm start

# Khởi động các service khác tương tự
cd ../auth-service
npm start
```

Hoặc sử dụng Docker:
```bash
docker-compose up --build
```

## Các lệnh thường dùng

- `npm start`: Khởi động ứng dụng ở chế độ phát triển
- `npm run build`: Build ứng dụng cho production
- `npm test`: Chạy các test
- `npm run lint`: Kiểm tra lỗi code

## Hướng dẫn phát triển

1. Tạo nhánh mới cho tính năng mới:
   ```bash
   git checkout -b feature/tên-tính-năng
   ```

2. Commit code thường xuyên với thông điệp rõ ràng

3. Tạo pull request khi hoàn thành tính năng

## Liên hệ

Nếu có bất kỳ câu hỏi nào, vui lòng liên hệ:
- Email: your.email@example.com
- Điện thoại: 0123 456 789

## Giấy phép

Dự án được phát triển bởi [Tên tổ chức/cá nhân] và được cấp phép theo [Tên giấy phép].
