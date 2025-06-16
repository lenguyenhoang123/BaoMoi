import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { PostType } from '../models/post.model';
import { ApiResponse } from '../types';
import PostService from '../services/post.service';
import logger from '../utils/logger';
import BaseController from './base.controller';
import catchAsync from '../utils/catchAsync';
import { PostStatus } from '../types';

interface PaginationParams {
  limit: number;
  offset: number;
  page?: number;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default class PostController extends BaseController {
  private postService = PostService;

  /**
   * Lấy tất cả bài viết
   */
  public getAllPosts = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { page = 1, limit = 10, status, category, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    let query = 'SELECT * FROM posts WHERE 1=1';
    const values: any[] = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND status = $${paramIndex++}`;
      values.push(status);
    }

    if (category) {
      query += ` AND category_id = $${paramIndex++}`;
      values.push(category);
    }

    if (search) {
      query += ` AND (title ILIKE $${paramIndex} OR content ILIKE $${paramIndex++})`;
      values.push(`%${search}%`);
    }

    // Thêm phân trang
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    values.push(Number(limit), offset);

    const result = await db.query(query, values);
    
    // Lấy tổng số bản ghi
    let countQuery = 'SELECT COUNT(*) FROM posts WHERE 1=1';
    const countValues = [...values.slice(0, -2)]; // Bỏ limit và offset
    
    if (status || category || search) {
      countQuery = `SELECT COUNT(*) FROM (${query.replace(/LIMIT \$\d+ OFFSET \$\d+$/, '')}) as count`;
      countValues.length = countValues.length - 2; // Bỏ limit và offset
    }
    
    const countResult = await db.query(countQuery, countValues);
    const total = parseInt(countResult.rows[0].count, 10);

    this.sendSuccess(res, {
      data: result.rows,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  });

  /**
   * Lấy danh sách bài viết nổi bật
   */
  public getFeaturedPosts = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const limit = parseInt(req.query.limit as string) || 5;
    const currentDate = new Date().toISOString();

    const query = `
      SELECT 
        id,
        title,
        slug,
        summary,
        image_url,
        created_at
      FROM posts 
      WHERE status = 'published' 
        AND is_featured = true
        AND (publish_at IS NULL OR publish_at <= $1)
      ORDER BY publish_at DESC, created_at DESC
      LIMIT $2`;

    const result = await db.query(query, [currentDate, limit]);
    this.sendSuccess(res, result.rows);
  });

  /**
   * Lấy danh sách bài viết hot
   */
  public getHotPosts = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const limit = parseInt(req.query.limit as string) || 5;
    const currentDate = new Date().toISOString();

    const query = `
      SELECT 
        id,
        title,
        slug,
        summary,
        image_url,
        created_at,
        view_count
      FROM posts 
      WHERE status = 'published' 
        AND is_hot = true
        AND (publish_at IS NULL OR publish_at <= $1)
      ORDER BY view_count DESC, created_at DESC
      LIMIT $2`;

    const result = await db.query(query, [currentDate, limit]);
    this.sendSuccess(res, result.rows);
  });

  /**
   * Lấy chi tiết bài viết
   */
  public getPost = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const post = await this.getPostWithDetails(id);
    
    if (!post) {
      return this.sendNotFound(res, 'Không tìm thấy bài viết');
    }
    
    this.sendSuccess(res, post);
  });

  /**
   * Tạo mới bài viết
   */
  public createPost = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;
    if (!userId) {
      return this.sendError(res, 'Không tìm thấy thông tin người dùng', 401);
    }

    const { title, content, status = 'draft', image_url, tags } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!title || !content) {
      return this.sendError(res, 'Vui lòng điền đầy đủ tiêu đề và nội dung', 400);
    }

    try {
      // Tạo slug tự động từ tiêu đề nếu không có sẵn
      let slug = req.body.slug;
      if (!slug) {
        slug = title
          .toLowerCase()
          .replace(/[^\w\s-]/g, '') // Loại bỏ ký tự đặc biệt
          .replace(/\s+/g, '-')     // Thay dấu cách bằng dấu gạch ngang
          .replace(/--+/g, '-')     // Loại bỏ nhiều dấu gạch ngang liên tiếp
          .trim();
      }

      // Xử lý tags
      let processedTags: string[] = [];
      if (tags) {
        if (Array.isArray(tags)) {
          processedTags = tags.filter(t => t !== null && t !== '');
        } else if (typeof tags === 'string') {
          try {
            const parsed = JSON.parse(tags);
            processedTags = Array.isArray(parsed) ? parsed : [];
          } catch (e) {
            processedTags = tags
              .split(',')
              .map((t: string) => t.trim())
              .filter((t: string) => t !== '');
          }
        }
      }

      // Insert post vào database
      const query = `
        INSERT INTO posts (
          title, 
          content, 
          status, 
          slug, 
          image_url, 
          tags,
          created_at, 
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING *`;

      const values = [
        title,
        content,
        status,
        slug,
        image_url || null,
        processedTags.length > 0 ? processedTags : null
      ];

      const result = await db.query(query, values);
      const newPost = result.rows[0];

      // Lấy thông tin đầy đủ của bài viết
      const fullPost = await this.getPostWithDetails(newPost.id);

      this.sendSuccess(res, fullPost, 'Tạo bài viết thành công', 201);
    } catch (error: any) {
      if (error.code === '23505') { // Unique violation
        return this.sendError(res, 'Slug đã tồn tại, vui lòng chọn tiêu đề khác', 400);
      }
      logger.error('Error tạo bài viết:', error);
      this.sendError(res, 'Có lỗi xảy ra khi tạo bài viết', 500);
    }
  });

  /**
   * Cập nhật bài viết
   */
  public updatePost = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { title, content, status, image_url, tags, ...rest } = req.body;
    
    // Log toàn bộ request body để debug
    console.log('Update post request body:', JSON.stringify(req.body, null, 2));
    
    // Tạm thời bỏ qua kiểm tra userId để test
    const userId = (req as any).user?.id || 'test-user-id';
    console.log('Updating post with userId:', userId);

    try {
      // Kiểm tra sự tồn tại của bài viết
      const post = await this.getPostWithDetails(id);
      if (!post) {
        return this.sendNotFound(res, 'Không tìm thấy bài viết');
      }

      // Xử lý tags nếu có
      let processedTags: string[] = [];
      if (tags !== undefined) {
        if (Array.isArray(tags)) {
          processedTags = tags.filter(t => t !== null && t !== '');
        } else if (typeof tags === 'string') {
          try {
            // Thử parse nếu là chuỗi JSON
            const parsed = JSON.parse(tags);
            processedTags = Array.isArray(parsed) ? parsed : [];
          } catch (e) {
            // Nếu không phải JSON, xử lý như chuỗi phân cách bằng dấu phẩy
            processedTags = tags
              .split(',')
              .map((t: string) => t.trim())
              .filter((t: string) => t !== '');
          }
        }
      }

      // Xây dựng câu lệnh UPDATE động
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      // Thêm các trường cập nhật
      if (title !== undefined) {
        updateFields.push(`title = $${paramIndex++}`);
        values.push(title);
      }

      if (content !== undefined) {
        updateFields.push(`content = $${paramIndex++}`);
        values.push(content);
      }

      if (status !== undefined) {
        updateFields.push(`status = $${paramIndex++}`);
        values.push(status);
      }

      // Xử lý image_url, bao gồm cả trường hợp null/undefined/''
      if (image_url !== undefined) {
        updateFields.push(`image_url = $${paramIndex++}`);
        values.push(image_url || null);
      }

      // Thêm tags vào câu lệnh update nếu có
      if (tags !== undefined) {
        updateFields.push(`tags = $${paramIndex++}`);
        values.push(processedTags.length > 0 ? processedTags : null);
      }

      // Cập nhật slug nếu tiêu đề thay đổi
      if (title && !req.body.slug) {
        const newSlug = title
          .toLowerCase()
          .replace(/[^\w\s-]/g, '') // Loại bỏ ký tự đặc biệt
          .replace(/\s+/g, '-')     // Thay dấu cách bằng dấu gạch ngang
          .replace(/--+/g, '-')     // Loại bỏ nhiều dấu gạch ngang liên tiếp
          .trim();
        
        updateFields.push(`slug = $${paramIndex++}`);
        values.push(newSlug);
      }

      // Thêm thời gian cập nhật
      updateFields.push(`updated_at = NOW()`);

      // Thêm điều kiện WHERE
      values.push(id);
      const whereClause = `WHERE id = $${paramIndex}`;

      // Tạo câu lệnh SQL hoàn chỉnh
      const query = `
        UPDATE posts 
        SET ${updateFields.join(', ')}
        ${whereClause}
        RETURNING *
      `;

      console.log('Executing query:', query);
      console.log('With values:', values);

      const result = await db.query(query, values);
      const updatedPost = result.rows[0];

      if (!updatedPost) {
        return this.sendError(res, 'Không thể cập nhật bài viết', 500);
      }

      // Lấy thông tin đầy đủ của bài viết đã cập nhật
      const fullPost = await this.getPostWithDetails(updatedPost.id);
      this.sendSuccess(res, fullPost, 'Cập nhật bài viết thành công');

    } catch (error: any) {
      console.error('Error updating post:', error);
      
      if (error.code === '23505') { // Unique violation
        return this.sendError(res, 'Slug đã tồn tại, vui lòng chọn tiêu đề khác', 400);
      }
      
      this.sendError(res, 'Có lỗi xảy ra khi cập nhật bài viết', 500);
    }
  });

  /**
   * Xóa bài viết
   */
  public deletePost = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    try {
      // Kiểm tra sự tồn tại của bài viết
      const post = await this.getPostWithDetails(id);
      if (!post) {
        return this.sendNotFound(res, 'Không tìm thấy bài viết');
      }

      // Kiểm tra quyền sở hữu (tạm thời bỏ qua để test)
      // if (post.user_id !== userId && !(req as any).user?.isAdmin) {
      //   return this.sendError(res, 'Bạn không có quyền xóa bài viết này', 403);
      // }


      const query = 'DELETE FROM posts WHERE id = $1 RETURNING *';
      const result = await db.query(query, [id]);

      if (result.rowCount === 0) {
        return this.sendNotFound(res, 'Không tìm thấy bài viết');
      }

      this.sendSuccess(res, null, 'Xóa bài viết thành công');
    } catch (error) {
      logger.error('Error deleting post:', error);
      this.sendError(res, 'Có lỗi xảy ra khi xóa bài viết', 500);
    }
  });

  /**
   * Cập nhật trạng thái nổi bật
   */
  public updateFeaturedStatus = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { postId } = req.params;
    const { isFeatured } = req.body;

    if (typeof isFeatured !== 'boolean') {
      return this.sendError(res, 'Trạng thái không hợp lệ', 400);
    }

    try {
      const query = 'UPDATE posts SET is_featured = $1, updated_at = NOW() WHERE id = $2 RETURNING *';
      const result = await db.query(query, [isFeatured, postId]);

      if (result.rowCount === 0) {
        return this.sendNotFound(res, 'Không tìm thấy bài viết');
      }

      this.sendSuccess(res, result.rows[0], 'Cập nhật trạng thái nổi bật thành công');
    } catch (error) {
      logger.error('Error updating featured status:', error);
      this.sendError(res, 'Có lỗi xảy ra khi cập nhật trạng thái nổi bật', 500);
    }
  });

  /**
   * Cập nhật trạng thái hot
   */
  public updateHotStatus = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { postId } = req.params;
    const { isHot } = req.body;

    if (typeof isHot !== 'boolean') {
      return this.sendError(res, 'Trạng thái không hợp lệ', 400);
    }

    try {
      const query = 'UPDATE posts SET is_hot = $1, updated_at = NOW() WHERE id = $2 RETURNING *';
      const result = await db.query(query, [isHot, postId]);

      if (result.rowCount === 0) {
        return this.sendNotFound(res, 'Không tìm thấy bài viết');
      }

      this.sendSuccess(res, result.rows[0], 'Cập nhật trạng thái hot thành công');
    } catch (error) {
      logger.error('Error updating hot status:', error);
      this.sendError(res, 'Có lỗi xảy ra khi cập nhật trạng thái hot', 500);
    }
  });

  /**
   * Lấy thông tin chi tiết bài viết
   */
  private async getPostWithDetails(id: string): Promise<any> {
    const query = `
      SELECT 
        p.*,
        u.name as author_name,
        u.avatar as author_avatar,
        c.name as category_name,
        c.slug as category_slug
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1`;

    const result = await db.query(query, [id]);
    const post = result.rows[0];

    if (!post) return null;

    // Xử lý tags
    if (post.tags && typeof post.tags === 'string') {
      try {
        post.tags = JSON.parse(post.tags);
      } catch (e) {
        post.tags = [];
      }
    } else if (!post.tags) {
      post.tags = [];
    }

    return post;
  }

  /**
   * Gửi phản hồi thành công
   */
  protected sendSuccess<T>(
    res: Response,
    data: T,
    message: string = 'Thành công',
    statusCode: number = 200
  ): Response<ApiResponse<T>> {
    return super.sendSuccess(res, data, message, statusCode);
  }

  /**
   * Gửi phản hồi lỗi
   */
  protected sendError(
    res: Response, 
    message: string = 'Có lỗi xảy ra', 
    statusCode: number = 500,
    errors: any[] = []
  ): void {
    super.sendError(res, message, statusCode, errors);
  }

  /**
   * Gửi phản hồi không tìm thấy
   */
  protected sendNotFound(res: Response, message: string = 'Không tìm thấy'): void {
    super.sendNotFound(res, message);
  }
}
