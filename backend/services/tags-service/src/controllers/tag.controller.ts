import { Request, Response, NextFunction } from 'express';
import { tagService } from '../services/tag.service';
import { ApiResponse, PaginatedResult, AuthenticatedRequest } from '../types/common';
import { Tag, CreateTagInput, UpdateTagInput, TagQueryParams } from '../types/tag';
import { ApiError } from '../utils/apiError';
import { logger } from '../config/logger';

// Sử dụng kiểu Request đã được mở rộng từ định nghĩa kiểu của chúng ta

/**
 * Lớp điều khiển (controller) xử lý các yêu cầu HTTP liên quan đến thẻ (tag)
 */
export class TagController {
  private static instance: TagController;
  private tagService = tagService;

  /**
   * Lấy danh sách các tag đang thịnh hành
   * @route GET /api/tags/trending
   * @access Public
   */
  public getTrendingTags = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = parseInt(String(req.query['limit'])) || 10;
      const tags = await this.tagService.getTrendingTags(limit);
      res.status(200).json({ success: true, data: tags, message: 'Trending tags retrieved successfully' });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Theo dõi một tag
   * @route POST /api/tags/:id/follow
   * @access Private
   */
  public followTag = async (req: Request & { user?: { id: string } }, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Chưa xác thực');
      }

      const userId = req.user.id;
      const tagId = String(req.params['id']);
      
      await this.tagService.followTag(userId, tagId);
      
      res.status(200).json({ success: true, message: 'Theo dõi tag thành công' });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Bỏ theo dõi một tag
   * @route POST /api/tags/:id/unfollow
   * @access Private
   */
  public unfollowTag = async (req: Request & { user?: { id: string } }, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Chưa xác thực');
      }

      const userId = req.user.id;
      const tagId = String(req.params['id']);
      
      await this.tagService.unfollowTag(userId, tagId);
      
