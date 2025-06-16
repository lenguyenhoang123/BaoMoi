const { Sequelize } = require('sequelize');
const config = require('../src/config/config');

async function addIsActiveColumn() {
  try {
    console.log('Connecting to database...');
    
    // Tạo kết nối trực tiếp với Sequelize
    const sequelize = new Sequelize({
      database: config.database,
      username: config.username,
      password: config.password,
      host: config.host,
      port: config.port,
      dialect: 'postgres',
      logging: console.log
    });
    
    // Kiểm tra kết nối
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    // Kiểm tra xem cột is_active đã tồn tại chưa
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'categories' AND column_name = 'is_active'
    `);
    
    if (results.length === 0) {
      console.log('Adding is_active column to categories table...');
      await sequelize.query(`
        ALTER TABLE categories 
        ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true
      `);
      console.log('Successfully added is_active column to categories table');
    } else {
      console.log('is_active column already exists in categories table');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Đóng kết nối
    if (sequelize) {
      await sequelize.close();
      console.log('Database connection closed.');
    }
    process.exit(0);
  }
}

addIsActiveColumn();
