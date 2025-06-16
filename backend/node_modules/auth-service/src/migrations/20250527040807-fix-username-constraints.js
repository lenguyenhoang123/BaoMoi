'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Kiểm tra xem cột username có tồn tại không
    const [results] = await queryInterface.sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'username';
    `);

    if (results.length > 0) {
      console.log('Tìm thấy cột username, đang xử lý...');
      
      try {
        // Xóa ràng buộc NOT NULL nếu có
        await queryInterface.sequelize.query(`
          ALTER TABLE users ALTER COLUMN username DROP NOT NULL;
        `);
        console.log('Đã xóa ràng buộc NOT NULL khỏi cột username');
      } catch (e) {
        console.log('Không thể xóa ràng buộc NOT NULL:', e.message);
      }
      
      try {
        // Xóa cột username
        await queryInterface.removeColumn('users', 'username');
        console.log('Đã xóa cột username');
      } catch (e) {
        console.log('Không thể xóa cột username:', e.message);
      }
    } else {
      console.log('Không tìm thấy cột username, bỏ qua');
    }
  },

  async down(queryInterface, Sequelize) {
    // Không cần làm gì vì đây là migration để dọn dẹp
  }
};