      res.status(200).json({
        success: true,
        message: 'Đã bỏ theo dõi tag thành công'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Gợi ý các tag dựa trên từ khóa
   * @route GET /api/tags/suggest
   * @access Public
   */
  public suggestTags = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const keyword = req.query['keyword'];
      
      if (!keyword || typeof keyword !== 'string') {
        throw new ApiError(400, 'Từ khóa tìm kiếm không hợp lệ');
      }
      
      const tags = await this.tagService.suggestTags(keyword);
      
      res.status(200).json({ 
        success: true, 
        data: tags,
        message: 'Tags suggested successfully' 
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Lấy danh sách các tag phổ biến nhất
   * @route GET /api/tags/popular
   * @access Public
   */
  public getPopularTags = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = parseInt(String(req.query['limit'])) || 10;
      const tags = await this.tagService.getPopularTags(limit);
      res.status(200).json({ 
        success: true, 
        data: tags, 
        message: 'Popular tags retrieved successfully' 
      });
    } catch (error) {
      next(error);
    }
  };

  private constructor() {}

  public static getInstance(): TagController {
    if (!TagController.instance) {
      TagController.instance = new TagController();
    }
    return TagController.instance;
  }

  /**
   * Tạo mới một thẻ (tag)
   * @route POST /api/tags
   * @access Private (Admin/Editor)
   */
  public createTag = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Chưa xác thực');
      }

      const tagData = {
        ...req.body,
        createdBy: (req as AuthenticatedRequest).user?.id,
      } as CreateTagInput;

      // Validate dữ liệu đầu vào
      if (!tagData.name) {
        throw new ApiError(400, 'Tên tag là bắt buộc');
      }

      // Tạo tag mới
      const newTag = await this.tagService.createTag(tagData);

      res.status(201).json({
        success: true,
        message: 'Tạo thẻ thành công',
        data: newTag,
      });
    } catch (error) {
      logger.error('Lỗi khi tạo thẻ mới:', error);
      next(error);
    }
  };

  /**
   * Lấy thông tin thẻ theo ID
   * @route GET /api/tags/:id
   * @access Public
   */
  public getTagById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params['id'];
      if (!id) {
        throw new ApiError(400, 'ID thẻ là bắt buộc');
      }

      logger.debug(`Lấy thông tin thẻ với ID: ${id}`);
      const tag = await this.tagService.getTagById(id);

      if (!tag) {
        throw new ApiError(404, 'Không tìm thấy thẻ');
      }

      const response: ApiResponse<Tag> = {
        success: true,
        message: 'Lấy thông tin thẻ thành công',
        data: tag,
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error(`Lỗi khi lấy thông tin thẻ theo ID: ${req.params['id']}`, error);
      next(error);
    }
  };

  /**
   * Lấy thông tin thẻ theo slug
   * @route GET /api/tags/:slug
   * @access Public
   */
  public getTagBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const slug = req.params['slug'];
      if (!slug) {
        throw new ApiError(400, 'Thiếu thông tin slug');
      }

      logger.debug(`Lấy thông tin thẻ với slug: ${slug}`);
      const tag = await this.tagService.getTagBySlug(slug);

      if (!tag) {
        throw new ApiError(404, 'Không tìm thấy thẻ');
      }

      const response: ApiResponse<Tag> = {
        success: true,
        message: 'Lấy thông tin thẻ thành công',
        data: tag,
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error(`Lỗi khi lấy thông tin thẻ theo slug: ${req.params['slug']}`, error);
      next(error);
    }
  };

  /**
   * Lấy danh sách tất cả thẻ với phân trang và bộ lọc
   * @route GET /api/tags
   * @access Public
   */
  public getAllTags = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Sử dụng dấu ngoặc vuông để truy cập thuộc tính từ index signature
      const page = req.query['page'] ? parseInt(req.query['page'] as string, 10) : 1;
      const limit = req.query['limit'] ? Math.min(parseInt(req.query['limit'] as string, 10), 100) : 10;

      // Xác định sortBy với kiểu an toàn
      const sortByInput = req.query['sortBy'] as string;
      const sortBy: 'id' | 'name' | 'slug' | 'created_at' =
        (['id', 'name', 'slug', 'created_at'] as const).includes(sortByInput as any)
          ? sortByInput as 'id' | 'name' | 'slug' | 'created_at'
          : 'created_at';

      // Xác định sortOrder với kiểu an toàn
      const sortOrderInput = req.query['sortOrder'] as string;
      const sortOrder: 'ASC' | 'DESC' =
        (sortOrderInput === 'ASC' || sortOrderInput === 'DESC') ? sortOrderInput : 'DESC';

      // Parse is_active from query string
      const isActiveParam = req.query['is_active'];
      const isActive = isActiveParam === 'true' ? true : 
                     isActiveParam === 'false' ? false : undefined;

      // Create query params with type assertion
      const queryParams = {
        page,
        limit,
        sortBy,
        sortOrder,
        search: (req.query['search'] as string) || '',
        ...(isActive !== undefined && { is_active: isActive })
      } as TagQueryParams;

      logger.debug(`Lấy danh sách thẻ với tham số: ${JSON.stringify(queryParams)}`);
      const result = await this.tagService.getAllTags(queryParams);

      const response: ApiResponse<PaginatedResult<Tag>> = {
        success: true,
        message: 'Lấy danh sách thẻ thành công',
        data: result,
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Lỗi khi lấy danh sách thẻ:', error);
      next(error);
    }
  };

  /**
   * Cập nhật thông tin thẻ
   * @route PUT /api/tags/:id
   * @access Private (Admin/Editor)
   */
  public updateTag = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Chưa xác thực');
      }

      const { id } = req.params;
      if (!id) {
        throw new ApiError(400, 'ID tag là bắt buộc');
      }

      const updateData = {
        ...req.body,
        updatedBy: (req as AuthenticatedRequest).user?.id,
      } as UpdateTagInput;

      if (Object.keys(updateData).length === 0) {
        throw new ApiError(400, 'Không có dữ liệu cập nhật');
      }

      // Thêm thông tin người cập nhật
      const updatedData = {
        ...updateData,
        updated_by: req.user.id,
      };
      
      // Cập nhật tag
      const updatedTag = await this.tagService.updateTag(id, updatedData);
      
      if (!updatedTag) {
        throw new ApiError(404, 'Không tìm thấy thẻ để cập nhật');
      }

      const response: ApiResponse<Tag> = {
        success: true,
        message: 'Cập nhật thẻ thành công',
        data: updatedTag,
      };

      res.json(response);
    } catch (error) {
      logger.error(`Lỗi khi cập nhật thẻ ID ${req.params['id']}:`, error);
      next(error);
    }
  };

  /**
   * Xóa một thẻ
   * @route DELETE /api/tags/:id
   * @access Private (Admin/Editor)
   */
  public deleteTag = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Chưa xác thực');
      }

      const { id } = req.params;
      if (!id) {
        throw new ApiError(400, 'ID thẻ là bắt buộc');
      }

      const userId = String(req.user.id);
      logger.info(`Xóa thẻ ID: ${id}, được thực hiện bởi user ID: ${userId}`);
      const success = await tagService.deleteTag(id, userId);
      
      if (!success) {
        throw new ApiError(404, 'Không tìm thấy thẻ để xóa');
      }

      const response: ApiResponse<null> = {
        success: true,
        message: 'Xóa thẻ thành công',
        data: null,
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error(`Lỗi khi xóa thẻ ID ${req.params['id']}:`, error);
      next(error);
    }
  };
}

export const tagController = TagController.getInstance();
