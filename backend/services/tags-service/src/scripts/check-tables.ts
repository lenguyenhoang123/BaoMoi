import knex from 'knex';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables from .env file
const envPath = path.resolve(process.cwd(), '../../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

// Direct database configuration
const dbConfig = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'tags_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },
  debug: true,
};

console.log('Database Configuration:', {
  ...dbConfig.connection,
  password: dbConfig.connection.password ? '***' : 'undefined'
});

async function checkTables() {
  const db = knex(dbConfig);
  
  try {
    // Kiểm tra bảng tags
    const tagsColumns = await db('information_schema.columns')
      .where({ 
        table_schema: 'public',
        table_name: 'tags' 
      })
      .select('column_name', 'data_type', 'column_default');
    
    console.log('=== Cấu trúc bảng tags ===');
    console.table(tagsColumns);

    // Kiểm tra bảng post_tags
    const postTagsColumns = await db('information_schema.columns')
      .where({ 
        table_schema: 'public',
        table_name: 'post_tags' 
      })
      .select('column_name', 'data_type', 'column_default');
    
    console.log('\n=== Cấu trúc bảng post_tags ===');
    console.table(postTagsColumns);

  } catch (error) {
    console.error('Lỗi khi kiểm tra bảng:', error);
  } finally {
    await db.destroy();
  }
}

checkTables().catch(console.error);
