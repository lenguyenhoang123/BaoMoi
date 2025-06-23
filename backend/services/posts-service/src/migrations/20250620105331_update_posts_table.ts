import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Tạo bảng tạm để lưu dữ liệu cũ
  await knex.raw(`
    CREATE TEMPORARY TABLE temp_posts AS
    SELECT 
      id, 
      title, 
      slug, 
      content, 
      status, 
      category_id,
      image_url,
      created_at,
      updated_at
    FROM posts;
  `);

  // Xóa bảng cũ
  await knex.schema.dropTable('posts');

  // Tạo lại bảng với cấu trúc mới
  await knex.schema.createTable('posts', (table) => {
    // Khóa chính
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    
    // Nội dung bài viết
    table.string('title').notNullable();
    table.string('slug').notNullable().unique();
    table.text('content').notNullable();
    
    // Trạng thái và quan hệ
    table.enum('status', ['draft', 'published', 'archived']).defaultTo('draft');
    table.uuid('category_id').nullable();
    
    // Media
    table.string('image_url').nullable();
    
    // Timestamps
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index(['slug'], 'idx_posts_slug');
    table.index(['status'], 'idx_posts_status');
    table.index(['category_id'], 'idx_posts_category');
  });

  // Khôi phục dữ liệu từ bảng tạm
  await knex.raw(`
    INSERT INTO posts (
      id, title, slug, content, status, category_id, image_url, created_at, updated_at
    )
    SELECT 
      id, title, slug, content, status, category_id, image_url, created_at, updated_at
    FROM temp_posts;
  `);

  // Xóa bảng tạm
  await knex.raw('DROP TABLE temp_posts');
}

export async function down(knex: Knex): Promise<void> {
  // Lưu ý: Hàm down này chỉ để rollback, nếu cần
  // Trong trường hợp này, bạn cần tự backup dữ liệu trước khi rollback
  await knex.schema.alterTable('posts', (table) => {
    // Thêm lại các cột cần thiết nếu muốn rollback
  });
}
