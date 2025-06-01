import { 
  IComment, 
  ICreateCommentDto, 
  IUpdateCommentDto, 
  IPaginatedResult, 
  ICommentStatus 
} from '../types/common';

import Comment from '../models/comment.model';
import AppError from '../utils/appError';
import { StatusCodes } from 'http-status-codes';

// Mở rộng interface IUpdateCommentDto để thêm thuộc tính status
declare module '../types/common' {
  interface IUpdateCommentDto {
    status?: ICommentStatus;
  }
}

export interface IGetAllOptions {
  page?: number;
  limit?: number;
  status?: string;
  userId?: string;
  postId?: string;
}

export interface IGetByPostIdOptions {
  page?: number;
  limit?: number;
  includeReplies?: boolean;
}

export interface IGetRepliesOptions {
  page?: number;
  limit?: number;
}

class CommentService {
  /**
   * Lấy danh sách comments với phân trang và lọc
   * @param options - Các tùy chọn tìm kiếm
   * @returns Danh sách comments và thông tin phân trang
   */
  async getAll({ page = 1, limit = 10, status, userId, postId }: IGetAllOptions = {}): Promise<
    IPaginatedResult<IComment>
  > {
    try {
      const filters: any = {};
      if (status) filters.status = status;
      if (userId) filters.user_id = userId;
      if (postId) filters.post_id = postId;

      return await Comment.findAll(page, limit, filters);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Lấy thông tin chi tiết comment
   * @param id - ID của comment
   * @returns Thông tin comment
   */
  async getById(id: string): Promise<IComment> {
    try {
      if (!id) {
        throw new AppError('Comment ID is required', StatusCodes.BAD_REQUEST);
      }

      const comment = await Comment.findById(id);
      if (!comment) {
        throw new AppError('Comment not found', StatusCodes.NOT_FOUND);
      }
      return comment;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Lấy danh sách comments theo post ID
   * @param postId - ID của bài viết
   * @param options - Các tùy chọn
   * @returns Danh sách comments và thông tin phân trang
   */
  async getByPostId(
    postId: string,
    { page = 1, limit = 10, includeReplies = false }: IGetByPostIdOptions = {}
  ): Promise<IPaginatedResult<IComment>> {
    try {
      if (!postId) {
        throw new AppError('Post ID is required', StatusCodes.BAD_REQUEST);
      }

      // Sử dụng phương thức tạm thời nếu findByPostId chưa được định nghĩa
      if (typeof (Comment as any).findByPostId === 'function') {
        return await (Comment as any).findByPostId(postId, { page, limit, includeReplies });
      } else {
        // Fallback: Sử dụng phương thức findAll với bộ lọc
        const result = await (Comment as any).findAll(page, limit, { post_id: postId });
        return {
          data: result.data || [],
          total: result.total || 0,
          page: result.page || page,
          limit: result.limit || limit,
          totalPages: result.totalPages || 1
        };
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Lấy danh sách replies của một comment
   * @param commentId - ID của comment cha
   * @param options - Các tùy chọn
   * @returns Danh sách replies và thông tin phân trang
   */
  async getReplies(commentId: string, { page = 1, limit = 10 }: IGetRepliesOptions = {}): Promise<IPaginatedResult<IComment>> {
    try {
      if (!commentId) {
        throw new AppError('Comment ID is required', StatusCodes.BAD_REQUEST);
      }

      // Kiểm tra xem comment cha có tồn tại không
      await this.getById(commentId);

      // Sử dụng phương thức tạm thời nếu getReplies chưa được định nghĩa
      if (typeof (Comment as any).getReplies === 'function') {
        return await (Comment as any).getReplies(commentId, page, limit);
      } else {
        // Fallback: Sử dụng phương thức findAll với bộ lọc parent_id
        const result = await (Comment as any).findAll(page, limit, { parent_id: commentId });
        return {
          data: result.data || [],
          total: result.total || 0,
          page: result.page || page,
          limit: result.limit || limit,
          totalPages: result.totalPages || 1
        };
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Tạo mới comment
   * @param commentData - Dữ liệu comment
   * @returns Comment đã tạo
   */
  async create(commentData: ICreateCommentDto): Promise<IComment> {
    try {
      // Validate required fields
      if (!commentData.content || !commentData.user_id || !commentData.post_id) {
        throw new AppError('Content, user_id, and post_id are required', StatusCodes.BAD_REQUEST);
      }

      // Validate content length
      if (commentData.content.trim().length < 3) {
        throw new AppError('Comment must be at least 3 characters long', StatusCodes.BAD_REQUEST);
      }

      // Nếu là reply, kiểm tra comment cha tồn tại
      if (commentData.parent_id) {
        const parentComment = await Comment.findById(commentData.parent_id);
        if (!parentComment) {
          throw new AppError('Parent comment not found', StatusCodes.NOT_FOUND);
        }
        // Ngăn chặn reply nhiều cấp
        if (parentComment.parent_id) {
          throw new AppError('Cannot reply to a reply', StatusCodes.BAD_REQUEST);
        }
      }

      // Tạo comment mới
      return await Comment.create(commentData);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cập nhật comment
   * @param id - ID của comment cần cập nhật
   * @param data - Dữ liệu cập nhật
   * @param userId - ID của người dùng thực hiện thao tác
   * @param isAdmin - Có phải là admin không
   * @returns Comment đã cập nhật
   */
  async update(
    id: string,
    data: Partial<IUpdateCommentDto>,
    userId: string,
    isAdmin: boolean = false
  ): Promise<IComment> {
    try {
      if (!id || !userId) {
        throw new AppError('Comment ID and user ID are required', StatusCodes.BAD_REQUEST);
      }

      // Lấy thông tin comment hiện tại
      const comment = await this.getById(id);

      // Kiểm tra quyền sở hữu
      if (!isAdmin && comment.user_id !== userId) {
        throw new AppError('You are not authorized to update this comment', StatusCodes.FORBIDDEN);
      }

      // Chỉ cho phép cập nhật các trường được phép
      const updateData: Partial<IUpdateCommentDto> = {};

      if (data.content !== undefined) {
        if (data.content.trim().length < 3) {
          throw new AppError('Comment must be at least 3 characters long', StatusCodes.BAD_REQUEST);
        }
        updateData.content = data.content;
      }

      // Chỉ admin mới được cập nhật trạng thái
      if ('status' in data && isAdmin) {
        const validStatuses: ICommentStatus[] = ['pending', 'approved', 'rejected', 'deleted'];
        const status = data.status as ICommentStatus;
        
        if (!validStatuses.includes(status)) {
          throw new AppError('Trạng thái không hợp lệ', StatusCodes.BAD_REQUEST);
        }
        
        updateData.status = status;
      }

      // Nếu không có trường nào để cập nhật
      if (Object.keys(updateData).length === 0) {
        return comment; // Trả về thông tin cũ nếu không có gì thay đổi
      }

      return await Comment.update(id, updateData);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Kiểm tra xem user có phải là chủ sở hữu comment không
   * @param commentId - ID của comment
   * @param userId - ID của user
   * @returns Promise<boolean> - Trả về true nếu user là chủ sở hữu
   */
  async isOwner(commentId: string, userId: string): Promise<boolean> {
    try {
      if (!commentId || !userId) {
        return false;
      }

      const comment = await this.getById(commentId);
      return comment.user_id === userId;
    } catch (error) {
      return false;
    }
  }

  /**
   * Xóa comment (soft delete)
   * @param id - ID của comment cần xóa
   * @param userId - ID của người dùng thực hiện thao tác
   * @param isAdmin - Có phải là admin không
   * @returns Kết quả thực hiện
   */
  async delete(id: string, userId: string, isAdmin: boolean = false): Promise<boolean> {
    try {
      if (!id || !userId) {
        throw new AppError('Comment ID and user ID are required', StatusCodes.BAD_REQUEST);
      }

      // Lấy thông tin comment hiện tại
      const comment = await this.getById(id);

      // Kiểm tra quyền sở hữu
      if (!isAdmin && comment.user_id !== userId) {
        throw new AppError('You are not authorized to delete this comment', StatusCodes.FORBIDDEN);
      }

      // Thực hiện xóa mềm
      return await Comment.delete(id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Đếm số lượng comments của một bài viết
   * @param postId ID của bài viết
   * @returns Số lượng comments
   */
  async countByPostId(postId: string): Promise<number> {
    try {
      if (!postId) {
        throw new AppError('Post ID is required', StatusCodes.BAD_REQUEST);
      }

      const result = await (Comment as any).count({ post_id: postId });
      return result?.count || 0;
    } catch (error) {
      throw error;
    }
  }
}

export default new CommentService();
