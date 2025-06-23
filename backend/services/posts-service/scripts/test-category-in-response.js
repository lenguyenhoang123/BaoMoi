const http = require('http');

// Test API endpoint
const testApi = async () => {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:3000/api/posts?limit=5', (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
    }).on('error', reject);
  });
};

// Run the test
const runTest = async () => {
  try {
    console.log('Testing API response...');
    const result = await testApi();
    
    console.log('\nAPI Response Status:', result.success ? '✅ Success' : '❌ Failed');
    
    if (result.data?.items) {
      console.log(`\nFound ${result.data.items.length} posts`);
      
      result.data.items.forEach((post, index) => {
        console.log(`\n--- Post ${index + 1} ---`);
        console.log('Title:', post.title);
        console.log('Category ID:', post.category_id);
        console.log('Has category data:', !!post.category);
        
        if (post.category) {
          console.log('Category name:', post.category.name);
        }
      });
    } else {
      console.log('No posts found in response');
    }
    
    console.log('\nFull response structure:', JSON.stringify({
      success: result.success,
      data: {
        items: result.data?.items?.map(p => ({
          id: p.id,
          title: p.title,
          category_id: p.category_id,
          has_category: !!p.category,
          category: p.category ? { 
            id: p.category.id, 
            name: p.category.name 
          } : null
        })),
        pagination: result.data?.pagination
      },
      message: result.message
    }, null, 2));
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
};

runTest();
