import { notFound, redirect } from 'next/navigation';
import { getCategoryById, getCategories } from '@/services/categories';
import CategoryPosts from '@/components/posts/CategoryPosts';
import { Suspense } from 'react';
import Loading from '@/app/loading';

// Hàm kiểm tra UUID hợp lệ
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

interface PageProps {
  params: {
    categoryId: string;
  };
}

export async function generateMetadata({ params }: PageProps) {
  try {
    // Kiểm tra UUID hợp lệ trước khi gọi API
    if (!isValidUUID(params.categoryId)) {
      return {
        title: 'ID danh mục không hợp lệ',
        description: 'Vui lòng kiểm tra lại đường dẫn',
      };
    }

    const category = await getCategoryById(params.categoryId);
    
    if (!category) {
      return {
        title: 'Không tìm thấy danh mục',
        description: 'Danh mục không tồn tại hoặc đã bị xóa',
      };
    }
    
    return {
      title: `${category.name} - Báo Mới`,
      description: category.metaDescription || `Tin tức mới nhất về ${category.name}`,
    };
  } catch (error) {
    console.error('Lỗi khi tạo metadata danh mục:', error);
    return {
      title: 'Lỗi tải danh mục',
      description: 'Đã xảy ra lỗi khi tải thông tin danh mục',
    };
  }
}

export async function generateStaticParams() {
  try {
    const categories = await getCategories();
    return categories.map((category: any) => ({
      categoryId: category.id.toString(),
    }));
  } catch (error) {
    console.error('Lỗi khi tạo static params:', error);
    return [];
  }
}

async function CategoryContent({ categoryId }: { categoryId: string }) {
  try {
    const category = await getCategoryById(categoryId);
    
    if (!category) {
      notFound();
    }

    return (
      <CategoryPosts 
        categoryId={category.id}
        categoryName={category.name}
      />
    );
  } catch (error) {
    console.error('Lỗi khi tải danh mục:', error);
    redirect('/error');
  }
}

export default async function CategoryPage({ params }: PageProps) {
  // Kiểm tra UUID hợp lệ
  if (!isValidUUID(params.categoryId)) {
    notFound();
  }
  
  const categoryId = params.categoryId; // Giữ nguyên dạng string vì là UUID

  return (
    <Suspense fallback={<Loading />}>
      <CategoryContent categoryId={categoryId} />
    </Suspense>
  );
}
