-- Tạo bảng categories
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tạo index cho các trường thường dùng
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

-- Thêm trigger để cập nhật updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_categories_modtime
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Thêm dữ liệu mẫu (tùy chọn)
INSERT INTO categories (name, slug, description) VALUES 
('Tin tức', 'tin-tuc', 'Các tin tức mới nhất'),
('Thể thao', 'the-thao', 'Tin tức thể thao trong và ngoài nước'),
('Giải trí', 'giai-tri', 'Tin tức giải trí, điện ảnh, âm nhạc')
ON CONFLICT (slug) DO NOTHING;
