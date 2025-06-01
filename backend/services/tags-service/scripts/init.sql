-- Xóa trigger nếu tồn tại
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tags_updated_at') THEN
    DROP TRIGGER update_tags_updated_at ON tags;
  END IF;
END $$;

-- Xóa bảng post_tags nếu tồn tại
DROP TABLE IF EXISTS post_tags CASCADE;

-- Xóa bảng tags nếu tồn tại
DROP TABLE IF EXISTS tags CASCADE;

-- Xóa function nếu tồn tại
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    DROP FUNCTION update_updated_at_column() CASCADE;
  END IF;
END $$;

-- Bật extension cho UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tạo bảng tags
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) UNIQUE NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tạo bảng post_tags
CREATE TABLE IF NOT EXISTS post_tags (
  post_id UUID NOT NULL,
  tag_id UUID NOT NULL,
  PRIMARY KEY (post_id, tag_id),
  CONSTRAINT fk_tag
    FOREIGN KEY(tag_id) 
    REFERENCES tags(id)
    ON DELETE CASCADE
);

-- Tạo index
CREATE INDEX IF NOT EXISTS idx_post_tags_post ON post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_tags_tag ON post_tags(tag_id);

-- Thêm dữ liệu mẫu
INSERT INTO tags (id, name, slug, created_at)
VALUES 
('11111111-1111-1111-1111-111111111111', 'Tin nóng', 'tin-nong', NOW()),
('22222222-2222-2222-2222-222222222222', 'Phân tích', 'phan-tich', NOW()),
('33333333-3333-3333-3333-333333333333', 'Bình luận', 'binh-luan', NOW()),
('44444444-4444-4444-4444-444444444444', 'Điểm báo', 'diem-bao', NOW()),
('55555555-5555-5555-5555-555555555555', 'Thị trường', 'thi-truong', NOW())
ON CONFLICT (slug) DO NOTHING;
