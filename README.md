# Ứng Dụng Báo Điện Tử

Dự án báo điện tử hiện đại được xây dựng với kiến trúc microservices, sử dụng Next.js cho frontend và Node.js với Express cho backend.

## 🌟 Tính Năng Nổi Bật

- 🚀 Hệ thống tin tức thời gian thực với kiến trúc microservices
- 🔒 Bảo mật đa tầng với xác thực hai yếu tố qua email OTP
- 📱 Giao diện đáp ứng mọi thiết bị nhờ TailwindCSS
- 📊 Hệ thống ghi log tập trung, chi tiết và dễ dàng giám sát
- 🛡️ Bảo mật cao với JWT, CORS và các biện pháp bảo vệ khác
- ⚡ Tối ưu hiệu năng với React Query và Server Components

## 🚀 Công Nghệ Sử Dụng

### Frontend (Next.js)
- **Framework**: Next.js 14 với App Router
- **Ngôn ngữ**: TypeScript
- **Giao diện**: TailwindCSS kết hợp Shadcn/ui
- **Quản lý form**: React Hook Form
- **Quản lý trạng thái**: React Query
- **Xác thực**: NextAuth.js
- **UI Components**: Shadcn/ui

### Backend (Microservices)
- **API Gateway**: Xử lý định tuyến, CORS và bảo mật
- **Dịch vụ Xác thực**: Đăng nhập, đăng ký, xác thực OTP
- **Dịch vụ Bài viết**: Quản lý nội dung bài báo
- **Dịch vụ Danh mục**: Phân loại bài viết
- **Dịch vụ Thẻ**: Gắn thẻ và tìm kiếm bài viết
- **Dịch vụ Bình luận**: Quản lý tương tác người dùng

### Công Nghệ Khác
- **Cơ sở dữ liệu**: PostgreSQL
- **ORM**: Prisma cho tương tác database

## Cấu Trúc Dự Án

```
bao-moi/
├── frontend/                 # Ứng dụng Next.js
│   ├── src/
│   │   ├── app/             # Định tuyến ứng dụng (App Router)
│   │   ├── components/       # Các thành phần giao diện dùng chung
│   │   ├── lib/              # Tiện ích và helper functions
│   │   ├── hooks/            # Custom React hooks
│   │   ├── stores/           # Quản lý trạng thái toàn cục
│   │   └── styles/           # CSS toàn cục và biến
│   └── public/               # Tài nguyên tĩnh (hình ảnh, fonts,...)
|
└── backend/                 # Hệ thống backend
    ├── services/
    │   ├── api-gateway/    # Cổng giao tiếp API
    │   ├── auth-service/     # Xác thực và phân quyền
    │   ├── posts-service/    # Quản lý nội dung bài viết
    │   ├── categories-service/# Quản lý danh mục tin tức
    │   ├── tags-service/     # Quản lý từ khóa và thẻ
    │   └── comments-service/ # Quản lý bình luận
    ├── shared/              # Thư viện dùng chung
    └── .env.example         # Mẫu cấu hình môi trường
```

## Bắt Đầu

### Yêu Cầu Hệ Thống
- Node.js 18 trở lên
- pnpm 8+ (khuyến nghị) hoặc npm 9+
- PostgreSQL 14 trở lên
- Git để quản lý phiên bản

### Cấu Hình Ghi Log

Hệ thống sử dụng Winston với các tính năng nổi bật:
- Ghi log vào file với cơ chế xoay vòng (tối đa 5 file, mỗi file 5MB)
- Định dạng log dễ đọc và phân tích
- Phân cấp mức độ log (lỗi, cảnh báo, thông tin, gỡ lỗi)
- Tự động xử lý các ngoại lệ không được bắt
- Tùy chỉnh mức độ chi tiết log theo từng môi trường

Cấu hình mặc định:
- Môi trường phát triển: Hiển thị đầy đủ log với màu sắc
- Môi trường sản phẩm: Chỉ ghi lại các lỗi vào file

### Cách Chạy Thủ Công

1. **Cài đặt Frontend**
```bash
# Di chuyển vào thư mục frontend
cd frontend

# Cài đặt các thư viện cần thiết
pnpm install

# Khởi động máy chủ phát triển
pnpm dev
```

