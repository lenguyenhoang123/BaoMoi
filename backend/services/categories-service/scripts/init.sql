-- Xóa trigger nếu tồn tại
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_categories_updated_at') THEN
    DROP TRIGGER update_categories_updated_at ON categories;
  END IF;
END $$;

-- Xóa bảng categories nếu tồn tại
DROP TABLE IF EXISTS categories CASCADE;

-- Xóa function nếu tồn tại
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    DROP FUNCTION update_updated_at_column() CASCADE;
  END IF;
END $$;

-- Tạo bảng categories
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  parent_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Thêm dữ liệu mẫu
INSERT INTO categories (name, slug, description)
VALUES 
('Thời sự', 'thoi-su', 'Tin tức thời sự trong nước và quốc tế'),
('Kinh tế', 'kinh-te', 'Tin tức kinh tế, tài chính, doanh nghiệp'),
('Xã hội', 'xa-hoi', 'Tin tức xã hội, đời sống'),
('Giải trí', 'giai-tri', 'Tin tức giải trí, phim ảnh, âm nhạc'),
('Thể thao', 'the-thao', 'Tin tức thể thao trong nước và quốc tế')
ON CONFLICT (slug) DO NOTHING;

-- Tạo function cập nhật thời gian
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tạo trigger
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
