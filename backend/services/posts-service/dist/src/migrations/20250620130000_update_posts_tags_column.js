"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
async function up(knex) {
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
exports.up = up;
async function down(knex) {
    // Xóa cột tags nếu cần rollback
    const hasColumn = await knex.schema.hasColumn('posts', 'tags');
    if (hasColumn) {
        await knex.schema.alterTable('posts', (table) => {
            table.dropColumn('tags');
        });
        console.log('Đã xóa cột tags');
    }
}
exports.down = down;
//# sourceMappingURL=20250620130000_update_posts_tags_column.js.map