2. **Cài đặt Backend**
Mỗi dịch vụ cần được cài đặt và chạy riêng biệt:

```bash
# Cài đặt các thư viện chung cho backend
cd backend
pnpm install

# Vào thư mục dịch vụ (ví dụ: auth-service)
cd services/auth-service

# Cài đặt các thư viện cho dịch vụ
pnpm install

# Sao chép file cấu hình mẫu
cp .env.example .env

# Chỉnh sửa cấu hình trong file .env theo môi trường

# Khởi động dịch vụ
pnpm dev
```

### Chạy Bằng Docker (Khuyến Nghị)

```bash
# Xây dựng và chạy tất cả dịch vụ
docker-compose up --build

# Hoặc chạy ở chế độ nền (background)
docker-compose up -d

# Xem log của các container
docker-compose logs -f
```

## 🌐 Các Điểm Cuối (Endpoints) Chính

- **Giao Diện Người Dùng**: http://localhost:3004
- **Cổng Giao Tiếp API**: http://localhost:3000
- **Dịch Vụ Xác Thực**: http://localhost:3005
- **Dịch Vụ Bài Viết**: http://localhost:3002
- **Dịch Vụ Danh Mục**: http://localhost:3009
- **Dịch Vụ Thẻ**: http://localhost:3006
- **Dịch Vụ Bình Luận**: http://localhost:3008

> **Lưu ý**: Cổng mặc định có thể thay đổi tùy theo cấu hình trong file `.env`

## 🔒 Biến môi trường

Mỗi service có file `.env` riêng. Sao chép từ file `.env.example` và điền các giá trị phù hợp.

## 📝 Hướng Dẫn Phát Triển

### Quy Trình Làm Việc

1. **Trước Khi Commit**
   - Kiểm tra lỗi cú pháp: `pnpm lint`
   - Chạy các bài test: `pnpm test`
   - Định dạng lại code: `pnpm format`
   - Kiểm tra xung đột và lỗi cú pháp

