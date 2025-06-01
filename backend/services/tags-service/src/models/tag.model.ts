import * as pg from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '../config/database';
import { ApiError } from '../utils/error';
import logger from '../utils/logger';
import { generateUniqueSlug } from '../utils/slug';

/**
 * Interface đại diện cho một tag trong cơ sở dữ liệu
 */
interface TagRow {
  /** ID của tag (định dạng UUID) */
  id: string;
  
  /** Tên hiển thị của tag */
  name: string;
  
  /** Đường dẫn thân thiện SEO */
  slug: string;
  
  /** Mô tả chi tiết về tag */
  description: string | null;
  
  /** Trạng thái hoạt động của tag */
  is_active: boolean;
  
  /** Thời gian tạo */
  created_at: Date;
  
  /** Thời gian cập nhật gần nhất */
  updated_at: Date | null;
  
  /** Người tạo */
  created_by: string | null;
  
  /** Người cập nhật gần nhất */
  updated_by: string | null;
  
  /** Số lượng bài viết sử dụng tag này */
  post_count: number;
  
  /** Số lượng người theo dõi tag */
  follower_count: number;
  
  /** Điểm nổi bật (dùng để xếp hạng) */
  trending_score: number;
  
  /** Thời điểm cập nhật điểm nổi bật lần cuối */
  trending_updated_at: Date | null;
}

/**
 * Interface đại diện cho một tag trong ứng dụng
 */
interface Tag extends Omit<TagRow, 'is_active' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'post_count' | 'follower_count' | 'trending_score' | 'trending_updated_at'> {
  /** Trạng thái hoạt động của tag */
  isActive: boolean;
  
  /** Thời gian tạo dưới dạng chuỗi ISO */
  createdAt: string;
  
  /** Thời gian cập nhật gần nhất dưới dạng chuỗi ISO */
  updatedAt: string | null;
  
  /** Số lượng bài viết sử dụng tag này */
  postCount: number;
  
  /** Số lượng người theo dõi tag */
  followerCount: number;
  
  /** Điểm nổi bật (dùng để xếp hạng) */
  trendingScore: number;
  
  /** Thời điểm cập nhật điểm nổi bật lần cuối */
  trendingUpdatedAt: string | null;
  
  /** ID người tạo */
  createdBy: string | null;
  
  /** ID người cập nhật gần nhất */
  updatedBy: string | null;
}

/**
 * Dữ liệu cần thiết để tạo mới một tag
 */
interface CreateTagInput {
  /** Tên tag */
  name: string;
  
  /** Đường dẫn thân thiện SEO (nếu không cung cấp sẽ tự động tạo từ tên) */
  slug?: string;
  
  /** Mô tả chi tiết */
  description?: string;
  
  /** Trạng thái hoạt động (mặc định: true) */
  isActive?: boolean;
  
  /** ID người tạo */
  createdBy?: string;
}

/**
 * Dữ liệu cập nhật tag
 */
interface UpdateTagInput {
  /** Tên tag mới */
  name?: string;
  
  /** Đường dẫn thân thiện SEO mới */
  slug?: string;
  
  /** Mô tả mới */
  description?: string | null;
  
  /** Trạng thái hoạt động mới */
  isActive?: boolean;
  
  /** ID người cập nhật */
  updatedBy?: string | null;
}

/**
 * Kết quả phân trang
 */
interface PaginatedResult<T> {
  /** Danh sách các mục trên trang hiện tại */
  items: T[];
  
  /** Thông tin phân trang */
  pagination: {
    /** Tổng số bản ghi */
    total: number;
    
    /** Trang hiện tại */
    page: number;
    
    /** Số lượng bản ghi mỗi trang */
    limit: number;
    
    /** Tổng số trang */
    totalPages: number;
    
    /** Có trang tiếp theo không */
    hasNextPage: boolean;
    
    /** Có trang trước đó không */
    hasPreviousPage: boolean;
  };
}

