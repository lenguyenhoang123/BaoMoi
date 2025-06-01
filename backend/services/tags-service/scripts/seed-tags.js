const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Lấy thông tin kết nối từ biến môi trường
const pool = new Pool({
  host: process.env.TAGS_DB_HOST || 'localhost',
  port: process.env.TAGS_DB_PORT || 5432,
  database: process.env.TAGS_DB_NAME || 'tags_db',
  user: process.env.TAGS_DB_USER || 'postgres',
  password: process.env.TAGS_DB_PASSWORD || '123',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Dữ liệu mẫu cho tags
const sampleTags = [
  // Thể thao
  { name: 'Bóng đá', slug: 'bong-da' },
  { name: 'Premier League', slug: 'premier-league' },
  { name: 'Ngoại hạng Anh', slug: 'ngoai-hang-anh' },
  { name: 'Tennis', slug: 'tennis' },
  { name: 'Grand Slam', slug: 'grand-slam' },
  
  // Công nghệ
  { name: 'Công nghệ', slug: 'cong-nghe' },
  { name: 'Điện thoại', slug: 'dien-thoai' },
  { name: 'Máy tính', slug: 'may-tinh' },
  { name: 'Apple', slug: 'apple' },
  { name: 'Samsung', slug: 'samsung' },
  
  // Giải trí
  { name: 'Phim ảnh', slug: 'phim-anh' },
  { name: 'Âm nhạc', slug: 'am-nhac' },
  { name: 'Sao Việt', slug: 'sao-viet' },
  { name: 'Sao quốc tế', slug: 'sao-quoc-te' },
  
  // Thời sự
  { name: 'Chính trị', slug: 'chinh-tri' },
  { name: 'Pháp luật', slug: 'phap-luat' },
  { name: 'Giao thông', slug: 'giao-thong' },
  
  // Kinh tế
  { name: 'Chứng khoán', slug: 'chung-khoan' },
  { name: 'Bất động sản', slug: 'bat-dong-san' },
  { name: 'Ngân hàng', slug: 'ngan-hang' },
  
  // Sức khỏe
  { name: 'Làm đẹp', slug: 'lam-dep' },
  { name: 'Dinh dưỡng', slug: 'dinh-duong' },
  { name: 'Bệnh thường gặp', slug: 'benh-thuong-gap' },
  
  // Giáo dục
  { name: 'Tuyển sinh', slug: 'tuyen-sinh' },
  { name: 'Đại học', slug: 'dai-hoc' },
  { name: 'Học tiếng Anh', slug: 'hoc-tieng-anh' }
];

async function seedTags() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Đang kết nối đến database...');
    await client.query('BEGIN');

    console.log('📝 Đang thêm dữ liệu mẫu cho bảng tags...');
    
    // Xóa dữ liệu cũ
    await client.query('TRUNCATE TABLE tags RESTART IDENTITY CASCADE');
    
    // Thêm dữ liệu mẫu
    for (const tag of sampleTags) {
      await client.query(
        `INSERT INTO tags (name, slug, created_at)
         VALUES ($1, $2, NOW())`,
        [tag.name, tag.slug]
      );
    }

    await client.query('COMMIT');
    console.log('✅ Đã thêm dữ liệu mẫu thành công!');
    
      // Thêm dữ liệu mẫu vào bảng post_tags
    console.log('\n🔗 Đang liên kết tags với bài viết...');
    
    // Liên kết các tags với bài viết (ví dụ: bài viết 1 có các tag 1,2,3)
    const postTags = [
      { post_id: 1, tag_id: 1 },  // Bài viết 1 - Tin nóng
      { post_id: 1, tag_id: 2 },  // Bài viết 1 - Phân tích
      { post_id: 2, tag_id: 2 },  // Bài viết 2 - Phân tích
      { post_id: 2, tag_id: 3 },  // Bài viết 2 - Bình luận
      { post_id: 3, tag_id: 1 },  // Bài viết 3 - Tin nóng
      { post_id: 3, tag_id: 4 }   // Bài viết 3 - Điểm báo
    ];
    
    for (const pt of postTags) {
      await client.query(
        `INSERT INTO post_tags (post_id, tag_id) VALUES ($1, $2) 
         ON CONFLICT (post_id, tag_id) DO NOTHING`,
        [pt.post_id, pt.tag_id]
      );
    }
    
    // Hiển thị danh sách tags đã thêm
    const result = await client.query(`
      SELECT t.id, t.name, t.slug, 
             COUNT(pt.post_id) as post_count
      FROM tags t
      LEFT JOIN post_tags pt ON t.id = pt.tag_id
      GROUP BY t.id, t.name, t.slug
      ORDER BY t.name
    `);
    
    console.log('\n📋 Danh sách tags đã thêm:');
    console.table(result.rows);
    
    // Hiển thị thống kê
    const stats = await client.query(`
      SELECT 
        COUNT(DISTINCT t.id) as total_tags,
        COUNT(DISTINCT pt.post_id) as total_posts_with_tags,
        COUNT(pt.tag_id) as total_tag_assignments
      FROM tags t
      LEFT JOIN post_tags pt ON t.id = pt.tag_id
    `);
    
    console.log('\n📊 Thống kê:');
    console.table([{
      'Tổng số tags': stats.rows[0].total_tags,
      'Số bài viết đã gắn tag': stats.rows[0].total_posts_with_tags,
      'Tổng số lần gắn tag': stats.rows[0].total_tag_assignments
    }]);
    
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
seedTags()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  });
