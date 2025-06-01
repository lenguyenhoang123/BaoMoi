'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Kiểm tra xem cột is_active đã tồn tại chưa
    const tableInfo = await queryInterface.describeTable('categories');
    
    if (!tableInfo.is_active) {
      // Thêm cột is_active nếu chưa tồn tại
      await queryInterface.addColumn('categories', 'is_active', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      });
      
      console.log('Đã thêm cột is_active vào bảng categories');
    } else {
      console.log('Cột is_active đã tồn tại trong bảng categories');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Xóa cột is_active nếu cần rollback
    await queryInterface.removeColumn('categories', 'is_active');
    console.log('Đã xóa cột is_active khỏi bảng categories');
  }
};
