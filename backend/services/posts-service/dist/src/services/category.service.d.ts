import { CategoryType } from '../models/post.model';
export declare class CategoryService {
    /**
     * Kiểm tra kết nối đến Category Service
     * @returns Promise<boolean> true nếu kết nối thành công, false nếu thất bại
     */
    static testConnection(): Promise<boolean>;
    /**
     * Lấy thông tin chi tiết của một danh mục
     * @param categoryId ID của danh mục cần lấy
     * @returns Thông tin chi tiết của danh mục hoặc null nếu không tìm thấy
     */
    static getCategoryById(identifier: string, bySlug?: boolean): Promise<CategoryType | null>;
    /**
     * Lấy tất cả danh mục
     * @returns Mảng các danh mục hoặc mảng rỗng nếu có lỗi
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