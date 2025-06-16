import { useState, useEffect, useCallback } from 'react';
import { Category, CreateCategoryData, UpdateCategoryData } from '../types';
import * as categoryService from '../services/categories';

/**
 * Hook quản lý danh mục
 * Cung cấp các phương thức CRUD cho danh mục và quản lý trạng thái
 * @returns {Object} Đối tượng chứa danh sách danh mục và các phương thức liên quan
 */

/**
 * Hook quản lý danh mục
 * @returns {Object} Đối tượng chứa:
 * - categories: Danh sách danh mục
 * - loading: Trạng thái đang tải
 * - error: Thông báo lỗi (nếu có)
 * - fetchCategories: Làm mới danh sách danh mục
 * - getCategory: Lấy thông tin chi tiết một danh mục
 * - createCategory: Tạo mới danh mục
 * - updateCategory: Cập nhật thông tin danh mục
 * - deleteCategory: Xóa danh mục
 */
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
      setError(err.message || 'Lấy danh sách danh mục thất bại');
      setCategories([]);
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
      setCategories(prev => [...prev, category.data || category]);
      return category.data || category;
    } catch (err: any) {
      setError(err.message || 'Tạo danh mục thất bại');
      throw err;
    }
  };

  const updateCategory = async (id: string, data: UpdateCategoryData) => {
    try {
      const category = await categoryService.updateCategory(id, data);
      setCategories(prev => prev.map(c => c.id === id ? (category.data || category) : c));
      return category.data || category;
    } catch (err: any) {
      setError(err.message || 'Cập nhật danh mục thất bại');
      throw err;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await categoryService.deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      return { success: true };
    } catch (err: any) {
      setError(err.message || 'Xóa danh mục thất bại');
      throw err;
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

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
