import { sequelize } from '../src/config/sequelize';
import { QueryTypes } from 'sequelize';

async function checkTables() {
  try {
    console.log('Checking database tables...');
    
    // Kiểm tra xem bảng categories có tồn tại không
    const [result] = await sequelize.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'categories')",
      { type: QueryTypes.SELECT }
    );
    
    const categoriesExist = result.exists;
    console.log('Categories table exists:', categoriesExist);
    
    if (categoriesExist) {
      // Lấy thông tin cột của bảng categories
      const columns = await sequelize.query(
        `SELECT column_name, data_type, is_nullable, column_default 
         FROM information_schema.columns 
         WHERE table_name = 'categories'`,
        { type: QueryTypes.SELECT }
      );
      
      console.log('\nCategories table columns:');
      console.table(columns);
      
      // Đếm số lượng bản ghi
      const [countResult] = await sequelize.query(
        'SELECT COUNT(*) as count FROM categories',
        { type: QueryTypes.SELECT }
      );
      
      console.log('\nNumber of categories:', countResult.count);
    }
    
  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

checkTables();
