import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Kiểm tra xem bảng posts có tồn tại không
  const hasTable = await knex.schema.hasTable('posts');
  if (!hasTable) {
    console.log('Bảng posts chưa tồn tại, bỏ qua migration');
    return;
  }

  // Kiểm tra và xóa khóa ngoại category_id nếu tồn tại
  const hasCategoryIdColumn = await knex.schema.hasColumn('posts', 'category_id');
  if (hasCategoryIdColumn) {
    await knex.schema.alterTable('posts', (table) => {
      table.dropColumn('category_id');
    });
    console.log('Đã xóa cột category_id');
  }

  // Kiểm tra và xóa khóa ngoại author_id nếu tồn tại
  const hasAuthorIdColumn = await knex.schema.hasColumn('posts', 'author_id');
  if (hasAuthorIdColumn) {
    await knex.schema.alterTable('posts', (table) => {
      table.dropColumn('author_id');
    });
    console.log('Đã xóa cột author_id');
  }

  // Thêm các cột mới nếu chưa tồn tại
  const columnsToAdd = [
    { name: 'slug', type: 'varchar' },
    { name: 'excerpt', type: 'text' },
    { name: 'featured_image', type: 'varchar' },
    { name: 'status', type: 'varchar' },
    { name: 'view_count', type: 'integer' },
    { name: 'is_featured', type: 'boolean' },
    { name: 'is_hot', type: 'boolean' },
    { name: 'featured_order', type: 'integer' },
    { name: 'hot_order', type: 'integer' },
    { name: 'featured_expires_at', type: 'timestamp' },
    { name: 'hot_expires_at', type: 'timestamp' }
  ];

  for (const column of columnsToAdd) {
    const columnExists = await knex.schema.hasColumn('posts', column.name);
    if (!columnExists) {
      await knex.schema.alterTable('posts', (table) => {
        if (column.type === 'varchar') {
          table.string(column.name).nullable();
        } else if (column.type === 'text') {
          table.text(column.name).nullable();
        } else if (column.type === 'integer') {
          table.integer(column.name).nullable();
        } else if (column.type === 'boolean') {
          table.boolean(column.name).defaultTo(false);
        } else if (column.type === 'timestamp') {
          table.timestamp(column.name).nullable();
        }
      });
      console.log(`Đã thêm cột ${column.name}`);
    }
  }

  // Đặt giá trị mặc định cho các trường
  await knex.schema.alterTable('posts', (table) => {
    table.string('status').defaultTo('draft').alter();
    table.integer('view_count').defaultTo(0).alter();
    table.boolean('is_featured').defaultTo(false).alter();
    table.boolean('is_hot').defaultTo(false).alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  // Không thể rollback đầy đủ vì đã xóa dữ liệu
  console.log('Không thể rollback đầy đủ việc cập nhật bảng posts');
  
  // Có thể thêm lại các cột đã xóa nếu cần
  // nhưng sẽ mất dữ liệu đã xóa
  const hasCategoryId = await knex.schema.hasColumn('posts', 'category_id');
  if (!hasCategoryId) {
    await knex.schema.alterTable('posts', (table) => {
      table.integer('category_id').nullable();
    });
  }

  const hasAuthorId = await knex.schema.hasColumn('posts', 'author_id');
  if (!hasAuthorId) {
    await knex.schema.alterTable('posts', (table) => {
      table.integer('author_id').nullable();
    });
  }
}
