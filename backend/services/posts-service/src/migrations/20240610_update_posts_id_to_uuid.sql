-- Bước 1: Thêm cột tạm mới kiểu UUID
ALTER TABLE posts ADD COLUMN temp_id UUID DEFAULT gen_random_uuid();

-- Bước 2: Cập nhật dữ liệu từ id cũ sang cột tạm mới
-- (Bỏ qua bước này nếu bảng chưa có dữ liệu)
-- UPDATE posts SET temp_id = gen_random_uuid();

-- Bước 3: Xóa ràng buộc khóa ngoại (nếu có)
-- Lưu ý: Cần xử lý thủ công các bảng có khóa ngoại đến posts.id

-- Bước 4: Xóa cột id cũ
ALTER TABLE posts DROP COLUMN id;

-- Bước 5: Đổi tên cột tạm thành id
ALTER TABLE posts RENAME COLUMN temp_id TO id;

-- Bước 6: Đặt lại ràng buộc khóa chính
ALTER TABLE posts ADD PRIMARY KEY (id);

-- Bước 7: Thêm lại các ràng buộc khóa ngoại (nếu có)
-- ALTER TABLE child_table ADD CONSTRAINT fk_child_post 
-- FOREIGN KEY (post_id) REFERENCES posts(id);

-- Bước 8: Đảm bảo cột id không null
ALTER TABLE posts ALTER COLUMN id SET NOT NULL;

-- Bước 9: Tạo extension nếu chưa có
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
