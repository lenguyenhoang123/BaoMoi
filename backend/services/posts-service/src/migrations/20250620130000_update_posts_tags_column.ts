import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Kiểm tra xem cột tags có tồn tại không
  const hasColumn = await knex.schema.hasColumn('posts', 'tags');
  
  // Nếu cột đã tồn tại, xóa nó đi
  if (hasColumn) {
    await knex.schema.alterTable('posts', (table) => {
      table.dropColumn('tags');
    });
    console.log('Đã xóa cột tags cũ');
  }
  
  // Thêm lại cột tags với kiểu dữ liệu TEXT[]
  await knex.schema.alterTable('posts', (table) => {
    table.specificType('tags', 'TEXT[]').defaultTo('{}');
  });
  
  console.log('Đã thêm lại cột tags với kiểu dữ liệu TEXT[]');
}

export async function down(knex: Knex): Promise<void> {
  // Xóa cột tags nếu cần rollback
  const hasColumn = await knex.schema.hasColumn('posts', 'tags');
  
  if (hasColumn) {
    await knex.schema.alterTable('posts', (table) => {
      table.dropColumn('tags');
    });
    console.log('Đã xóa cột tags');
  }
}
