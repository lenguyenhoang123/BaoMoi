import { QueryInterface, DataTypes } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn('posts', 'is_featured', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addColumn('posts', 'is_hot', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addColumn('posts', 'featured_order', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn('posts', 'hot_order', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn('posts', 'featured_expires_at', {
      type: DataTypes.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('posts', 'hot_expires_at', {
      type: DataTypes.DATE,
      allowNull: true,
    });

    // Thêm index cho các trường mới
    await queryInterface.addIndex('posts', ['is_featured']);
    await queryInterface.addIndex('posts', ['is_hot']);
    await queryInterface.addIndex('posts', ['featured_order']);
    await queryInterface.addIndex('posts', ['hot_order']);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn('posts', 'is_featured');
    await queryInterface.removeColumn('posts', 'is_hot');
    await queryInterface.removeColumn('posts', 'featured_order');
    await queryInterface.removeColumn('posts', 'hot_order');
    await queryInterface.removeColumn('posts', 'featured_expires_at');
    await queryInterface.removeColumn('posts', 'hot_expires_at');
  },
};

export default {};