class TagModel {
  private static instance: TagModel;
  private pool: pg.Pool;

  private constructor() {
    this.pool = Database.getInstance().getPool();
  }

  /**
   * Lấy thể hiện duy nhất của TagModel (Áp dụng mẫu Singleton)
   */
  public static getInstance(): TagModel {
    if (!TagModel.instance) {
      TagModel.instance = new TagModel();
    }
    return TagModel.instance;
  }

  /**
   * Map database row to Tag object
   */
  private mapTagRowToTag(row: TagRow): Tag {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      isActive: row.is_active,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at?.toISOString() || null,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
      postCount: row.post_count || 0,
      followerCount: row.follower_count || 0,
      trendingScore: row.trending_score || 0,
      trendingUpdatedAt: row.trending_updated_at?.toISOString() || null
    };
  }

  /**
   * Cập nhật thông tin thẻ
   * @param id ID của thẻ cần cập nhật
   * @param tagData Dữ liệu cập nhật
   * @returns Thông tin thẻ đã cập nhật hoặc null nếu không tìm thấy
   * @throws {ApiError} Nếu có lỗi xảy ra
   */
  /**
   * Cập nhật thông tin thẻ
   * @param id ID của thẻ cần cập nhật
   * @param tagData Dữ liệu cập nhật
   * @returns Thông tin thẻ đã cập nhật hoặc null nếu không tìm thấy
   * @throws {ApiError} Nếu có lỗi xảy ra
   */
  public async update(id: string, tagData: UpdateTagInput): Promise<Tag | null> {
    const client = await this.pool.connect();
    
    try {
      const { name, slug, description, isActive, updatedBy } = tagData;
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      // Validate input
      if (!id) {
        throw new ApiError(400, 'ID thẻ là bắt buộc');
      }

      // Check if tag exists
      const existingTag = await this.findById(id);
      if (!existingTag) {
        return null;
      }

      // Process name update
      if (name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(name);
      }
      
      // Process slug update with uniqueness check
      if (slug !== undefined) {
        const existingTagWithSlug = await this.findBySlug(slug);
        if (existingTagWithSlug && existingTagWithSlug.id !== id) {
          throw new ApiError(400, 'Slug đã tồn tại');
        }
        updates.push(`slug = $${paramIndex++}`);
        values.push(slug);
      }
      
      // Process description update
      if (description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(description);
      }
      
      // Process isActive update
      if (isActive !== undefined) {
        updates.push(`is_active = $${paramIndex++}`);
        values.push(isActive);
      }
      
      // Process updatedBy update
      if (updatedBy !== undefined) {
        updates.push(`updated_by = $${paramIndex++}`);
        values.push(updatedBy);
      }
      
      // Check if there are any updates
      if (updates.length === 0) {
        throw new ApiError(400, 'Không có trường nào được cập nhật');
      }
      
      // Add updated_at timestamp
      updates.push(`updated_at = NOW()`);
      
      // Add WHERE condition
      values.push(id);
      
      // Build and execute the query
      const query = `
        UPDATE tags 
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      
      const result = await client.query<TagRow>(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const updatedTag = result.rows[0];
      if (!updatedTag) {
        return null;
      }
      
      return this.mapTagRowToTag(updatedTag);
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      if (error.code === '23505') { // Unique violation
        throw new ApiError(409, 'Tag với tên hoặc slug này đã tồn tại');
      }
      
      logger.error(`Lỗi khi cập nhật thẻ với ID ${id}:`, error);
      throw new ApiError(500, 'Lỗi khi cập nhật thẻ');
    } finally {
      client.release();
    }
  }

  /**
   * Lấy tất cả slug hiện có trong database
   */
  private async getAllSlugs(): Promise<string[]> {
    const client = await this.pool.connect();
    try {
      const query = 'SELECT slug FROM tags';
      const result = await client.query<{slug: string}>(query);
      return result.rows.map(row => row.slug);
    } catch (error) {
      logger.error('Lỗi khi lấy danh sách slug:', error);
      throw new ApiError(500, 'Lỗi khi lấy danh sách slug');
    } finally {
      client.release();
    }
  }

  /**
   * Tạo mới một tag
   */
  public async create(tagData: CreateTagInput): Promise<Tag> {
    const client = await this.pool.connect();
    try {
      const { name, description, isActive = true } = tagData;
      
      // Generate slug from name if not provided
      let { slug } = tagData;
      if (!slug) {
        const existingSlugs = await this.getAllSlugs();
        slug = await generateUniqueSlug(name, existingSlugs);
      }

      const query = `
        INSERT INTO tags (id, name, slug, description, is_active, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING *
      `;
      
      const values = [uuidv4(), name, slug, description, isActive];
      const result = await client.query<TagRow>(query, values);
      
      if (result.rows.length === 0 || !result.rows[0]) {
        throw new ApiError(500, 'Không thể tạo tag mới');
      }
      
      return this.mapTagRowToTag(result.rows[0]);
    } catch (error: any) {
      logger.error('Lỗi khi tạo tag:', error);
      if (error.code === '23505') { // Duplicate key
        throw new ApiError(400, 'Tên hoặc slug đã tồn tại');
      }
      throw new ApiError(500, 'Lỗi khi tạo tag mới');
    } finally {
      client.release();
    }
  }

  /**
   * Tìm thẻ theo ID
   * @param id ID của thẻ cần tìm
   * @returns Thông tin thẻ hoặc null nếu không tìm thấy
   * @throws {ApiError} Nếu có lỗi xảy ra
   */
  public async findById(id: string): Promise<Tag | null> {
    const client = await this.pool.connect();
    try {
      const query = 'SELECT * FROM tags WHERE id = $1';
      const result = await client.query<TagRow>(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      if (!row) {
        return null;
      }
      
      return this.mapTagRowToTag(row);
    } catch (error) {
      logger.error('Lỗi khi tìm kiếm thẻ theo ID:', error);
      throw new ApiError(500, 'Lỗi khi tìm kiếm thẻ');
    } finally {
      client.release();
    }
  }

  /**
   * Tìm thẻ theo slug
   * @param slug Slug của thẻ cần tìm
   * @returns Thông tin thẻ hoặc null nếu không tìm thấy
   * @throws {ApiError} Nếu có lỗi xảy ra
   */
  public async findBySlug(slug: string): Promise<Tag | null> {
    const client = await this.pool.connect();
    try {
      const query = 'SELECT * FROM tags WHERE slug = $1';
      const result = await client.query<TagRow>(query, [slug]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      if (!row) {
        return null;
      }
      
      return this.mapTagRowToTag(row);
    } catch (error) {
      logger.error('Lỗi khi tìm kiếm thẻ theo slug:', error);
      throw new ApiError(500, 'Lỗi khi tìm kiếm thẻ');
    } finally {
      client.release();
    }
  }

  /**
   * Tìm tất cả tag với phân trang và lọc
   * @param params Tham số phân trang và lọc
   * @returns Kết quả phân trang của danh sách tag
   */
  public async findAll(params: {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string | undefined;
  }): Promise<PaginatedResult<Tag>> {
    const client = await this.pool.connect();
    
    try {
      // Validate input parameters
      if (params.page < 1) {
        throw new ApiError(400, 'Số trang phải lớn hơn 0');
      }
      
      if (params.limit < 1) {
        throw new ApiError(400, 'Số lượng bản ghi mỗi trang phải lớn hơn 0');
      }
      
      const offset = (params.page - 1) * params.limit;
      const sortOrder = params.sortOrder?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      
      // Validate sortBy to prevent SQL injection
      const validSortFields = ['name', 'created_at', 'updated_at'];
      const safeSortBy = validSortFields.includes(params.sortBy || '') 
        ? params.sortBy 
        : 'created_at';
      
      const orderBy = `ORDER BY ${safeSortBy} ${sortOrder}`;
      
      // Build WHERE clause
      let whereClause = '';
      const queryParams: any[] = [params.limit, offset];
      let paramIndex = 3;
      
      if (params.search) {
        whereClause = `WHERE name ILIKE $${paramIndex}`;
        queryParams.push(`%${params.search}%`);
      }
      
      // Build the main query
      const query = `
        SELECT * FROM tags
        ${whereClause}
        ${orderBy}
        LIMIT $1 OFFSET $2
      `;
      
      // Execute the query
      const result = await client.query<TagRow>(query, queryParams);
      
      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total FROM tags
        ${whereClause}
      `;
      
      // Remove LIMIT and OFFSET from queryParams for count query
      const countParams = params.search ? [queryParams[2]] : [];
      const countResult = await client.query<{ total: string }>(countQuery, countParams);
      
      const total = parseInt(countResult.rows[0]?.total || '0', 10);
      const totalPages = Math.ceil(total / params.limit);
      
      // Map rows to Tag objects
      const items = result.rows.map(row => this.mapTagRowToTag(row));
      
      // Return the result in the correct PaginatedResult format
      return {
        items,
        pagination: {
          total,
          page: params.page,
          limit: params.limit,
          totalPages,
          hasNextPage: params.page < totalPages,
          hasPreviousPage: params.page > 1
        }
      };
    } catch (error) {
      logger.error('Lỗi khi lấy danh sách tag:', error);
      throw new ApiError(500, 'Lỗi khi lấy danh sách tag');
    } finally {
      client.release();
    }
  }

  /**
   * Xóa một tag
   * @param id ID của tag cần xóa
   * @param deletedBy ID của người thực hiện xóa
   * @returns true nếu xóa thành công, false nếu không tìm thấy tag
   * @throws {ApiError} Nếu có lỗi xảy ra
   */
  public async delete(id: string, deletedBy: string | null = null): Promise<boolean> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Thực hiện xóa mềm (soft delete)
      const result = await client.query<{ id: string }>(
        'UPDATE tags SET is_active = false, updated_at = NOW(), updated_by = $1 WHERE id = $2 RETURNING id',
        [deletedBy, id]
      );
      
      await client.query('COMMIT');
      
      // Kiểm tra result có tồn tại không
      if (!result) {
        return false;
      }
      
      // Sử dụng type assertion để đảm bảo TypeScript hiểu rằng rowCount là number
      // và sử dụng nullish coalescing để xử lý trường hợp null/undefined
      const rowCount = (result as { rowCount?: number | null }).rowCount ?? 0;
      return rowCount > 0;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Lỗi khi xóa tag với ID ${id}:`, error);
      throw new ApiError(500, 'Không thể xóa tag');
    } finally {
      client.release();
    }
  }

  /**
   * Lấy danh sách các tag đang thịnh hành
   * @param limit Số lượng tag cần lấy
   */
  public async findTrending(limit: number = 10): Promise<Tag[]> {
    try {
      const result = await this.pool.query(
        `SELECT t.* FROM tags t 
         WHERE t.is_active = true 
         ORDER BY t.trending_score DESC, t.post_count DESC 
         LIMIT $1`,
        [limit]
      );
      
      return result.rows.map(this.mapTagRowToTag);
    } catch (error) {
      logger.error('Lỗi khi lấy danh sách tag thịnh hành:', error);
      throw new ApiError(500, 'Lỗi khi lấy danh sách tag thịnh hành');
    }
  }

  /**
   * Thêm người dùng vào danh sách theo dõi tag
   * @param userId ID của người dùng
   * @param tagId ID của tag
   */
  public async addFollower(userId: string, tagId: string): Promise<void> {
    try {
      await this.pool.query(
        `INSERT INTO user_tag_follows (user_id, tag_id) 
         VALUES ($1, $2) 
         ON CONFLICT (user_id, tag_id) DO NOTHING`,
        [userId, tagId]
      );
    } catch (error) {
      logger.error(`Lỗi khi thêm người dùng ${userId} theo dõi tag ${tagId}:`, error);
      throw new ApiError(500, 'Không thể thêm người dùng vào danh sách theo dõi');
    }
  }

  /**
   * Xóa người dùng khỏi danh sách theo dõi tag
   * @param userId ID của người dùng
   * @param tagId ID của tag
   * @returns true nếu xóa thành công, false nếu không tìm thấy
   */
  public async removeFollower(userId: string, tagId: string): Promise<boolean> {
    try {
      const result = await this.pool.query(
        'DELETE FROM user_tag_follows WHERE user_id = $1 AND tag_id = $2',
        [userId, tagId]
      );
      
      return result.rowCount > 0;
    } catch (error) {
      logger.error(`Lỗi khi xóa người dùng ${userId} khỏi danh sách theo dõi tag ${tagId}:`, error);
      throw new ApiError(500, 'Không thể xóa người dùng khỏi danh sách theo dõi');
    }
  }

  /**
   * Tăng số lượng người theo dõi tag
   * @param tagId ID của tag
   */
  public async incrementFollowerCount(tagId: string): Promise<void> {
    try {
      await this.pool.query(
        `UPDATE tags 
         SET follower_count = follower_count + 1,
             trending_score = trending_score + 10,
             trending_updated_at = NOW()
         WHERE id = $1`,
        [tagId]
      );
    } catch (error) {
      logger.error(`Lỗi khi tăng số lượng người theo dõi tag ${tagId}:`, error);
      throw new ApiError(500, 'Không thể cập nhật số lượng người theo dõi');
    }
  }

  /**
   * Giảm số lượng người theo dõi tag
   * @param tagId ID của tag
   */
  public async decrementFollowerCount(tagId: string): Promise<void> {
    try {
      await this.pool.query(
        `UPDATE tags 
         SET follower_count = GREATEST(0, follower_count - 1),
             trending_score = GREATEST(0, trending_score - 10),
             trending_updated_at = NOW()
         WHERE id = $1`,
        [tagId]
      );
    } catch (error) {
      logger.error(`Lỗi khi giảm số lượng người theo dõi tag ${tagId}:`, error);
      throw new ApiError(500, 'Không thể cập nhật số lượng người theo dõi');
    }
  }

  /**
   * Tìm kiếm tag theo từ khóa
   * @param keyword Từ khóa tìm kiếm
   * @param options Tùy chọn tìm kiếm
   */
  public async search(
    keyword: string,
    options: { limit?: number } = {}
  ): Promise<Tag[]> {
    try {
      const { limit = 10 } = options;
      const searchTerm = `%${keyword}%`;
      
      const result = await this.pool.query(
        `SELECT * FROM tags 
         WHERE is_active = true 
         AND (name ILIKE $1 OR description ILIKE $1)
         ORDER BY post_count DESC, name ASC
         LIMIT $2`,
        [searchTerm, limit]
      );
      
      return result.rows.map(this.mapTagRowToTag);
    } catch (error) {
      logger.error('Lỗi khi tìm kiếm tag:', error);
      throw new ApiError(500, 'Lỗi khi tìm kiếm tag');
    }
  }

  /**
   * Lấy danh sách các tag phổ biến nhất
   * @param limit Số lượng tag cần lấy
   */
  public async findPopular(limit: number = 10): Promise<Tag[]> {
    try {
      const result = await this.pool.query(
        `SELECT t.* FROM tags t 
         WHERE t.is_active = true 
         ORDER BY t.post_count DESC, t.follower_count DESC 
         LIMIT $1`,
        [limit]
      );
      
      return result.rows.map(this.mapTagRowToTag);
    } catch (error) {
      logger.error('Lỗi khi lấy danh sách tag phổ biến:', error);
      throw new ApiError(500, 'Lỗi khi lấy danh sách tag phổ biến');
    }
  }
}

export const tagModel = TagModel.getInstance();