2. **Quy Tắc Đặt Tên Commit**
   - Tuân thủ [Quy ước Commit](https://www.conventionalcommits.org/)
   - Cấu trúc: `loại(phạm vi): mô tả ngắn`
   - Ví dụ: 
     - `feat(đăng nhập): thêm xác thực OTP`
     - `fix(bài viết): sửa lỗi hiển thị tiêu đề`
   - Các loại commit phổ biến:
     - `feat`: Tính năng mới
     - `fix`: Sửa lỗi
     - `docs`: Cập nhật tài liệu
     - `style`: Định dạng code
     - `refactor`: Tái cấu trúc code
     - `test`: Bổ sung test
     - `chore`: Công việc bảo trì

3. **Quy Trình Tạo Pull Request**
   - Mỗi PR chỉ nên tập trung vào một tính năng/sửa lỗi
   - Mô tả rõ ràng:
     - Mục đích của thay đổi
     - Cách kiểm tra
     - Ảnh chụp màn hình (nếu cần)
   - Yêu cầu review từ ít nhất một thành viên trong nhóm
   - Đảm bảo CI/CD pass trước khi merge

### Giám Sát Và Gỡ Lỗi

1. **Theo Dõi Log Hệ Thống**
   - Đường dẫn lưu log: `logs/` trong mỗi dịch vụ
   - Các file log chính:
     - `combined.log`: Ghi lại tất cả các yêu cầu
     - `error.log`: Chỉ ghi lại các lỗi
   - Khi sử dụng Docker: `docker-compose logs -f tên_dịch_vụ`

2. **Giám Sát Hiệu Năng**
   - Sử dụng công cụ tích hợp sẵn của Node.js
   - Bật chế độ debug chi tiết: `DEBUG=*`
   - Sử dụng `--inspect` để debug với Chrome DevTools
   - Theo dõi hiệu năng với các công cụ như PM2 hoặc New Relic

## 📋 Các Lệnh Thường Dùng

### Frontend
- `pnpm dev`: Khởi động máy chủ phát triển
- `pnpm build`: Build ứng dụng cho môi trường production
- `pnpm start`: Chạy ứng dụng đã build
- `pnpm lint`: Kiểm tra lỗi code
- `pnpm test`: Chạy các bài test
- `pnpm format`: Định dạng lại code tự động

### Backend
- `pnpm dev`: Khởi động ở chế độ phát triển (tự động reload)
- `pnpm build`: Biên dịch TypeScript sang JavaScript
- `pnpm start`: Chạy ứng dụng đã build
- `pnpm migrate`: Chạy migrations cơ sở dữ liệu
- `pnpm seed`: Khởi tạo dữ liệu mẫu

## 🔄 Quy Trình Phát Triển

1. **Tạo Nhánh Mới**
   ```bash
   # Từ nhánh develop
   git checkout develop
   git pull
   git checkout -b feature/tên-tính-năng
   ```

2. **Commit Thường Xuyên**
   - Mỗi commit nên thực hiện một thay đổi nhỏ, cụ thể
   - Sử dụng tiếng Anh hoặc tiếng Việt nhất quán
   - Thông điệp rõ ràng, mô tả lý do thay đổi

3. **Đồng Bộ Với Nhánh Chính**
   ```bash
   git fetch origin
   git rebase origin/develop
   ```

4. **Tạo Pull Request**
   - Tạo PR từ nhánh tính năng vào `develop`
   - Mô tả rõ ràng các thay đổi
   - Yêu cầu review từ đồng đội

## 🛠️ Xử Lý Sự Cố Thường Gặp

### 1. Lỗi Kết Nối Database
**Triệu chứng**:
- Ứng dụng không thể kết nối đến PostgreSQL
- Lỗi "Connection refused" hoặc "Authentication failed"

**Cách khắc phục**:
1. Kiểm tra dịch vụ PostgreSQL đang chạy
2. Xác minh thông tin trong file `.env`:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=mật_khẩu
   DB_NAME=tên_database
   ```
3. Kiểm tra quyền truy cập của người dùng database
4. Xem log chi tiết: `docker-compose logs tên_dịch_vụ`

### 2. Lỗi Xác Thực JWT
**Triệu chứng**:
- Lỗi "Invalid token" hoặc "Unauthorized"
- Token hết hạn hoặc không hợp lệ

**Cách khắc phục**:
1. Kiểm tra `JWT_SECRET` trong `.env`
2. Đảm bảo token được gửi trong header:
   ```
   Authorization: Bearer <token>
   ```
3. Kiểm tra thời gian hết hạn của token
4. Xác nhận token được tạo từ cùng một `JWT_SECRET`

### 3. Vấn Đề Về OTP
**Triệu chứng**:
- Không nhận được email OTP
- Mã OTP không hoạt động

**Cách khắc phục**:
1. Kiểm tra cấu hình email trong `.env`
2. Xác nhận OTP chưa hết hạn (mặc định 5 phút)
3. Kiểm tra thư rác trong hộp thư
4. Xem log của dịch vụ xác thực để kiểm tra lỗi gửi email

## 🤝 Đóng Góp

Chúng tôi đánh giá cao mọi đóng góp của bạn! Để bắt đầu:

1. Fork repository
2. Tạo nhánh mới: `git checkout -b feature/tinh-nang-moi`
3. Commit các thay đổi: `git commit -m 'feat: thêm tính năng mới'`
4. Đẩy lên nhánh: `git push origin feature/tinh-nang-moi`
5. Tạo Pull Request

Vui lòng đọc [Hướng dẫn đóng góp](CONTRIBUTING.md) để biết thêm chi tiết.

## 📄 Giấy Phép

Dự án được phân phối theo [Giấy phép MIT](LICENSE).

## 📬 Thông Tin Liên Hệ

- **Tác giả**: [Tên của bạn]
- **Email**: your.email@example.com
- **Kho lưu trữ**: [GitHub Repository](https://github.com/yourusername/bao-moi)
- **Vấn đề**: [Tạo issue mới](https://github.com/yourusername/bao-moi/issues/new)

---

<div align="center">
  <p>Được phát triển với ❤️ bởi Đội ngũ Báo Mới</p>
  <p>© 2024 Bản quyền thuộc về Báo Mới</p>
</div>
