import { Request as ExpressRequest, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ICreateCommentDto, IUpdateCommentDto } from '../types/common';
import commentService from '../services/comment.service';
import AppError from '../utils/appError';
import { logger } from '../utils/logger';

type Request = ExpressRequest;

/**
 * Xử lý yêu cầu tạo mới bình luận
 */
export const createComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { content, post_id, parent_id } = req.body;
    const user_id = req.user?.id; // Lấy từ middleware xác thực

    if (!user_id) {
      throw new AppError('User not authenticated', StatusCodes.UNAUTHORIZED);
    }

    if (!content || !post_id) {
      throw new AppError('Content and post_id are required', StatusCodes.BAD_REQUEST);
    }

    // Get user info from the request object (set by auth middleware)
    if (!req.user) {
      throw new AppError('User information not found', StatusCodes.UNAUTHORIZED);
    }

    const commentData: ICreateCommentDto = {
      content,
      user_id,
      user_name: req.user.name || 'Ẩn danh',
      user_avatar: req.user.avatar_url || null,
      post_id,
      parent_id: parent_id || null,
      is_approved: true, // Hoặc false nếu cần kiểm duyệt
    };
    
    logger.info('Creating comment with data:', { 
      post_id: commentData.post_id,
      user_id: commentData.user_id,
      user_name: commentData.user_name 
    });

    const newComment = await commentService.create(commentData);

    res.status(StatusCodes.CREATED).json({
      status: 'success',
      data: {
        comment: newComment,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy danh sách bình luận theo post ID
 */
export const getCommentsByPost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { postId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const includeReplies = req.query.includeReplies === 'true';

    const result = await commentService.getByPostId(postId, {
      page,
      limit,
      includeReplies,
    });

    res.status(StatusCodes.OK).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cập nhật bình luận
 */
export const updateComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const user_id = req.user?.id;

    if (!user_id) {
      throw new AppError('User not authenticated', StatusCodes.UNAUTHORIZED);
    }

    if (!content) {
      throw new AppError('Content is required', StatusCodes.BAD_REQUEST);
    }

    const updateData: IUpdateCommentDto = { content };
    const updatedComment = await commentService.update(id, updateData, user_id, req.user?.role === 'admin');

    res.status(StatusCodes.OK).json({
      status: 'success',
      data: {
        comment: updatedComment,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Xóa bình luận
 */
export const deleteComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user_id = req.user?.id;

    if (!user_id) {
      throw new AppError('User not authenticated', StatusCodes.UNAUTHORIZED);
    }

    await commentService.delete(id, user_id, req.user?.role === 'admin');

    res.status(StatusCodes.NO_CONTENT).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Phê duyệt/bỏ phê duyệt bình luận (cho admin)
 */
export const toggleApproveComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { is_approved } = req.body;

    if (typeof is_approved !== 'boolean') {
      throw new AppError('Invalid status value', StatusCodes.BAD_REQUEST);
    }

    if (!req.user) {
      throw new AppError('User not authenticated', StatusCodes.UNAUTHORIZED);
    }

    const isOwner = await commentService.isOwner(id, req.user.id);
    const updatedComment = await commentService.update(
      id,
      { is_approved },
      req.user.id,
      req.user.role === 'admin' || isOwner
    );

    res.status(StatusCodes.OK).json({
      status: 'success',
      data: {
        comment: updatedComment,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy thông tin chi tiết bình luận
 */
export const getCommentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const comment = await commentService.getById(id);

    res.status(StatusCodes.OK).json({
      status: 'success',
      data: {
        comment,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Đếm số lượng comments của một bài viết
 */
export const countCommentsByPost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { postId } = req.params;

    if (!postId) {
      throw new AppError('Post ID is required', StatusCodes.BAD_REQUEST);
    }

    const count = await commentService.countByPostId(postId);

    res.status(StatusCodes.OK).json({
      status: 'success',
      data: {
        postId,
        count
      }
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createComment,
  getCommentsByPost,
  updateComment,
  deleteComment,
  toggleApproveComment,
  getCommentById,
  countCommentsByPost,
};
