const { sequelize } = require('../src/config/sequelize');

async function showSchema() {
  try {
    console.log('Checking database schema...');
    
    // Kiểm tra xem bảng categories có tồn tại không
    const [result] = await sequelize.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'categories')",
      { type: 'SELECT' }
    );
    
    const categoriesExist = result.exists;
    console.log('Categories table exists:', categoriesExist);
    
    if (categoriesExist) {
      // Lấy thông tin cột của bảng categories
      const columns = await sequelize.query(
        `SELECT column_name, data_type, is_nullable, column_default 
         FROM information_schema.columns 
         WHERE table_name = 'categories' 
         ORDER BY ordinal_position`,
        { type: 'SELECT' }
      );
      
      console.log('\nCategories table columns:');
      console.table(columns);
      
      // Kiểm tra xem cột is_active có tồn tại không
      const hasIsActive = columns.some(col => col.column_name === 'is_active');
      console.log('Has is_active column:', hasIsActive);
      
      if (!hasIsActive) {
        console.log('\nAdding is_active column...');
        await sequelize.query(
          'ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true',
          { type: 'RAW' }
        );
        console.log('Added is_active column successfully');
      }
    }
    
  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

showSchema();
