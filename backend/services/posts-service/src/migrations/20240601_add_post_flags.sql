-- +goose Up
-- SQL in this section is executed when the migration is applied

-- Thêm các cột mới cho bài viết nổi bật
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS featured_order INTEGER,
ADD COLUMN IF NOT EXISTS featured_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_hot BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS hot_order INTEGER,
ADD COLUMN IF NOT EXISTS hot_expires_at TIMESTAMP WITH TIME ZONE;

-- Tạo index cho các cột mới
CREATE INDEX IF NOT EXISTS idx_posts_is_featured ON posts(is_featured);
CREATE INDEX IF NOT EXISTS idx_posts_featured_order ON posts(featured_order);
CREATE INDEX IF NOT EXISTS idx_posts_featured_expires ON posts(featured_expires_at);
CREATE INDEX IF NOT EXISTS idx_posts_is_hot ON posts(is_hot);
CREATE INDEX IF NOT EXISTS idx_posts_hot_order ON posts(hot_order);
CREATE INDEX IF NOT EXISTS idx_posts_hot_expires ON posts(hot_expires_at);

-- +goose Down
-- SQL in this section is executed when the migration is rolled back

-- Xóa các index
DROP INDEX IF EXISTS idx_posts_is_featured;
DROP INDEX IF EXISTS idx_posts_featured_order;
DROP INDEX IF EXISTS idx_posts_featured_expires;
DROP INDEX IF EXISTS idx_posts_is_hot;
DROP INDEX IF EXISTS idx_posts_hot_order;
DROP INDEX IF EXISTS idx_posts_hot_expires;

-- Xóa các cột đã thêm
ALTER TABLE posts 
DROP COLUMN IF EXISTS is_featured,
DROP COLUMN IF EXISTS featured_order,
DROP COLUMN IF EXISTS featured_expires_at,
DROP COLUMN IF EXISTS is_hot,
DROP COLUMN IF EXISTS hot_order,
DROP COLUMN IF EXISTS hot_expires_at;
