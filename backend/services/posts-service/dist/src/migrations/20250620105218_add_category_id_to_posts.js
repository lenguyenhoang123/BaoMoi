"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
async function up(knex) {
    // Kiểm tra xem cột đã tồn tại chưa
    const hasColumn = await knex.schema.hasColumn('posts', 'category_id');
    if (!hasColumn) {
        // Thêm cột category_id
        await knex.schema.alterTable('posts', (table) => {
            table.uuid('category_id')
                .nullable()
                .references('id')
                .inTable('categories')
                .onDelete('SET NULL');
        });
        // Thêm index cho cột category_id
        await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category_id)');
        console.log('Đã thêm cột category_id vào bảng posts');
    }
    else {
        console.log('Cột category_id đã tồn tại trong bảng posts');
    }
}
exports.up = up;
async function down(knex) {
    // Kiểm tra xem cột có tồn tại không trước khi xóa
    const hasColumn = await knex.schema.hasColumn('posts', 'category_id');
    if (hasColumn) {
        // Xóa khóa ngoại trước
        await knex.schema.alterTable('posts', (table) => {
            table.dropForeign(['category_id']);
        });
        // Xóa index
        await knex.schema.raw('DROP INDEX IF EXISTS idx_posts_category');
        // Xóa cột
        await knex.schema.alterTable('posts', (table) => {
            table.dropColumn('category_id');
        });
        console.log('Đã xóa cột category_id khỏi bảng posts');
    }
    else {
        console.log('Cột category_id không tồn tại trong bảng posts');
    }
}
exports.down = down;
//# sourceMappingURL=20250620105218_add_category_id_to_posts.js.map