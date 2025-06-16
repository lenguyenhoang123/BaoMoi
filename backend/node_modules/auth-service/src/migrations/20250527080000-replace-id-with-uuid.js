'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔄 Bắt đầu quá trình thay thế cột id bằng uuid...');
      
      // 1. Xóa ràng buộc khóa chính hiện tại
      console.log('1. Đang xóa ràng buộc khóa chính hiện tại...');
      await queryInterface.sequelize.query(
        'ALTER TABLE users DROP CONSTRAINT users_pkey',
        { transaction }
      );

      // 2. Đổi tên cột id cũ thành old_id
      console.log('2. Đang đổi tên cột id cũ thành old_id...');
      await queryInterface.renameColumn('users', 'id', 'old_id', { transaction });

      // 3. Thêm cột id mới kiểu UUID
      console.log('3. Đang thêm cột id mới kiểu UUID...');
      await queryInterface.addColumn('users', 'id', {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true
      }, { transaction });

      // 4. Xóa cột old_id
      console.log('4. Đang xóa cột old_id...');
      await queryInterface.removeColumn('users', 'old_id', { transaction });

      // 5. Xóa sequence cũ nếu sử dụng PostgreSQL
      if (queryInterface.sequelize.options.dialect === 'postgres') {
        console.log('5. Đang dọn dẹp sequence cũ...');
        await queryInterface.sequelize.query(
          'DROP SEQUENCE IF EXISTS users_id_seq CASCADE',
          { transaction }
        );
      }

      await transaction.commit();
      console.log('✅ Hoàn thành: Đã thay thế cột id bằng uuid thành công');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Lỗi trong quá trình thực hiện migration:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // Không hỗ trợ rollback tự động vì đây là thay đổi lớn
    // Cần phục hồi từ bản backup nếu cần
    throw new Error('Rollback is not supported for this migration. Please restore from backup.');
  }
};
