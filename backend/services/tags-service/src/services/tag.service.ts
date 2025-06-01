import { Tag, CreateTagInput, UpdateTagInput, TagQueryParams } from '../types/tag';
import { PaginatedResult } from '../types/common';
import { tagModel } from '../models/tag.model';
import { logger } from '../config/logger';
import { ApiError } from '../utils/apiError';

/**
 * Lớp dịch vụ xử lý logic nghiệp vụ liên quan đến thẻ (tag)
 */
class TagService {
  private static instance: TagService;

  private constructor() {
    // Khởi tạo service
  }

  /**
   * Lấy thể hiện duy nhất của TagService (Áp dụng mẫu Singleton)
   */
  public static getInstance(): TagService {
    if (!TagService.instance) {
      TagService.instance = new TagService();
    }
    return TagService.instance;
  }

  /**
   * Tạo mới một thẻ
   * @param tagData Dữ liệu thẻ mới
   * @throws {ApiError} Nếu slug đã tồn tại
   */
  public async createTag(tagData: CreateTagInput): Promise<Tag> {
    try {
      // Nếu có cung cấp slug, kiểm tra xem đã tồn tại chưa
      if (tagData.slug) {
        const existingTag = await tagModel.findBySlug(tagData.slug);
        if (existingTag) {
          throw new ApiError(400, 'Đã tồn tại thẻ với slug này');
        }
      }
      
      // Tạo thẻ mới (tự động tạo slug nếu chưa có)
      const newTag = await tagModel.create(tagData);
      if (!newTag) {
        throw new ApiError(500, 'Không thể tạo thẻ mới');
      }
      
      return newTag;
    } catch (error) {
      logger.error('Lỗi khi tạo thẻ mới:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Lỗi máy chủ nội bộ');
    }
  }

  /**
   * Lấy thông tin thẻ theo ID
   * @param id ID của thẻ cần lấy
   * @throws {ApiError} Nếu không tìm thấy thẻ hoặc có lỗi xảy ra
   */
  public async getTagById(id: string): Promise<Tag> {
    try {
      if (!id) {
        throw new ApiError(400, 'ID thẻ là bắt buộc');
      }
      
      const tag = await tagModel.findById(id);
      if (!tag) {
        throw new ApiError(404, 'Không tìm thấy thẻ');
      }
      return tag;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error(`Lỗi khi lấy thông tin thẻ với ID ${id}:`, error);
      throw new ApiError(500, 'Lỗi khi lấy thông tin thẻ');
    }
  }

  /**
   * Lấy thông tin thẻ theo slug
   * @param slug Slug của thẻ cần lấy
   * @throws {ApiError} Nếu không tìm thấy thẻ hoặc có lỗi xảy ra
   */
  public async getTagBySlug(slug: string): Promise<Tag> {
    try {
      const tag = await tagModel.findBySlug(slug);
      if (!tag) {
        throw new ApiError(404, 'Không tìm thấy thẻ với slug này');
      }
      return tag;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error(`Lỗi khi lấy thông tin thẻ với slug ${slug}:`, error);
      throw new ApiError(500, 'Lỗi khi lấy thông tin thẻ');
    }
  }

