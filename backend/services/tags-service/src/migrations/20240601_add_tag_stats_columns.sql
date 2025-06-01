-- +goose Up
-- SQL in this section is executed when the migration is applied

-- Thêm các cột mới cho thống kê và xếp hạng tag
ALTER TABLE tags 
ADD COLUMN IF NOT EXISTS post_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS follower_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS trending_score FLOAT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS trending_updated_at TIMESTAMP WITH TIME ZONE;

-- Tạo index cho các cột mới
CREATE INDEX IF NOT EXISTS idx_tags_post_count ON tags(post_count);
CREATE INDEX IF NOT EXISTS idx_tags_follower_count ON tags(follower_count);
CREATE INDEX IF NOT EXISTS idx_tags_trending_score ON tags(trending_score);

-- Tạo bảng theo dõi tag của người dùng
CREATE TABLE IF NOT EXISTS user_tag_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, tag_id)
);

-- Tạo index cho bảng user_tag_follows
CREATE INDEX IF NOT EXISTS idx_user_tag_follows_user_id ON user_tag_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tag_follows_tag_id ON user_tag_follows(tag_id);

-- +goose Down
-- SQL in this section is executed when the migration is rolled back

-- Xóa các index
DROP INDEX IF EXISTS idx_tags_post_count;
DROP INDEX IF EXISTS idx_tags_follower_count;
DROP INDEX IF EXISTS idx_tags_trending_score;
DROP INDEX IF EXISTS idx_user_tag_follows_user_id;
DROP INDEX IF EXISTS idx_user_tag_follows_tag_id;

-- Xóa bảng user_tag_follows
DROP TABLE IF EXISTS user_tag_follows;

-- Xóa các cột đã thêm
ALTER TABLE tags 
DROP COLUMN IF EXISTS post_count,
DROP COLUMN IF EXISTS follower_count,
DROP COLUMN IF EXISTS trending_score,
DROP COLUMN IF EXISTS trending_updated_at;
