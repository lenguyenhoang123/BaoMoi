require('dotenv').config();
const { Pool } = require('pg');
const { CategoryService } = require('../dist/src/services/category.service');
const { logger } = require('../dist/src/utils/logger');

// Tạo kết nối database
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'posts_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
});

// Hàm để lấy client từ pool
async function getClient() {
  const client = await pool.connect();
  return client;
}

// Map of old category IDs to new category slugs
const CATEGORY_MAPPING = {
  // Old ID: 'new-slug'
  '17af37a0-d9ad-4f47-a403-b0e7e6199f81': 'kinh-te', // Giá vàng -> Kinh tế
  'a3656503-c3fb-4360-b0c3-db2aa3514811': 'the-thao' // World Cup -> Thể thao
};

async function updatePostCategories() {
  const client = await getClient();
  
  try {
    logger.info('Bắt đầu cập nhật danh mục bài viết...');
    await client.query('BEGIN');
    
    // Lấy danh sách tất cả các danh mục
    logger.info('Đang lấy danh sách danh mục từ Category Service...');
    const categories = await CategoryService.getCategories();
    
    if (!categories || categories.length === 0) {
      throw new Error('Không tìm thấy danh mục nào từ Category Service');
    }
    
    // Tạo map từ slug sang ID
    const slugToId = {};
    categories.forEach(cat => {
      slugToId[cat.slug] = cat.id;
      logger.debug(`Danh mục có sẵn: ${cat.name} (${cat.id}) - ${cat.slug}`);
    });
    
    // Lấy tất cả bài viết có category_id
    logger.info('Đang lấy danh sách bài viết từ database...');
    const { rows: posts } = await client.query('SELECT * FROM posts WHERE category_id IS NOT NULL');
    
    if (posts.length === 0) {
      logger.warn('Không tìm thấy bài viết nào có category_id');
      return;
    }
    
    logger.info(`Tìm thấy ${posts.length} bài viết cần cập nhật`);
    let updatedCount = 0;
    
    for (const post of posts) {
      const oldCategoryId = post.category_id;
      logger.debug(`Xử lý bài viết: ${post.id} - ${post.title}`);
      logger.debug(`Category ID hiện tại: ${oldCategoryId}`);
      
      // Tìm slug tương ứng với category_id cũ
      const slug = Object.entries(CATEGORY_MAPPING).find(([id]) => id === oldCategoryId)?.[1];
      
      if (slug && slugToId[slug]) {
        const newCategoryId = slugToId[slug];
        logger.info(`Cập nhật bài viết "${post.title}" (${post.id}): từ category ${oldCategoryId} -> ${newCategoryId} (${slug})`);
        
        // Cập nhật bài viết với category_id mới
        await client.query(
          'UPDATE posts SET category_id = $1, updated_at = NOW() WHERE id = $2',
          [newCategoryId, post.id]
        );
        updatedCount++;
      } else {
        logger.warn(`Không tìm thấy ánh xạ cho category_id: ${oldCategoryId} của bài viết ${post.id}`);
      }
    }
    
    await client.query('COMMIT');
    logger.info(`✅ Đã cập nhật thành công ${updatedCount}/${posts.length} bài viết`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('❌ Lỗi khi cập nhật danh mục bài viết:', error.message);
    throw error;
  } finally {
    client.release();
    // Đóng kết nối pool sau khi hoàn thành
    await pool.end();
  }
}

// Run the update
updatePostCategories()
  .then(() => {
    logger.info('Category update completed');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Category update failed:', error);
    process.exit(1);
  });
