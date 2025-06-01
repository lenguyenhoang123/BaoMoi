'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Xóa cột phone
    await queryInterface.removeColumn('users', 'phone');
  },

  async down(queryInterface, Sequelize) {
    // Khôi phục cột phone nếu cần
    await queryInterface.addColumn('users', 'phone', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Số điện thoại người dùng'
    });
  }
};