  /**
   * Lấy danh sách tất cả thẻ với phân trang và bộ lọc
   * @param params Tham số phân trang và lọc
   * @returns Danh sách thẻ và thông tin phân trang
   * @throws {ApiError} Nếu có lỗi xảy ra
   */
  public async getAllTags(params: TagQueryParams = {}): Promise<PaginatedResult<Tag>> {
    try {
      const page = params.page ? parseInt(params.page.toString(), 10) : 1;
      const limit = params.limit ? parseInt(params.limit.toString(), 10) : 10;
      
      if (isNaN(page) || page < 1) {
        throw new ApiError(400, 'Số trang không hợp lệ');
      }
      
      if (isNaN(limit) || limit < 1 || limit > 100) {
        throw new ApiError(400, 'Số lượng mỗi trang phải từ 1 đến 100');
      }
      
      const result = await tagModel.findAll({
        page,
        limit,
        sortBy: params.sortBy || 'created_at',
        sortOrder: (params.sortOrder || 'desc') as 'asc' | 'desc',
        search: params.search
      });
      
      if (!result) {
        throw new ApiError(500, 'Không thể lấy danh sách thẻ');
      }
      
      // Map the result to the expected structure
      return {
        items: result.items || [],
        pagination: {
          total: result.pagination?.total || 0,
          page: result.pagination?.page || page,
          limit: result.pagination?.limit || limit,
          totalPages: result.pagination?.totalPages || 0,
          hasNextPage: result.pagination?.hasNextPage || false,
          hasPreviousPage: result.pagination?.hasPreviousPage || false
        }
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error('Lỗi khi lấy danh sách thẻ:', error);
      throw new ApiError(500, 'Lỗi khi lấy danh sách thẻ');
    }
  }

  /**
   * Cập nhật thông tin thẻ
   * @param id ID của thẻ cần cập nhật
   * @param updateData Dữ liệu cập nhật
   * @throws {ApiError} Nếu không tìm thấy thẻ, slug đã tồn tại hoặc có lỗi xảy ra
   */
  public async updateTag(id: string, updateData: UpdateTagInput): Promise<Tag> {
    try {
      if (!id) {
        throw new ApiError(400, 'ID thẻ là bắt buộc');
      }

      // Kiểm tra tag có tồn tại không
      const tag = await tagModel.findById(id);
      if (!tag) {
        throw new ApiError(404, 'Không tìm thấy thẻ');
      }

      // Nếu cập nhật slug, kiểm tra slug mới có trùng không
      if (updateData.slug && updateData.slug !== tag.slug) {
        const existingTag = await tagModel.findBySlug(updateData.slug);
        if (existingTag) {
          throw new ApiError(400, 'Đã tồn tại thẻ với slug này');
        }
      }

      // Cập nhật thông tin tag
      const updatedTag = await tagModel.update(id, updateData);
      if (!updatedTag) {
        throw new ApiError(500, 'Không thể cập nhật thẻ');
      }

      return updatedTag;
    } catch (error) {
      logger.error(`Lỗi khi cập nhật thẻ ID ${id}:`, error);
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Lỗi máy chủ nội bộ');
    }
  }

  /**
   * Xóa một thẻ
   * @param id ID của thẻ cần xóa
   * @param deletedBy ID của người thực hiện xóa
   */
  public async deleteTag(id: string, deletedBy: string): Promise<boolean> {
    try {
      // Kiểm tra xem thẻ có tồn tại không
      const tag = await tagModel.findById(id);
      if (!tag) {
        throw new ApiError(404, 'Không tìm thấy thẻ');
      }

      // Thực hiện xóa mềm (soft delete)
      const result = await tagModel.delete(id, deletedBy);
      
      return result;
    } catch (error) {
      logger.error(`Lỗi khi xóa thẻ ${id}:`, error);
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Đã xảy ra lỗi khi xóa thẻ');
    }
  }

  /**
   * Lấy danh sách các tag đang thịnh hành
   * @param limit Số lượng tag cần lấy
   */
  public async getTrendingTags(limit: number = 10): Promise<Tag[]> {
    try {
      const tags = await tagModel.findTrending(limit);
      return tags;
    } catch (error) {
      logger.error('Lỗi khi lấy danh sách tag thịnh hành:', error);
      throw new ApiError(500, 'Đã xảy ra lỗi khi lấy danh sách tag thịnh hành');
    }
  }

  /**
   * Theo dõi một tag
   * @param userId ID của người dùng
   * @param tagId ID của tag cần theo dõi
   */
  public async followTag(userId: string, tagId: string): Promise<void> {
    try {
      // Kiểm tra xem tag có tồn tại không
      const tag = await tagModel.findById(tagId);
      if (!tag) {
        throw new ApiError(404, 'Không tìm thấy tag');
      }

      // Thêm vào bảng user_tag_follows
      await tagModel.addFollower(userId, tagId);
      
      // Cập nhật số lượng người theo dõi
      await tagModel.incrementFollowerCount(tagId);
    } catch (error) {
      logger.error(`Lỗi khi theo dõi tag ${tagId}:`, error);
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Đã xảy ra lỗi khi theo dõi tag');
    }
  }

  /**
   * Bỏ theo dõi một tag
   * @param userId ID của người dùng
   * @param tagId ID của tag cần bỏ theo dõi
   */
  public async unfollowTag(userId: string, tagId: string): Promise<void> {
    try {
      // Kiểm tra xem tag có tồn tại không
      const tag = await tagModel.findById(tagId);
      if (!tag) {
        throw new ApiError(404, 'Không tìm thấy tag');
      }

      // Xóa khỏi bảng user_tag_follows
      const result = await tagModel.removeFollower(userId, tagId);
      
      if (result) {
        // Giảm số lượng người theo dõi nếu xóa thành công
        await tagModel.decrementFollowerCount(tagId);
      }
    } catch (error) {
      logger.error(`Lỗi khi bỏ theo dõi tag ${tagId}:`, error);
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Đã xảy ra lỗi khi bỏ theo dõi tag');
    }
  }

  /**
   * Gợi ý các tag dựa trên từ khóa
   * @param keyword Từ khóa tìm kiếm
   * @param limit Số lượng kết quả trả về
   */
  public async suggestTags(keyword: string, limit: number = 10): Promise<Tag[]> {
    try {
      if (!keyword || keyword.trim().length === 0) {
        return [];
      }
      
      const tags = await tagModel.search(keyword, { limit });
      return tags;
    } catch (error) {
      logger.error('Lỗi khi gợi ý tag:', error);
      throw new ApiError(500, 'Đã xảy ra lỗi khi gợi ý tag');
    }
  }

  /**
   * Lấy danh sách các tag phổ biến nhất
   * @param limit Số lượng tag cần lấy
   */
  public async getPopularTags(limit: number = 10): Promise<Tag[]> {
    try {
      const tags = await tagModel.findPopular(limit);
      return tags;
    } catch (error) {
      logger.error('Lỗi khi lấy danh sách tag phổ biến:', error);
      throw new ApiError(500, 'Đã xảy ra lỗi khi lấy danh sách tag phổ biến');
    }
  }
}

export const tagService = TagService.getInstance();
