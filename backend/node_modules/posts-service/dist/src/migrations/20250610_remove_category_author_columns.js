"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
async function up(knex) {
    // Kiểm tra xem bảng posts có tồn tại không
    const hasTable = await knex.schema.hasTable('posts');
    if (!hasTable) {
        console.log('Bảng posts chưa tồn tại, bỏ qua migration');
        return;
    }
    // Kiểm tra và xóa cột category_id nếu tồn tại
    const hasCategoryIdColumn = await knex.schema.hasColumn('posts', 'category_id');
    if (hasCategoryIdColumn) {
        await knex.schema.alterTable('posts', (table) => {
            table.dropColumn('category_id');
        });
        console.log('Đã xóa cột category_id');
    }
    // Kiểm tra và xóa cột author_id nếu tồn tại
    const hasAuthorIdColumn = await knex.schema.hasColumn('posts', 'author_id');
    if (hasAuthorIdColumn) {
        await knex.schema.alterTable('posts', (table) => {
            table.dropColumn('author_id');
        });
        console.log('Đã xóa cột author_id');
    }
}
exports.up = up;
async function down(knex) {
    // Không cần rollback vì đây là thay đổi cấu trúc
    console.log('Không thể rollback việc xóa cột category_id và author_id');
}
exports.down = down;
//# sourceMappingURL=20250610_remove_category_author_columns.js.map