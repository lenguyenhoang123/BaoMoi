import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/category.service';

// Hàm bọc xử lý lỗi cho các hàm bất đồng bộ
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export class CategoryController {
  /**
   * Lấy danh sách tất cả danh mục
   * @param req - Đối tượng request từ Express
   * @param res - Đối tượng response từ Express
   * @returns Danh sách danh mục dưới dạng JSON
   */
  static getAllCategories = asyncHandler(async (req: Request, res: Response) => {
    try {
      console.log('Fetching all categories...');
      const includeInactive = req.query.includeInactive === 'true';
      const categories = await CategoryService.getAllCategories(includeInactive);
      
      console.log(`Found ${categories.length} categories`);
      
      // Return the response in the expected format
      res.status(200).json({
        success: true,
        data: categories,
        message: 'Categories retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in getAllCategories:', error);
      throw error; // Let the error handler middleware handle it
    }
  });

  /**
   * Lấy thông tin chi tiết một danh mục
   * @param req - Chứa tham số ID của danh mục
   * @param res - Đối tượng response từ Express
   * @returns Thông tin chi tiết danh mục dưới dạng JSON
   * @throws Lỗi 404 nếu không tìm thấy danh mục
   */
  // Hàm kiểm tra UUID hợp lệ
  private static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  static getCategoryById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    // Kiểm tra xem ID có hợp lệ không
    if (!id || !CategoryController.isValidUUID(id)) {
      console.error(`ID danh mục không hợp lệ: ${id}`);
      return res.status(400).json({
        success: false,
        message: 'ID danh mục không hợp lệ',
        error: 'INVALID_CATEGORY_ID',
        id: id
      });
    }

    try {
      const category = await CategoryService.getCategoryById(id);
      return res.json({ success: true, data: category });
    } catch (error) {
      console.error('Lỗi trong getCategoryById:', error);
      throw error; // Để middleware xử lý lỗi chung xử lý
    }
  });

  /**
   * Tạo mới một danh mục
   * @param req - Chứa dữ liệu danh mục cần tạo
   * @param res - Đối tượng response từ Express
   * @returns Thông tin danh mục đã tạo dưới dạng JSON
   * @throws Lỗi 400 nếu dữ liệu không hợp lệ
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
   * Cập nhật thông tin một danh mục
   * @param req - Chứa ID và dữ liệu cập nhật
   * @param res - Đối tượng response từ Express
   * @returns Thông tin danh mục đã cập nhật dưới dạng JSON
   * @throws Lỗi 404 nếu không tìm thấy danh mục
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
