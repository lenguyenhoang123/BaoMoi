require('dotenv').config();
const { CategoryService } = require('../dist/src/services/category.service');

async function testCategoryService() {
  console.log('Testing Category Service...');
  
  try {
    // Test getCategories
    console.log('\n=== Testing getCategories() ===');
    const categories = await CategoryService.getCategories();
    console.log(`Found ${categories.length} categories`);
    console.log('Sample category:', categories[0]);
    
    if (categories.length > 0) {
      // Test getCategoryById with the first category
      console.log('\n=== Testing getCategoryById() ===');
      const categoryId = categories[0].id;
      const category = await CategoryService.getCategoryById(categoryId);
      console.log('Category details:', category);
    }
    
  } catch (error) {
    console.error('Error testing Category Service:', error);
  }
}

testCategoryService();
