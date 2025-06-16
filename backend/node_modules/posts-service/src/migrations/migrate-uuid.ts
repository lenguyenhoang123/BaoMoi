import * as dotenv from 'dotenv';
import * as path from 'path';
import { Pool } from 'pg';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

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

// Hàm kiểm tra extension
interface Client {
  query: (query: string, params?: any[]) => Promise<{ rows: any[] }>;
}

async function extensionExists(client: Client, extensionName: string): Promise<boolean> {
  const result = await client.query(
    `SELECT 1 FROM pg_extension WHERE extname = $1`,
    [extensionName]
  );
  return result.rows.length > 0;
}

// Hàm kiểm tra kiểu dữ liệu cột
async function getColumnType(client: Client, tableName: string, columnName: string): Promise<string | null> {
  const result = await client.query(
    `SELECT data_type 
     FROM information_schema.columns 
     WHERE table_name = $1 AND column_name = $2`,
    [tableName, columnName]
  );
  return result.rows[0]?.data_type || null;
}

// Hàm thực thi migration
async function runMigration() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Bắt đầu quá trình chuyển đổi cột id sang UUID...');
    
    // Kiểm tra và tạo extension nếu chưa có
    const uuidOsspExists = await extensionExists(client, 'uuid-ossp');
    if (!uuidOsspExists) {
      console.log('Tạo extension uuid-ossp...');
      await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    }
    
    // Kiểm tra kiểu dữ liệu của cột id hiện tại
    const idType = await getColumnType(client, 'posts', 'id');
    
    if (idType === 'integer' || idType === 'bigint') {
      console.log(`Đang chuyển đổi cột id từ ${idType.toUpperCase()} sang UUID...`);
      
      // 1. Tạo bảng tạm để lưu trữ ánh xạ id cũ -> id mới
      console.log('Tạo bảng tạm...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS temp_id_mapping (
          old_id INTEGER PRIMARY KEY,
          new_id UUID DEFAULT uuid_generate_v4()
        );
      `);
      
      // 2. Tạo bản sao của dữ liệu hiện có với ID mới
      console.log('Tạo bản sao dữ liệu...');
      await client.query(`
        INSERT INTO temp_id_mapping (old_id)
        SELECT id FROM posts;
      `);
      
      // 3. Tạo bảng mới với cấu trúc mới
      console.log('Tạo bảng mới...');
      await client.query(`
        CREATE TABLE posts_new (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          title VARCHAR(255) NOT NULL,
          content TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          slug VARCHAR(255),
          excerpt TEXT,
          featured_image VARCHAR(255),
          status VARCHAR(20) DEFAULT 'draft',
          view_count INTEGER DEFAULT 0,
          is_featured BOOLEAN DEFAULT false,
          is_hot BOOLEAN DEFAULT false,
          featured_order INTEGER,
          hot_order INTEGER,
          featured_expires_at TIMESTAMP WITH TIME ZONE,
          hot_expires_at TIMESTAMP WITH TIME ZONE
        );
      `);
      
      // 4. Sao chép dữ liệu từ bảng cũ sang bảng mới
      console.log('Sao chép dữ liệu...');
      await client.query(`
        INSERT INTO posts_new (
          id, title, content, created_at, updated_at, slug, excerpt,
          featured_image, status, view_count, is_featured, is_hot,
          featured_order, hot_order, featured_expires_at, hot_expires_at
        )
        SELECT 
          m.new_id, p.title, p.content, p.created_at, p.updated_at, p.slug, p.excerpt,
          p.featured_image, p.status, p.view_count, p.is_featured, p.is_hot,
          p.featured_order, p.hot_order, p.featured_expires_at, p.hot_expires_at
        FROM posts p
        JOIN temp_id_mapping m ON p.id = m.old_id;
      `);
      
      // 5. Đổi tên bảng
      console.log('Đổi tên bảng...');
      await client.query(`
        DROP TABLE posts CASCADE;
        ALTER TABLE posts_new RENAME TO posts;
        DROP TABLE temp_id_mapping;
      `);
      
      console.log('Chuyển đổi hoàn tất!');
    } else if (idType === 'uuid') {
      console.log('Cột id đã là kiểu UUID, không cần chuyển đổi.');
    } else {
      console.log(`Kiểu dữ liệu hiện tại của cột id: ${idType}`);
      console.log('Không thể tự động chuyển đổi. Vui lòng thực hiện thủ công.');
    }
    
    await client.query('COMMIT');
    console.log('Migration hoàn tất thành công!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Lỗi trong quá trình migration:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Chạy migration
runMigration()
  .then(() => {
    console.log('Đã hoàn thành quá trình chuyển đổi.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Có lỗi xảy ra:', err);
    process.exit(1);
  });
