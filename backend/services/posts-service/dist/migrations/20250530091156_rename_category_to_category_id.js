"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    // Kiểm tra xem bảng posts có tồn tại không
    const hasTable = await knex.schema.hasTable('posts');
    if (!hasTable) {
        console.log('Bảng posts chưa tồn tại, bỏ qua migration');
        return;
    }
    // Kiểm tra xem cột category_id đã tồn tại chưa
    const hasCategoryIdColumn = await knex.schema.hasColumn('posts', 'category_id');
    const hasCategoryColumn = await knex.schema.hasColumn('posts', 'category');
    if (!hasCategoryIdColumn && hasCategoryColumn) {
        // Thêm cột mới category_id
        await knex.schema.alterTable('posts', (table) => {
            table.integer('category_id').nullable();
        });
        // Copy dữ liệu từ cột category sang category_id
        await knex.raw(`
      UPDATE posts 
      SET category_id = CAST(category AS INTEGER)
      WHERE category IS NOT NULL AND category != ''
    `);
        // Xóa cột cũ
        await knex.schema.alterTable('posts', (table) => {
            table.dropColumn('category');
        });
        console.log('Đã đổi tên cột category thành category_id thành công');
    }
    else if (hasCategoryIdColumn) {
        console.log('Cột category_id đã tồn tại, bỏ qua migration');
    }
    else {
        console.log('Không tìm thấy cột category, bỏ qua migration');
    }
}
async function down(knex) {
    // Kiểm tra xem bảng posts có tồn tại không
    const hasTable = await knex.schema.hasTable('posts');
    if (!hasTable) {
        console.log('Bảng posts chưa tồn tại, không thể rollback');
        return;
    }
    // Kiểm tra xem cột category đã tồn tại chưa
    const hasCategoryColumn = await knex.schema.hasColumn('posts', 'category');
    const hasCategoryIdColumn = await knex.schema.hasColumn('posts', 'category_id');
    if (!hasCategoryColumn && hasCategoryIdColumn) {
        // Thêm lại cột category
        await knex.schema.alterTable('posts', (table) => {
            table.string('category').nullable();
        });
        // Copy dữ liệu từ cột category_id sang category
        await knex.raw(`
      UPDATE posts 
      SET category = category_id::TEXT
      WHERE category_id IS NOT NULL
    `);
        console.log('Đã rollback thành công, khôi phục cột category');
    }
    else if (hasCategoryColumn) {
        console.log('Cột category đã tồn tại, không cần rollback');
    }
    else {
        console.log('Không tìm thấy cột category_id, không thể rollback');
    }
}
//# sourceMappingURL=20250530091156_rename_category_to_category_id.js.map