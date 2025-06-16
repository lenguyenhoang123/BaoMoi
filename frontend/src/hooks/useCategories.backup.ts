import { useState, useEffect, useCallback } from 'react';
import { Category, CreateCategoryData, UpdateCategoryData } from '../types';
import * as categoryService from '../services/categories';

// Static categories data
const staticCategories: Category[] = [
  {
    id: '1',
    name: 'Thời sự',
    slug: 'thoi-su',
    description: 'Tin tức thời sự trong nước và quốc tế',
    isActive: true,
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Thế giới',
    slug: 'the-gioi',
    description: 'Tin tức quốc tế',
    isActive: true,
    order: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Kinh doanh',
    slug: 'kinh-doanh',
    description: 'Tin tức kinh tế, tài chính',
    isActive: true,
    order: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    name: 'Giải trí',
    slug: 'giai-tri',
    description: 'Tin tức giải trí, điện ảnh, âm nhạc',
    isActive: true,
    order: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '5',
    name: 'Thể thao',
    slug: 'the-thao',
    description: 'Tin tức thể thao trong nước và quốc tế',
    isActive: true,
    order: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '6',
    name: 'Pháp luật',
    slug: 'phap-luat',
    description: 'Tin tức pháp luật, an ninh',
    isActive: true,
    order: 6,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '7',
    name: 'Giáo dục',
    slug: 'giao-duc',
    description: 'Tin tức giáo dục, tuyển sinh',
    isActive: true,
    order: 7,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '8',
    name: 'Sức khỏe',
    slug: 'suc-khoe',
    description: 'Tin tức sức khỏe, làm đẹp',
    isActive: true,
    order: 8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '9',
    name: 'Du lịch',
    slug: 'du-lich',
    description: 'Tin tức du lịch, khám phá',
    isActive: true,
    order: 9,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '10',
    name: 'Khoa học',
    slug: 'khoa-hoc',
    description: 'Tin tức khoa học, công nghệ',
    isActive: true,
    order: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '11',
    name: 'Số hóa',
    slug: 'so-hoa',
    description: 'Tin tức công nghệ số',
    isActive: true,
    order: 11,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '12',
    name: 'Xe',
    slug: 'xe',
    description: 'Tin tức ô tô, xe máy',
    isActive: true,
    order: 12,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '13',
    name: 'Ý kiến',
    slug: 'y-kien',
    description: 'Ý kiến độc giả',
    isActive: true,
    order: 13,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '14',
    name: 'Tâm sự',
    slug: 'tam-su',
    description: 'Chia sẻ tâm sự',
    isActive: true,
    order: 14,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '15',
    name: 'Cười',
    slug: 'cuoi',
    description: 'Tin tức giải trí, hài hước',
    isActive: true,
    order: 15,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      // Fallback to static data if API fails
      setCategories(staticCategories);
      setError(err.message || 'Lấy danh sách danh mục thất bại');
    } finally {
      setLoading(false);
    }
  }, []);

  const getCategory = useCallback(async (slug: string) => {
    try {
      const categories = await categoryService.getCategories();
      const category = Array.isArray(categories) 
        ? categories.find(cat => cat.slug === slug)
        : categories.data?.find((cat: any) => cat.slug === slug);
      
      if (!category) {
        throw new Error('Không tìm thấy danh mục');
      }
      return category;
    } catch (err: any) {
      setError(err.message || 'Lấy danh mục thất bại');
      throw err;
    }
  }, []);

  const createCategory = async (data: CreateCategoryData) => {
    try {
      const category = await categoryService.createCategory(data);
      setCategories([...categories, category]);
      return category;
    } catch (err: any) {
      setError(err.message || 'Tạo danh mục thất bại');
      throw err;
    }
  };

  const updateCategory = async (id: string, data: UpdateCategoryData) => {
    try {
      const updatedCategory = await categoryService.updateCategory(id, data);
      setCategories(
        categories.map(cat => (cat.id === id ? updatedCategory : cat))
      );
      return updatedCategory;
    } catch (err: any) {
      setError(err.message || 'Cập nhật danh mục thất bại');
      throw err;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await categoryService.deleteCategory(id);
      setCategories(categories.filter(cat => cat.id !== id));
    } catch (err: any) {
      setError(err.message || 'Xóa danh mục thất bại');
      throw err;
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    fetchCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory,
  };
};
