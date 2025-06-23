const http = require('http');

// Gửi request đến API
http.get('http://localhost:3000/api/posts?limit=1', (res) => {
  let data = '';
  
  // Nhận dữ liệu
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  // Khi nhận xong dữ liệu
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('API Response:');
      console.log(JSON.stringify(result, null, 2));
      
      // Kiểm tra xem có dữ liệu category không
      if (result?.data?.posts?.[0]?.category) {
        console.log('\n✅ Category data is included in the response');
        console.log('Category info:', result.data.posts[0].category);
      } else {
        console.log('\n❌ No category data found in the response');
      }
    } catch (error) {
      console.error('Error parsing response:', error);
      console.log('Raw response:', data);
    }
  });
  
}).on('error', (error) => {
  console.error('Error making request:', error);
});
