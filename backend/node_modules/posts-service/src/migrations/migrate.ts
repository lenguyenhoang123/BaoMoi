require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
const { Pool } = require('pg');
const path = require('path');

// Sử dụng cấu hình database từ file database.ts
const dbConfig = {
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'posts_db',
  password: process.env.POSTGRES_PASSWORD || '123',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
};

console.log('Kết nối đến database với cấu hình:', {
  ...dbConfig,
  password: dbConfig.password ? '***' : 'không có'
});

// Tạo kết nối đến database
const pool = new Pool(dbConfig);

// Hàm thực thi migration
async function runMigration() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Kiểm tra xem bảng posts có cột category không
    const checkCategoryColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'posts' AND column_name = 'category';
    `);
    
    if (checkCategoryColumn.rows.length > 0) {
      console.log('Thêm cột category_id...');
      
      // Thêm cột category_id nếu chưa tồn tại
      await client.query(`
        ALTER TABLE posts 
        ADD COLUMN IF NOT EXISTS category_id INTEGER,
        ADD CONSTRAINT fk_category 
          FOREIGN KEY (category_id) 
          REFERENCES categories(id)
          ON DELETE SET NULL;
      `);
      
      console.log('Kiểm tra dữ liệu trong cột category...');
      
      // Lấy tất cả các giá trị duy nhất trong cột category
      const categoriesResult = await client.query(`
        SELECT DISTINCT category 
        FROM posts 
        WHERE category IS NOT NULL AND category != ''
      `);
      
      console.log('Các giá trị category tìm thấy:', categoriesResult.rows);
      
      // Tạo bảng tạm để lưu trữ ánh xạ từ category sang category_id
      await client.query(`
        CREATE TEMP TABLE IF NOT EXISTS category_mapping (
          category_name TEXT PRIMARY KEY,
          category_id INTEGER
        )
      `);
      
      // Thêm các category mới vào bảng categories nếu chưa tồn tại
      for (const row of categoriesResult.rows) {
        const categoryName = row.category;
        
        // Kiểm tra xem category đã tồn tại chưa
        const checkCategory = await client.query(
          'SELECT id FROM categories WHERE name = $1', 
          [categoryName]
        );
        
        let categoryId;
        
        if (checkCategory.rows.length > 0) {
          // Nếu đã tồn tại, lấy ID hiện có
          categoryId = checkCategory.rows[0].id;
          console.log(`Sử dụng category có sẵn: ${categoryName} (ID: ${categoryId})`);
        } else {
          // Nếu chưa tồn tại, tạo mới
          const newCategory = await client.query(
            'INSERT INTO categories (name, slug) VALUES ($1, $2) RETURNING id',
            [categoryName, categoryName.toLowerCase().replace(/\s+/g, '-')]
          );
          categoryId = newCategory.rows[0].id;
          console.log(`Đã tạo mới category: ${categoryName} (ID: ${categoryId})`);
        }
        
        // Lưu vào bảng ánh xạ
        await client.query(
          'INSERT INTO category_mapping (category_name, category_id) VALUES ($1, $2) ' +
          'ON CONFLICT (category_name) DO UPDATE SET category_id = EXCLUDED.category_id',
          [categoryName, categoryId]
        );
      }
      
      // Cập nhật category_id dựa trên bảng ánh xạ
      console.log('Cập nhật dữ liệu từ cột category sang category_id...');
      await client.query(`
        UPDATE posts p
        SET category_id = cm.category_id
        FROM category_mapping cm
        WHERE p.category = cm.category_name
        AND p.category IS NOT NULL
        AND p.category != '';
      `);
      
      console.log('Xóa cột category cũ...');
      // Xóa cột cũ
      await client.query(`
        ALTER TABLE posts 
        DROP COLUMN category;
      `);
      
      console.log('Migration hoàn thành thành công!');
    } else {
      console.log('Cột category đã được đổi tên thành category_id trước đó');
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Lỗi khi chạy migration:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Chạy migration
runMigration()
  .then(() => {
    console.log('Migration hoàn tất');
    process.exit(0);
  })
  .catch(error => {
    console.error('Lỗi:', error);
    process.exit(1);
  });
