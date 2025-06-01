'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Kiểm tra xem cột role đã tồn tại chưa
      const tableInfo = await queryInterface.describeTable('users');
      
      if (!tableInfo.role) {
        // Thêm cột role nếu chưa tồn tại
        await queryInterface.addColumn('users', 'role', {
          type: Sequelize.ENUM('user', 'admin', 'moderator'),
          allowNull: false,
          defaultValue: 'user',
          comment: 'Vai trò người dùng: user, admin, moderator'
        }, { transaction });

        console.log('Đã thêm cột role vào bảng users');
      } else {
        console.log('Cột role đã tồn tại trong bảng users');
      }
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('Lỗi khi cập nhật cột role:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Không cần rollback vì đây là thao tác thêm cột
    console.log('Không có thao tác rollback cho migration này');
  }
};
