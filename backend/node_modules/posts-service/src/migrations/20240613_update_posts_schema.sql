-- Tạo bảng mới với cấu trúc mới
CREATE TABLE new_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    content TEXT NOT NULL,
    excerpt TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    tags VARCHAR(255)[],
    image_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sao chép dữ liệu từ bảng cũ sang bảng mới
-- Lưu ý: Chỉ sao chép các trường còn tồn tại trong bảng mới
INSERT INTO new_posts (
    id, title, slug, content, excerpt, status, 
    tags, image_url, created_at, updated_at
)
SELECT 
    id, 
    COALESCE(title, ''), 
    COALESCE(slug, ''), 
    COALESCE(content, ''), 
    excerpt, 
    COALESCE(status, 'draft'),
    tags,
    image_url,
    COALESCE(created_at, NOW()),
    COALESCE(updated_at, NOW())
FROM posts;

-- Đổi tên bảng cũ và bảng mới
DROP TABLE IF EXISTS old_posts;
ALTER TABLE posts RENAME TO old_posts;
ALTER TABLE new_posts RENAME TO posts;

-- Tạo lại các index
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);

-- Tạo lại trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Áp dụng trigger cho bảng posts
DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at
BEFORE UPDATE ON posts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Xóa bảng cũ nếu cần
-- DROP TABLE IF EXISTS old_posts;
