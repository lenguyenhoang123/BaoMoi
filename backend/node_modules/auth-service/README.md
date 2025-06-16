# Auth Service

Dịch vụ xác thực và quản lý người dùng cho hệ thống Báo Mới, được xây dựng với Node.js, TypeScript, Express và PostgreSQL.

## Tính năng chính

- Đăng ký tài khoản mới
- Đăng nhập bằng email/mật khẩu
- Xác thực email
- Quên mật khẩu
- Đặt lại mật khẩu
- Quản lý phiên đăng nhập với JWT
- Phân quyền người dùng
- Bảo mật: Mã hóa mật khẩu, chống tấn công brute force

## Yêu cầu hệ thống

- Node.js 16.x trở lên
- PostgreSQL 12.x trở lên
- npm hoặc yarn

## Cài đặt

1. **Sao chép repository**

```bash
git clone <repository-url>
cd auth-service
```

2. **Cài đặt dependencies**

```bash
npm install
# hoặc
yarn install
```

3. **Cấu hình môi trường**

Tạo file `.env` từ file mẫu:

```bash
cp .env.example .env
```

Chỉnh sửa file `.env` theo cấu hình của bạn.

4. **Chạy migrations**

```bash
npx sequelize-cli db:migrate
```

5. **Chạy ứng dụng**

```bash
# Chế độ phát triển
npm run dev

# Hoặc chế độ production
npm run build
npm start
```

## Cấu trúc thư mục

```
src/
├── config/             # Cấu hình ứng dụng
├── controllers/        # Xử lý request/response
├── interfaces/         # Interfaces TypeScript
├── middlewares/        # Express middlewares
├── models/             # Database models
├── routes/             # Định nghĩa routes
├── services/           # Business logic
├── utils/              # Tiện ích
├── validators/         # Xác thực dữ liệu
├── server.ts           # Khởi tạo server
└── index.ts            # Điểm vào ứng dụng
```

## API Endpoints

### Xác thực

- `POST /api/auth/register` - Đăng ký tài khoản mới
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin người dùng hiện tại
- `POST /api/auth/refresh-token` - Làm mới token
- `POST /api/auth/logout` - Đăng xuất
- `POST /api/auth/forgot-password` - Quên mật khẩu
- `POST /api/auth/reset-password` - Đặt lại mật khẩu
- `GET /api/auth/verify-email` - Xác thực email
- `POST /api/auth/resend-verification-email` - Gửi lại email xác thực

## Biến môi trường

Xem file `.env.example` để biết các biến môi trường cần thiết.

## Phát triển

### Lệnh có sẵn

- `npm run dev` - Chạy ứng dụng ở chế độ phát triển với nodemon
- `npm run build` - Biên dịch TypeScript sang JavaScript
- `npm start` - Chạy ứng dụng ở chế độ production
- `npm run lint` - Kiểm tra lỗi code với ESLint
- `npm run lint:fix` - Tự động sửa lỗi code
- `npm test` - Chạy tests

### Quy tắc code

- Sử dụng TypeScript cho toàn bộ mã nguồn
- Tuân thủ [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- Viết test cho các tính năng mới
- Sử dụng commit message theo quy ước [Conventional Commits](https://www.conventionalcommits.org/)

## Triển khai

### Docker

```bash
# Build image
docker build -t auth-service .

# Chạy container
docker run -p 3003:3003 --env-file .env auth-service
```

### PM2

```bash
# Cài đặt PM2 toàn cục
npm install -g pm2

# Chạy ứng dụng
pm2 start dist/index.js --name "auth-service"

# Xem logs
pm2 logs auth-service
```

## Bảo mật

- Tất cả mật khẩu đều được mã hóa bằng bcrypt
- Sử dụng JWT với thời hạn ngắn và refresh token
- Giới hạn số lần đăng nhập thất bại
- Sử dụng HTTPS trong môi trường production
- Validate tất cả đầu vào từ người dùng

## Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng đọc [hướng dẫn đóng góp](CONTRIBUTING.md) để biết thêm chi tiết.

## Giấy phép

Dự án này được cấp phép theo giấy phép MIT - xem file [LICENSE](LICENSE) để biết thêm chi tiết.
