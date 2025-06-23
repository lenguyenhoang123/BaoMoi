import { CategoryService } from '../src/services/category.service';

async function testCategoryConnection() {
  console.log('🔄 Bắt đầu kiểm tra kết nối đến Category Service...');
  
  // 1. Kiểm tra kết nối
  const isConnected = await CategoryService.testConnection();
  console.log(`🔌 Kết quả kiểm tra kết nối: ${isConnected ? '✅ Thành công' : '❌ Thất bại'}`);
  
  if (!isConnected) {
    console.error('Không thể kết nối đến Category Service. Vui lòng kiểm tra lại cấu hình.');
    process.exit(1);
  }
  
  // 2. Lấy danh sách danh mục
  console.log('\n🔄 Đang lấy danh sách danh mục...');
  try {
    const categories = await CategoryService.getCategories();
    console.log(`✅ Lấy thành công ${categories.length} danh mục`);
    
    if (categories.length > 0) {
      console.log('\n📋 Danh sách 5 danh mục đầu tiên:');
      categories.slice(0, 5).forEach((cat, index) => {
        console.log(`  ${index + 1}. ${cat.name} (ID: ${cat.id}, Slug: ${cat.slug})`);
      });
      
      // 3. Lấy chi tiết 1 danh mục
      const firstCategory = categories[0];
      console.log(`\n🔄 Đang lấy chi tiết danh mục: ${firstCategory.name} (ID: ${firstCategory.id})`);
      
      const categoryById = await CategoryService.getCategoryById(firstCategory.id);
      console.log(`✅ Thông tin chi tiết danh mục (theo ID):`, {
        id: categoryById?.id,
        name: categoryById?.name,
        slug: categoryById?.slug
      });
      
      // 4. Tìm kiếm theo slug
      if (firstCategory.slug) {
        console.log(`\n🔄 Đang tìm kiếm danh mục theo slug: ${firstCategory.slug}`);
        const categoryBySlug = await CategoryService.getCategoryById(firstCategory.slug, true);
        console.log(`✅ Thông tin chi tiết danh mục (theo slug):`, {
          id: categoryBySlug?.id,
          name: categoryBySlug?.name,
          slug: categoryBySlug?.slug
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Lỗi khi lấy danh sách danh mục:', error);
    process.exit(1);
  }
}

// Chạy test
testCategoryConnection()
  .then(() => {
    console.log('\n✅ Hoàn thành kiểm tra kết nối');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Có lỗi xảy ra:', error);
    process.exit(1);
  });
