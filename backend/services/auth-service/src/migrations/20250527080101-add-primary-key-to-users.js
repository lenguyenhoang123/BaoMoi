'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔄 Đang thêm khóa chính cho bảng users...');
      
      // Thêm khóa chính cho cột id
      await queryInterface.addConstraint('users', {
        fields: ['id'],
        type: 'primary key',
        name: 'users_pkey'
      }, { transaction });
      
      await transaction.commit();
      console.log('✅ Đã thêm khóa chính cho bảng users thành công');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Lỗi khi thêm khóa chính:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // Không hỗ trợ rollback tự động
    throw new Error('Rollback is not supported for this migration.');
  }
};
