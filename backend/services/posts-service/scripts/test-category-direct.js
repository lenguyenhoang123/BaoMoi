require('dotenv').config();
const { CategoryService } = require('../dist/src/services/category.service');
const { logger } = require('../dist/src/utils/logger');

async function testCategoryFetch() {
  // Test with a known category ID from our previous logs
  const testCategoryId = '17af37a0-d9ad-4f47-a403-b0e7e6199f81';
  
  console.log('Testing CategoryService.getCategoryById...');
  try {
    const category = await CategoryService.getCategoryById(testCategoryId);
    
    if (category) {
      console.log('✅ Successfully fetched category:');
      console.log(JSON.stringify(category, null, 2));
    } else {
      console.log('❌ Category not found or error occurred');
    }
  } catch (error) {
    console.error('❌ Error fetching category:', error);
  }
  
  console.log('\nTesting CategoryService.getCategories...');
  try {
    const categories = await CategoryService.getCategories();
    
    if (categories && categories.length > 0) {
      console.log(`✅ Successfully fetched ${categories.length} categories`);
      console.log('Sample category:', JSON.stringify(categories[0], null, 2));
    } else {
      console.log('❌ No categories found or error occurred');
    }
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
  }
}

// Run the test
testCategoryFetch().catch(console.error);
