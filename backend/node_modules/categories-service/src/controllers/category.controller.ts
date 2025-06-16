import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/category.service';

// Wrap async functions with error handling
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export class CategoryController {
  /**
   * Lấy tất cả danh mục
   */
  static getAllCategories = asyncHandler(async (req: Request, res: Response) => {
    const includeInactive = req.query.includeInactive === 'true';
    const categories = await CategoryService.getAllCategories(includeInactive);
    res.json({ success: true, data: categories });
  });

  /**
   * Lấy danh mục theo ID
   */
  static getCategoryById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const category = await CategoryService.getCategoryById(id);
    res.json({ success: true, data: category });
  });

  /**
   * Tạo mới danh mục
   */
  static createCategory = asyncHandler(async (req: Request, res: Response) => {
    const categoryData = {
      name: req.body.name,
      slug: req.body.slug,
      description: req.body.description,
      parent_id: req.body.parent_id,
      is_active: req.body.is_active !== undefined ? req.body.is_active : true,
    };

    const newCategory = await CategoryService.createCategory(categoryData);
    res.status(201).json({ success: true, data: newCategory });
  });

  /**
   * Cập nhật danh mục
   */
  static updateCategory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData: { [key: string]: any } = {
      name: req.body.name,
      slug: req.body.slug,
      description: req.body.description,
      parent_id: req.body.parent_id,
      is_active: req.body.is_active,
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const updatedCategory = await CategoryService.updateCategory(id, updateData);
    res.json({ success: true, data: updatedCategory });
  });

  /**
   * Xóa danh mục
   */
  static deleteCategory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await CategoryService.deleteCategory(id);
    res.json({ success: true, message: 'Category deleted successfully' });
  });

  /**
   * Tìm kiếm danh mục
   */
  static searchCategories = asyncHandler(async (req: Request, res: Response) => {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    try {
      const includeInactive = req.query.includeInactive === 'true';
      const categories = await CategoryService.searchCategories(q.toString(), includeInactive);
      return res.json({ success: true, data: categories });
    } catch (error) {
      // This error will be caught by the asyncHandler
      throw error;
    }
  });
}

export default CategoryController;
