import type {
  Post,
  PostStatus,
  CreatePostDto,
  UpdatePostDto,
  PostFilterOptions,
  PostWithDetails
} from '../types/post';

import db from '../config/database';
import logger from '../utils/logger';

interface GetPostsOptions {
  limit?: number;
  offset?: number;
  status?: PostStatus;
  sort?: string;
  order?: 'asc' | 'desc';
  authorId?: string;
}

class PostService {
  /**
   * Tạo slug từ tiêu đề bài viết
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  }

  async createPost(data: CreatePostDto): Promise<Post> {
    const client = await db.getClient();
    try {
      await client.query('BEGIN', []);

      // Tạo slug từ tiêu đề
      const slug = this.generateSlug(data.title);
      
      // Thêm bài viết mới
      const result = await client.query(
        `INSERT INTO posts (title, slug, content, status, image_url, tags, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING *`,
        [
          data.title,
          slug,
          data.content,
          data.status || 'draft',
          data.image_url || null,
          data.tags ? JSON.stringify(data.tags) : null
        ]
      );

      const newPost = result.rows[0] as Post;
      await client.query('COMMIT', []);
      return newPost;
    } catch (error) {
      await client.query('ROLLBACK', []);
      console.error('Error creating post:', error);
      throw new Error('Failed to create post');
    } finally {
      client.release();
    }
  }

  /**
   * Cập nhật bài viết đã tồn tại
   */
  async updatePost(id: string, data: UpdatePostDto): Promise<Post | null> {
    const client = await db.getClient();
    try {
      await client.query('BEGIN', []);
      
      // Xây dựng câu query động
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (data.title) {
        updates.push(`title = $${paramIndex++}`);
        values.push(data.title);
        updates.push(`slug = $${paramIndex++}`);
        values.push(this.generateSlug(data.title));
      }
      if (data.content !== undefined) {
        updates.push(`content = $${paramIndex++}`);
        values.push(data.content);
      }
      if (data.status) {
        updates.push(`status = $${paramIndex++}`);
        values.push(data.status);
      }
      if (data.image_url !== undefined) {
        updates.push(`image_url = $${paramIndex++}`);
        values.push(data.image_url);
      }
      if (data.tags !== undefined) {
        updates.push(`tags = $${paramIndex++}`);
        values.push(Array.isArray(data.tags) ? JSON.stringify(data.tags) : data.tags);
      }

      // If nothing to update
      if (updates.length === 0) {
        throw new Error('No fields to update');
      }

      // Add updated_at field
      updates.push(`updated_at = $${paramIndex++}`);
      values.push(new Date());

      // Add id to the end of values array
      values.push(id);

      const query = `
        UPDATE posts 
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await client.query(query, values);
      
      const updatedPost = result.rows[0] as Post;
      if (!result.rows[0]) {
        await client.query('ROLLBACK', []);
        return null;
      }

      await client.query('COMMIT', []);

      // Lấy lại thông tin đầy đủ của bài viết
      const fullPost = await this.getPostById(id);
      return fullPost;
    } catch (error) {
      await client.query('ROLLBACK', []);
      console.error('Error updating post:', error);
      throw new Error('Failed to update post');
    } finally {
      client.release();
    }
  }

  /**
   * Xóa bài viết
   */
  async deletePost(id: string): Promise<boolean> {
    const client = await db.getClient();
    try {
      await client.query('BEGIN', []);
      
      // Xóa các bản ghi liên quan trong bảng post_categories
      await client.query('DELETE FROM post_categories WHERE post_id = $1', [id]);
      
      // Xóa bài viết
      const result = await client.query('DELETE FROM posts WHERE id = $1 RETURNING *', [id]);
      
      if (result.rowCount === 0) {
        await client.query('ROLLBACK', []);
        return false;
      }
      
      await client.query('COMMIT', []);
      return true;
    } catch (error) {
      await client.query('ROLLBACK', []);
      console.error('Error deleting post:', error);
      throw new Error('Failed to delete post');
    } finally {
      client.release();
    }
  }

  /**
   * Lấy bài viết theo ID
   */
  async getPostById(id: string): Promise<Post | null> {
    try {
      // Chỉ lấy các trường cần thiết từ bảng posts
      const query = `
        SELECT 
          id,
          title,
          slug,
          content,
          status,
          created_at,
          updated_at,
          image_url,
          tags
        FROM posts 
        WHERE id = $1`;

      const result = await db.query<Post>(query, [id]);
      const post = result.rows[0];

      if (!post) return null;

      // Xử lý tags
      let tags: string[] = [];
      if (post.tags) {
        if (Array.isArray(post.tags)) {
          // Nếu tags đã là mảng, lọc các giá trị hợp lệ
          tags = post.tags.filter((t: any) => t !== null && t !== '');
        } else if (typeof post.tags === 'string') {
          try {
            // Thử parse nếu là JSON string
            const parsed = JSON.parse(post.tags);
            tags = Array.isArray(parsed) ? parsed : [];
          } catch (e) {
            // Nếu không phải JSON, xử lý như chuỗi phân cách bằng dấu phẩy
            const tagsStr = post.tags as unknown as string;
            tags = tagsStr
              .split(',')
              .map((t: string) => t.trim())
              .filter((t: string) => t !== '');
          }
        }
      }

      // Tạo đối tượng bài viết với các trường cần thiết
      return {
        ...post,
        tags,
        image_url: post.image_url || '',
        created_at: post.created_at || new Date(),
        updated_at: post.updated_at || new Date(),
        status: (post.status || 'draft') as PostStatus
      };
    } catch (error) {
      logger.error('Error getting post by id:', error);
      throw new Error('Failed to get post');
    }
  }

  /**
   * Lấy bài viết theo đường dẫn tĩnh (slug)
   */
  async getPostBySlug(slug: string): Promise<Post | null> {
    try {
      const result = await db.query<Post>('SELECT * FROM posts WHERE slug = $1', [slug]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting post by slug:', error);
      throw new Error('Failed to get post');
    }
  }

  /**
   * Lấy danh sách bài viết có phân trang và lọc
   */
  async getPostsByCategory(categoryId: string, options: GetPostsOptions = {}): Promise<Post[]> {
    try {
      const {
        limit = 10,
        offset = 0,
        status,
        sort = 'created_at',
        order = 'desc',
      } = options;

      // Build WHERE conditions
      const whereConditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (status) {
        whereConditions.push(`status = $${paramIndex++}`);
        params.push(status);
      }

      whereConditions.push(`category_id = $${paramIndex++}`);
      params.push(categoryId);

      const whereClause = whereConditions.length > 0
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM posts 
        ${whereClause}
      `;

      const countResult = await db.query<{ total: string }>(countQuery, params);

      // Get paginated results
      const query = `
        SELECT * 
        FROM posts 
        ${whereClause}
        ORDER BY ${sort} ${order}
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;

      const result = await db.query<Post>(query, [
        ...params,
        limit,
        offset
      ]);

      // Xử lý tags từ chuỗi phân cách bằng dấu phẩy sang mảng
      return result.rows.map(post => {
        if (post.tags) {
          const tagsStr = post.tags as unknown as string;
          if (typeof tagsStr === 'string') {
            // Nếu tags là chuỗi JSON, parse nó
            if (tagsStr.trim().startsWith('[')) {
              try {
                post.tags = JSON.parse(tagsStr);
              } catch (e) {
                logger.warn(`Failed to parse tags as JSON for post ${post.id}:`, e);
                // Nếu không parse được JSON, xử lý như chuỗi phân cách bằng dấu phẩy
                post.tags = tagsStr.split(',').map(tag => tag.trim()).filter(Boolean);
              }
            } else {
              // Xử lý chuỗi phân cách bằng dấu phẩy
              post.tags = tagsStr.split(',').map(tag => tag.trim()).filter(Boolean);
            }
          }
        } else {
          post.tags = [];
        }
        return post;
      });
    } catch (error) {
      logger.error('Error getting posts:', error);
      throw new Error('Failed to get posts');
    }
  }

  /**
   * Tăng số lượt xem của bài viết
   */
  async incrementViewCount(id: string): Promise<boolean> {
    try {
      const result = await db.query<{ id: string }>(
        'UPDATE posts SET view_count = view_count + 1 WHERE id = $1 RETURNING id',
        [id]
      );
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      logger.error('Error incrementing view count:', error);
      throw new Error('Failed to increment view count');
    }
  }

  /**
   * Tăng số lượt thích của bài viết
   */
  async incrementLikeCount(id: string): Promise<boolean> {
    try {
      const result = await db.query<{ id: string }>(
        'UPDATE posts SET like_count = like_count + 1 WHERE id = $1 RETURNING id',
        [id]
      );
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      logger.error('Error incrementing like count:', error);
      throw new Error('Failed to increment like count');
    }
  }

  /**
   * Lấy các bài viết mới nhất đã xuất bản
   */
  async getLatestPosts(limit: number = 10): Promise<Post[]> {
    try {
      const result = await db.query<Post>(
        `SELECT * 
         FROM posts 
         WHERE status = 'published'
         ORDER BY created_at DESC
         LIMIT $1`,
        [limit]
      );
      return result.rows;
    } catch (error) {
      logger.error('Error getting latest posts:', error);
      throw new Error('Failed to get latest posts');
    }
  }

  /**
   * Tìm kiếm bài viết theo từ khóa
   */
  async searchPosts(query: string, limit: number = 10, offset: number = 0): Promise<{ posts: Post[], total: number }> {
    try {
      const searchQuery = `%${query}%`;

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM posts p
        WHERE p.status = 'published'
          AND (p.title ILIKE $1 OR p.content ILIKE $1 OR p.summary ILIKE $1)
      `;

      // Get paginated results
      const postsQuery = `
        SELECT p.*, 
               u.username as author_username,
               u.avatar as author_avatar,
               c.name as category_name,
               c.slug as category_slug
        FROM posts p
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.status = 'published'
          AND (p.title ILIKE $1 OR p.content ILIKE $1 OR p.summary ILIKE $1)
        ORDER BY p.published_at DESC
        LIMIT $2 OFFSET $3`;

      const [countResult, postsResult] = await Promise.all([
        db.query<{ total: string }>(countQuery, [searchQuery]),
        db.query<Post>(postsQuery, [searchQuery, limit, offset])
      ]);

      const total = parseInt(countResult.rows[0].total, 10);

      // Xử lý tags từ chuỗi phân cách bằng dấu phẩy sang mảng
      const posts = postsResult.rows.map(post => {
        if (post.tags) {
          const tagsStr = post.tags as unknown as string;
          if (typeof tagsStr === 'string') {
            // Nếu tags là chuỗi JSON, parse nó
            if (tagsStr.trim().startsWith('[')) {
              try {
                post.tags = JSON.parse(tagsStr);
              } catch (e) {
                logger.warn(`Failed to parse tags as JSON for post ${post.id}:`, e);
                // Nếu không parse được JSON, xử lý như chuỗi phân cách bằng dấu phẩy
                post.tags = tagsStr.split(',').map(tag => tag.trim()).filter(Boolean);
              }
            } else {
              // Xử lý chuỗi phân cách bằng dấu phẩy
              post.tags = tagsStr.split(',').map(tag => tag.trim()).filter(Boolean);
            }
          }
        } else {
          post.tags = [];
        }
        return post;
      });

      return {
        posts,
        total
      };
    } catch (error) {
      logger.error('Error searching posts:', error);
      throw new Error('Failed to search posts');
    }
  }
}

export default new PostService();
