import { sequelize } from '../src/config/sequelize';
import { QueryTypes } from 'sequelize';

async function checkColumns() {
  try {
    console.log('Checking columns in categories table...');
    
    // Lấy danh sách các cột trong bảng categories
    const columns = await sequelize.query(
      `SELECT column_name, data_type, is_nullable, column_default 
       FROM information_schema.columns 
       WHERE table_name = 'categories'
       ORDER BY ordinal_position`,
      { type: QueryTypes.SELECT }
    );
    
    console.log('\nCategories table columns:');
    console.table(columns);
    
  } catch (error) {
    console.error('Error checking columns:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

checkColumns();
