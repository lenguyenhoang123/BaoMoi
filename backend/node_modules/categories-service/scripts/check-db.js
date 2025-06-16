const { Sequelize } = require('sequelize');
const config = require('../src/config/config');

async function checkDatabase() {
  const sequelize = new Sequelize({
    database: config.database,
    username: config.username,
    password: config.password,
    host: config.host,
    port: config.port,
    dialect: 'postgres',
    logging: false
  });

  try {
    await sequelize.authenticate();
    console.log('Kết nối database thành công!');

    // Kiểm tra cấu trúc bảng categories
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'categories'
      ORDER BY ordinal_position
    `);

    console.log('\nCác cột trong bảng categories:');
    console.table(columns);

    // Kiểm tra xem cột is_active có tồn tại không
    const hasIsActive = columns.some(col => col.column_name === 'is_active');
    console.log('\nCó cột is_active:', hasIsActive);

    // Đếm số lượng bản ghi
    const [count] = await sequelize.query('SELECT COUNT(*) as count FROM categories');
    console.log('\nSố lượng danh mục:', count[0].count);

    // Hiển thị 5 bản ghi đầu tiên
    const [categories] = await sequelize.query('SELECT * FROM categories LIMIT 5');
    console.log('\n5 danh mục đầu tiên:');
    console.table(categories);

  } catch (error) {
    console.error('Lỗi khi kiểm tra database:', error);
  } finally {
    await sequelize.close();
  }
}

checkDatabase();
