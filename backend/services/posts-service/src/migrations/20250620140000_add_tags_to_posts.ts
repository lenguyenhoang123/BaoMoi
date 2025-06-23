import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Check if the tags column exists
  const hasColumn = await knex.schema.hasColumn('posts', 'tags');
  
  if (!hasColumn) {
    // Add tags column as TEXT[] with default empty array
    await knex.raw(`
      ALTER TABLE posts 
      ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::TEXT[]
    `);
    
    console.log('✅ Added tags column to posts table');
  } else {
    console.log('ℹ️ Tags column already exists in posts table');
  }
}

export async function down(knex: Knex): Promise<void> {
  // Remove the tags column if it exists
  const hasColumn = await knex.schema.hasColumn('posts', 'tags');
  
  if (hasColumn) {
    await knex.schema.alterTable('posts', (table) => {
      table.dropColumn('tags');
    });
    
    console.log('✅ Removed tags column from posts table');
  } else {
    console.log('ℹ️ Tags column does not exist in posts table');
  }
}
