const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Lấy thông tin kết nối từ biến môi trường
const pool = new Pool({
  host: process.env.CATEGORIES_DB_HOST || 'localhost',
  port: process.env.CATEGORIES_DB_PORT || 5432,
  database: process.env.CATEGORIES_DB_NAME || 'categories_db',
  user: process.env.CATEGORIES_DB_USER || 'postgres',
  password: process.env.CATEGORIES_DB_PASSWORD || '123',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Dữ liệu mẫu cho danh mục
const sampleCategories = [
  {
    name: 'Thời sự',
    slug: 'thoi-su',
    description: 'Tin tức thời sự trong nước và quốc tế',
    parent_id: null
  },
  {
    name: 'Kinh tế',
    slug: 'kinh-te',
    description: 'Tin tức kinh tế, tài chính, doanh nghiệp',
    parent_id: null
  },
  {
    name: 'Xã hội',
    slug: 'xa-hoi',
    description: 'Tin tức xã hội, đời sống',
    parent_id: null
  },
  {
    name: 'Giải trí',
    slug: 'giai-tri',
    description: 'Tin tức giải trí, phim ảnh, âm nhạc',
    parent_id: null
  },
  {
    name: 'Thể thao',
    slug: 'the-thao',
    description: 'Tin tức thể thao trong nước và quốc tế',
    parent_id: null
  },
  {
    name: 'Bóng đá',
    slug: 'bong-da',
    description: 'Tin tức bóng đá trong nước và quốc tế',
    parent_id: 5 // ID của Thể thao
  },
  {
    name: 'Tennis',
    slug: 'tennis',
    description: 'Tin tức Tennis',
    parent_id: 5 // ID của Thể thao
  }
];

async function seedCategories() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Đang kết nối đến database...');
    await client.query('BEGIN');

    console.log('📝 Đang thêm dữ liệu mẫu cho bảng categories...');
    
    // Xóa dữ liệu cũ
    await client.query('TRUNCATE TABLE categories RESTART IDENTITY CASCADE');
    
    // Thêm dữ liệu mẫu
    for (const category of sampleCategories) {
      await client.query(
        `INSERT INTO categories (name, slug, description, parent_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())`,
        [
          category.name,
          category.slug,
          category.description,
          category.parent_id
        ]
      );
    }

    await client.query('COMMIT');
    console.log('✅ Đã thêm dữ liệu mẫu thành công!');
    
    // Hiển thị danh sách categories đã thêm
    const result = await client.query(`
      WITH RECURSIVE category_tree AS (
        SELECT id, name, slug, parent_id, 0 as level
        FROM categories
        WHERE parent_id IS NULL
        
        UNION ALL
        
        SELECT c.id, c.name, c.slug, c.parent_id, ct.level + 1
        FROM categories c
        JOIN category_tree ct ON c.parent_id = ct.id
      )
      SELECT id, name, slug, parent_id, level
      FROM category_tree
      ORDER BY level, name
    `);
    
    console.log('\n📋 Danh sách danh mục đã thêm:');
    console.table(result.rows);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Lỗi khi thêm dữ liệu mẫu:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Chạy hàm seed
seedCategories()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  });
