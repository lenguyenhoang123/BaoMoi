import { Category } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export async function getCategories(): Promise<Category[]> {
  try {
    const response = await fetch(`${API_URL}/categories`);
    if (!response.ok) {
      throw new Error('Không thể tải danh sách danh mục');
    }
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Lỗi khi lấy danh sách danh mục:', error);
    return [];
  }
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    const response = await fetch(`${API_URL}/categories/${slug}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Không thể tải thông tin danh mục');
    }
    const data = await response.json();
    return data.data || null;
  } catch (error) {
    console.error('Lỗi khi lấy thông tin danh mục:', error);
    return null;
  }
}
