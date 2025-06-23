import { CategoryType } from '../models/post.model';
export declare class CategoryService {
    /**
     * Lấy thông tin chi tiết của một danh mục
     * @param categoryId ID của danh mục cần lấy
     * @returns Thông tin chi tiết của danh mục hoặc null nếu không tìm thấy
     */
    static getCategoryById(categoryId: string): Promise<CategoryType | null>;
    /**
     * Lấy danh sách tất cả các danh mục
     * @returns Danh sách các danh mục
     */
    static getCategories(): Promise<CategoryType[]>;
    /**
     * Kiểm tra danh mục có tồn tại không
     * @param categoryId ID của danh mục cần kiểm tra
     * @returns true nếu danh mục tồn tại, false nếu không
     */
    static validateCategory(categoryId: string): Promise<boolean>;
}
//# sourceMappingURL=category.service.d.ts.map