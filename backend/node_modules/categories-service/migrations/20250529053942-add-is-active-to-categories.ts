import { QueryInterface, DataTypes } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn('categories', 'is_active', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });
    
    console.log('Added is_active column to categories table');
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn('categories', 'is_active');
    console.log('Removed is_active column from categories table');
  }
};
