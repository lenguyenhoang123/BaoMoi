require('dotenv').config();
const { CategoryService } = require('../dist/src/services/category.service');

async function listCategories() {
  try {
    console.log('Fetching categories...');
    const categories = await CategoryService.getCategories();
    
    console.log('\n=== AVAILABLE CATEGORIES ===');
    categories.forEach((cat, index) => {
      console.log(`\n${index + 1}. ${cat.name}`);
      console.log(`   ID: ${cat.id}`);
      console.log(`   Slug: ${cat.slug}`);
      console.log(`   Description: ${cat.description}`);
      console.log(`   Active: ${cat.is_active ? 'Yes' : 'No'}`);
    });
    
    console.log(`\nTotal: ${categories.length} categories`);
    
  } catch (error) {
    console.error('Error fetching categories:', error);
  }
}

listCategories();
