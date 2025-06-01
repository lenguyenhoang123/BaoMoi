import { Request, Response } from 'express';
import { Post, PostWithDetails } from '../types/post';
import PostService from '../services/post.service';
import BaseController from './base.controller';
import catchAsync from '../utils/catchAsync';
import logger from '../utils/logger';
import db from '../config/database';
import { getCategoryById } from '../utils/apiClient';

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
  /**
   * Lấy danh sách bài viết nổi bật
   * @route GET /api/posts/featured
   * @access Public
   */
  public getFeaturedPosts = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const limit = parseInt(req.query.limit as string) || 5;
    const currentDate = new Date().toISOString();
    
    const query = `
      SELECT p.*, 
             u.username as author_username,
             u.avatar as author_avatar,
             c.name as category_name,
             c.slug as category_slug
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_featured = true 
        AND p.status = 'published'
        AND (p.featured_expires_at IS NULL OR p.featured_expires_at > $1)
      ORDER BY p.featured_order ASC, p.published_at DESC
      LIMIT $2`;
    
    const { rows: posts } = await db.query<{
      id: string;
      title: string;
      content: string;
      slug: string;
      status: string;
      view_count: number;
      like_count: number;
      comment_count: number;
      featured_order: number | null;
      is_featured: boolean;
      featured_expires_at: Date | null;
      is_hot: boolean;
      hot_order: number | null;
      hot_expires_at: Date | null;
      author_id: string;
      category_id: string | null;
      thumbnail: string | null;
      summary: string | null;
      published_at: Date | null;
      created_at: Date;
      updated_at: Date;
      author_username: string | null;
      author_avatar: string | null;
      category_name: string | null;
      category_slug: string | null;
    }>(query, [currentDate, limit]);
    
    // Lấy tags cho từng bài viết
    const postsWithTags = await Promise.all(
      posts.map(async (post) => {
        const { rows: tags } = await db.query<{id: string; name: string; slug: string}>(
          `SELECT t.id, t.name, t.slug FROM tags t 
           JOIN post_tags pt ON t.id = pt.tag_id 
           WHERE pt.post_id = $1`,
          [post.id]
        );
        return { ...post, tags };
      })
    );
    
    this.sendSuccess(res, postsWithTags, 'Lấy danh sách bài viết nổi bật thành công');
  });

  /**
   * Lấy danh sách bài viết hot
   * @route GET /api/posts/hot
   * @access Public
   */
  public getHotPosts = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const limit = parseInt(req.query.limit as string) || 5;
    const currentDate = new Date().toISOString();
    
    const query = `
      SELECT p.*, 
             u.username as author_username,
             u.avatar as author_avatar,
             c.name as category_name,
             c.slug as category_slug
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_hot = true 
        AND p.status = 'published'
        AND (p.hot_expires_at IS NULL OR p.hot_expires_at > $1)
      ORDER BY p.hot_order ASC, p.view_count DESC, p.published_at DESC
      LIMIT $2`;
    
    const { rows: posts } = await db.query<{
      id: string;
      title: string;
      content: string;
      slug: string;
      status: string;
      view_count: number;
      like_count: number;
      comment_count: number;
      featured_order: number | null;
      is_featured: boolean;
      featured_expires_at: Date | null;
      is_hot: boolean;
      hot_order: number | null;
      hot_expires_at: Date | null;
      author_id: string;
      category_id: string | null;
      thumbnail: string | null;
      summary: string | null;
      published_at: Date | null;
      created_at: Date;
      updated_at: Date;
      author_username: string | null;
      author_avatar: string | null;
      category_name: string | null;
      category_slug: string | null;
    }>(query, [currentDate, limit]);
    
    // Lấy tags cho từng bài viết
    const postsWithTags = await Promise.all(
      posts.map(async (post) => {
        const { rows: tags } = await db.query<{id: string; name: string; slug: string}>(
          `SELECT t.id, t.name, t.slug FROM tags t 
           JOIN post_tags pt ON t.id = pt.tag_id 
           WHERE pt.post_id = $1`,
          [post.id]
        );
        return { ...post, tags };
      })
    );
    
    this.sendSuccess(res, postsWithTags, 'Lấy danh sách bài viết hot thành công');
  });

  /**
   * Gửi phản hồi lỗi
   * @param res Đối tượng response của Express
   * @param message Thông báo lỗi
   * @param statusCode Mã trạng thái HTTP (mặc định: 400)
   */
  protected sendError(
    res: Response,
    message: string = 'Có lỗi xảy ra',
    statusCode: number = 400
  ): void {
    res.status(statusCode).json({
      success: false,
      message,
    });
  }

  /**
   * Gửi phản hồi không tìm thấy
   * @param res Đối tượng response của Express
   * @param message Thông báo lỗi (tùy chọn)
   */
  protected notFound(res: Response, message: string = 'Không tìm thấy tài nguyên'): void {
    this.sendNotFound(res, message);
  }

  /**
   * Gửi phản hồi thành công
   * @param res Đối tượng response của Express
   * @param data Dữ liệu trả về
   * @param message Thông báo thành công (tùy chọn)
   */
  protected success<T>(res: Response, data: T, message: string = 'Thành công'): Response {
    return res.status(200).json({
      success: true,
      message,
      data,
    });
  }

  /**
   * Cập nhật trạng thái nổi bật cho bài viết
   */
  public updateFeaturedStatus = catchAsync(async (req: Request, res: Response) => {
    const { postId } = req.params;
    const { is_featured, featured_order, featured_expires_at } = req.body;
    
    const query = `
      UPDATE posts 
      SET 
        is_featured = COALESCE($1, is_featured),
        featured_order = COALESCE($2, featured_order),
        featured_expires_at = $3,
        updated_at = NOW()
      WHERE id = $4
      RETURNING *`;
    
    const { rows } = await db.query<{ id: string }>(query, [
      is_featured,
      featured_order,
      featured_expires_at || null,
      postId
    ]);
    
    if (rows.length === 0) {
      return this.notFound(res, 'Bài viết không tồn tại');
    }
    
    this.success(res, rows[0], 'Cập nhật trạng thái nổi bật thành công');
  });

  /**
   * Cập nhật trạng thái hot cho bài viết
   */
  public updateHotStatus = catchAsync(async (req: Request, res: Response) => {
    const { postId } = req.params;
    const { is_hot, hot_order, hot_expires_at } = req.body;
    
    const query = `
      UPDATE posts 
      SET 
        is_hot = COALESCE($1, is_hot),
        hot_order = COALESCE($2, hot_order),
        hot_expires_at = $3,
        updated_at = NOW()
      WHERE id = $4
      RETURNING *`;
    
    const { rows } = await db.query(query, [
      is_hot,
      hot_order,
      hot_expires_at || null,
      postId
    ]);
    
    if (rows.length === 0) {
      return this.notFound(res, 'Bài viết không tồn tại');
    }
    
    this.sendSuccess(res, rows[0], 'Cập nhật trạng thái hot thành công');
  });

  /**
   * Lấy thông tin chi tiết của một bài viết
   * Bao gồm thông tin tác giả, danh mục và các thẻ
   * @param postId - ID của bài viết cần lấy thông tin
   * @returns Thông tin chi tiết bài viết hoặc null nếu không tìm thấy
   */
  private getPostWithDetails = async (postId: string): Promise<PostWithDetails | null> => {
    // Lấy thông tin bài viết
    const postQuery = `
      SELECT 
        p.*,
        u.username as "author_username",
        u.avatar as "author_avatar",
        c.name as "category_name",
        c.slug as "category_slug",
        (
          SELECT COALESCE(json_agg(json_build_object(
            'id', t.id,
            'name', t.name,
            'slug', t.slug
          )), '[]'::json)
          FROM tags t
          JOIN post_tags pt ON t.id = pt.tag_id
          WHERE pt.post_id = p.id
        ) as tags
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1`;

    const result = await db.query<PostWithDetails & { 
      tags: Array<{ id: string; name: string; slug: string }>;
      author_username: string;
      author_avatar: string;
      category_name?: string;
      category_slug?: string;
    }>(postQuery, [postId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    
    // Map the database row to a PostWithDetails object
    const postWithDetails: PostWithDetails = {
      ...PostService.mapPostRowToPost(row),
      author_username: row.author_username || '',
      author_avatar: row.author_avatar || '',
      category_name: row.category_name || 'Không có danh mục',
      category_slug: row.category_slug || '',
      tags: row.tags || []
    };
    
    return postWithDetails;
  };


  /**
   * Lấy danh sách bài viết mới nhất
   */
  public getLatestPosts = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { limit = '10' } = req.query;
    const posts = await PostService.getLatestPosts(parseInt(limit as string, 10));
    this.sendSuccess(res, posts, 'Lấy danh sách bài viết mới nhất thành công');
  });

  /**
   * Lấy danh sách bài viết theo danh mục
   */
  public getPostsByCategory = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { categoryId } = req.params;
    const { limit = '10', page = '1' } = req.query;
    
    // Chuyển đổi categoryId sang number
    const categoryIdNum = parseInt(categoryId, 10);
    if (isNaN(categoryIdNum)) {
      return this.sendError(res, 'ID danh mục không hợp lệ', 400);
    }

    try {
      const result = await PostService.getPostsByCategory({
        categoryId: categoryIdNum.toString(), // Chuyển về string để phù hợp với interface
        limit: parseInt(limit as string, 10),
        offset: (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10)
      });
      
      this.sendSuccess(res, {
        posts: result.posts,
        pagination: {
          total: result.total,
          page: parseInt(page as string, 10),
          limit: parseInt(limit as string, 10),
          totalPages: Math.ceil(result.total / parseInt(limit as string, 10))
        }
      }, 'Lấy danh sách bài viết theo danh mục thành công');
    } catch (error) {
      logger.error('Lỗi khi lấy bài viết theo danh mục:', error);
      this.sendError(res, 'Không thể lấy danh sách bài viết', 500);
    }
  });

  /**
   * Lấy danh sách bài viết theo thẻ
   */
  public getPostsByTag = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { tagId } = req.params;
    const { limit = '10', offset = '0' } = req.query;
    
    const { posts, total } = await PostService.getPostsByTag({
      tagId,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10)
    });

    this.sendPaginated(
      res,
      posts,
      total,
      Math.floor(parseInt(offset as string, 10) / parseInt(limit as string, 10)) + 1,
      parseInt(limit as string, 10),
      'Lấy danh sách bài viết theo thẻ thành công'
    );
  });

  /**
   * Lấy danh sách tất cả bài viết với phân trang và bộ lọc
   */
  public getAllPosts = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { 
      limit = '10', 
      offset = '0', 
      category, 
      status,
      search
    } = req.query;

    const limitNum = parseInt(limit as string, 10);
    const offsetNum = parseInt(offset as string, 10);

    // Xử lý tìm kiếm nếu có từ khóa
    if (search) {
      const { posts, total } = await PostService.searchPosts(
        search as string,
        limitNum,
        offsetNum
      );

      return this.sendPaginated(
        res,
        posts,
        total,
        Math.floor(offsetNum / limitNum) + 1,
        limitNum,
        'Tìm kiếm bài viết thành công'
      );
    }

    // Xử lý lọc theo danh mục nếu có
    if (category) {
      const { posts, total } = await PostService.getPostsByCategory({
        categoryId: category as string,
        limit: limitNum,
        offset: offsetNum
      });

      return this.sendPaginated(
        res,
        posts,
        total,
        Math.floor(offsetNum / limitNum) + 1,
        limitNum,
        'Lấy danh sách bài viết theo danh mục thành công'
      );
    }


    // Mặc định: Lấy danh sách bài viết mới nhất nếu không có điều kiện lọc
    const posts = await PostService.getLatestPosts(limitNum);
    this.sendSuccess(
      res, 
      posts, 
      'Lấy danh sách bài viết mới nhất thành công'
    );
  });

  /**
   * Lấy chi tiết bài viết theo ID hoặc slug
   */
  public getPostById = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const post = await PostService.getPostById(id);
    
    if (!post) {
      return this.sendNotFound(res, 'Không tìm thấy bài viết');
    }
    
    this.sendSuccess(res, post, 'Lấy thông tin bài viết thành công');
  });

  /**
   * Tạo mới một bài viết
   * Yêu cầu quyền đăng nhập và có quyền tạo bài viết
   */
  /**
   * Thêm tags vào bài viết
   * @param postId ID của bài viết
   * @param tags Mảng các tag IDs hoặc tag names
   */
  private async addTagsToPost(postId: string, tags: Array<string | number>): Promise<void> {
    if (!tags || tags.length === 0) return;

    try {
      // Xóa tất cả các tag cũ của bài viết
      await db.query('DELETE FROM post_tags WHERE post_id = $1', [postId]);

      // Thêm các tag mới
      const values = tags.map((tag, index) => {
        const pos = index * 2 + 1;
        return `($1, $${pos + 1})`;
      }).join(',');

      const tagIds = tags.map(tag => tag);
      const query = `
        INSERT INTO post_tags (post_id, tag_id)
        VALUES ${values}
        ON CONFLICT (post_id, tag_id) DO NOTHING`;

      await db.query(query, [postId, ...tagIds]);
    } catch (error) {
      console.error('Error adding tags to post:', error);
      // Không throw error để không ảnh hưởng đến luồng chính
    }
  }

  /**
   * Tạo mới một bài viết
   * Yêu cầu quyền đăng nhập và có quyền tạo bài viết
   */
  public createPost = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id; // Lấy user_id từ middleware xác thực
    if (!userId) {
      return this.sendError(res, 'Không tìm thấy thông tin người dùng', 401);
    }

    const postData = {
      ...req.body,
      author_id: userId,
      status: req.body.status || 'draft',
      created_at: new Date(),
      updated_at: new Date()
    } as any; // Sử dụng type assertion tạm thởi để tránh lỗi TypeScript

    // Kiểm tra các trường bắt buộc
    if (!postData.title || !postData.content || !postData.category_id) {
      return this.sendError(res, 'Vui lòng điền đầy đủ tiêu đề, nội dung và chọn danh mục', 400);
    }

    try {
      // Tạo slug tự động từ tiêu đề nếu không có sẵn
      if (!postData.slug) {
        postData.slug = postData.title
          .toLowerCase()
          .replace(/[^\w\s-]/g, '') // Loại bỏ ký tự đặc biệt
          .replace(/\s+/g, '-')     // Thay dấu cách bằng dấu gạch ngang
          .replace(/--+/g, '-')     // Loại bỏ nhiều dấu gạch ngang liên tiếp
          .trim();
      }

      // Insert post vào database
      const query = `
        INSERT INTO posts (
          title, content, category_id, status, 
          thumbnail, summary, slug, author_id, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`;

      const values = [
        postData.title,
        postData.content,
        postData.category_id,
        postData.status,
        postData.thumbnail || null,
        postData.summary || null,
        postData.slug,
        postData.user_id,
        postData.created_at,
        postData.updated_at
      ];

      const result = await db.query<Post>(query, values);
      const newPost = result.rows[0];
      
      // Handle tags nếu có
      if (postData.tags && postData.tags.length > 0) {
        await this.addTagsToPost(newPost.id, postData.tags);
      }

      // Get bài viết đầy đủ với thông tin tác giả và danh mục
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
   * Cập nhật thông tin bài viết
   * Chỉ chủ sở hữu bài viết hoặc admin mới có quyền cập nhật
   */
  public updatePost = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const updateData = req.body;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return this.sendError(res, 'Không tìm thấy thông tin người dùng', 401);
    }

    try {
      // Kiểm tra sự tồn tại của bài viết
      const post = await this.getPostWithDetails(id);
      if (!post) {
        return this.sendNotFound(res, 'Không tìm thấy bài viết');
      }
      
      // Kiểm tra quyền sở hữu (trừ khi là admin)
      if ((req as any).user.role !== 'admin' && post.user_id !== userId) {
        return this.sendForbidden(res, 'Bạn không có quyền chỉnh sửa bài viết này');
      }

      // Xây dựng câu lệnh UPDATE động
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      
      // Thêm các trường cập nhật
      if (updateData.title) {
        updateFields.push(`title = $${paramIndex++}`);
        values.push(updateData.title);
        
        // Cập nhật slug nếu tiêu đề thay đổi
        if (!updateData.slug) {
          updateFields.push(`slug = $${paramIndex++}`);
          values.push(
            updateData.title
              .toLowerCase()
              .replace(/[^\w\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/--+/g, '-')
              .trim()
          );
        }
      }
      
      if (updateData.content) {
        updateFields.push(`content = $${paramIndex++}`);
        values.push(updateData.content);
      }
      
      if (updateData.category_id) {
        updateFields.push(`category_id = $${paramIndex++}`);
        values.push(updateData.category_id);
      }
      
      if (updateData.status) {
        updateFields.push(`status = $${paramIndex++}`);
        values.push(updateData.status);
      }
      
      if (updateData.thumbnail !== undefined) {
        updateFields.push(`thumbnail = $${paramIndex++}`);
        values.push(updateData.thumbnail);
      }
      
      if (updateData.summary !== undefined) {
        updateFields.push(`summary = $${paramIndex++}`);
        values.push(updateData.summary);
      }
      
      if (updateData.slug) {
        updateFields.push(`slug = $${paramIndex++}`);
        values.push(updateData.slug);
      }
      
      // Thêm thời gian cập nhật
      updateFields.push(`updated_at = NOW()`);
      
      // Thêm ID vào cuối mảng giá trị
      values.push(id);
      
      // Thực hiện cập nhật
      const updateQuery = `
        UPDATE posts 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *`;
      
      const result = await db.query<Post>(updateQuery, values);
      
      if (result.rows.length === 0) {
        return this.sendError(res, 'Cập nhật bài viết thất bại', 500);
      }
      
      // Cập nhật tags nếu có
      if (updateData.tags) {
        // Xóa tất cả tags cũ
        await db.query('DELETE FROM post_tags WHERE post_id = $1', [id]);
        
        // Thêm tags mới nếu có
        if (updateData.tags.length > 0) {
          await this.addTagsToPost(id, updateData.tags);
        }
      }
      
      // Lấy lại thông tin đầy đủ của bài viết
      const updatedPost = await this.getPostWithDetails(id);
      if (!updatedPost) {
        return this.sendError(res, 'Không thể tải thông tin cập nhật', 500);
      }
      
      this.sendSuccess(res, updatedPost, 'Cập nhật bài viết thành công');
    } catch (error: any) {
      if (error.code === '23505') { // Unique violation
        return this.sendError(res, 'Slug đã tồn tại, vui lòng chọn tiêu đề khác', 400);
      }
      logger.error('Error cập nhật bài viết:', error);
      this.sendError(res, 'Có lỗi xảy ra khi cập nhật bài viết', 500);
    }
  });

  /**
   * Xóa một bài viết
   * Chỉ chủ sở hữu bài viết hoặc admin mới có quyền xóa
   * Khi xóa bài viết sẽ xóa luôn các bình luận và thẻ liên quan
   */
  public deletePost = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    
    // Kiểm tra sự tồn tại của bài viết
    const post = await PostService.getPostById(id);
    if (!post) {
      return this.sendNotFound(res, 'Không tìm thấy bài viết');
    }
    
    // Kiểm tra quyền sở hữu (trừ khi là admin)
    if ((req as any).user.role !== 'admin' && post.user_id !== (req as any).user.id) {
      return this.sendForbidden(res, 'Bạn không có quyền xóa bài viết này');
    }
    
    await PostService.deletePost(id);
    this.sendSuccess(res, null, 'Xóa bài viết thành công');
  });

  /**
   * Tăng số lượt xem của bài viết lên 1
   * Gọi API này mỗi khi người dùng xem chi tiết bài viết
   */
  public incrementViewCount = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    await PostService.incrementViewCount(id);
    this.sendSuccess(res, null, 'Cập nhật số lượt xem thành công');
  });

  /**
   * Tăng số lượt thích
   */
  public incrementLikeCount = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    await PostService.incrementViewCount(id);
    this.sendSuccess(res, null, 'Cập nhật số lượt thích thành công');
  });

  /**
   * Tìm kiếm bài viết
   * Sử dụng tham số search trong query params
   */
  public searchPosts = this.getAllPosts;
}
