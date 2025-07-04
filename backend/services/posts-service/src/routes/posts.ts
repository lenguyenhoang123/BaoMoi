import express, { Router, Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import Post, { PostType } from '../models/post.model';
import db from '../config/database';

// Khởi tạo router trước khi sử dụng
const router = Router();

// Hàm xử lý lỗi cơ sở dữ liệu
const handleDatabaseError = (error: Error, res: Response) => {
  console.error('❌ Lỗi cơ sở dữ liệu:', error);
  if (error.message.includes('ECONNREFUSED') || error.message.includes('ECONNRESET')) {
    return res.status(503).json({
      success: false,
      message: 'Dịch vụ tạm thời gián đoạn. Vui lòng thử lại sau.',
      error: 'Service Unavailable'
    });
  }
  return res.status(500).json({
    success: false,
    message: 'Lỗi máy chủ nội bộ',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error'
  });
};

// Hàm tạo slug từ tiêu đề
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Xóa ký tự đặc biệt
    .replace(/\s+/g, '-') // Thay dấu cách bằng dấu gạch ngang
    .replace(/--+/g, '-') // Thay nhiều dấu gạch ngang liên tiếp bằng một dấu
    .trim();
};

/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: Quản lý bài viết
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Post:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID của bài viết
 *         title:
 *           type: string
 *           description: Tiêu đề bài viết
 *         slug:
 *           type: string
 *           description: URL thân thiện của bài viết
 *         summary:
 *           type: string
 *           description: Tóm tắt bài viết
 *         content:
 *           type: string
 *           description: Nội dung bài viết
 *         thumbnail:
 *           type: string
 *           description: URL ảnh đại diện
 *         status:
 *           type: string
 *           enum: [draft, published, archived]
 *           default: draft
 *         published_at:
 *           type: string
 *           format: date-time
 *           description: Thời gian xuất bản
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: object
 *           properties:
 *             code:
 *               type: string
 *               example: 'VALIDATION_ERROR'
 *             message:
 *               type: string
 *               example: 'Có lỗi xảy ra khi xác thực dữ liệu'
 *             details:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   field:
 *                     type: string
 *                     example: 'title'
 *                   message:
 *                     type: string
 *                     example: 'Tiêu đề không được để trống'
 */

// Cấu hình body parser để xử lý dữ liệu gửi lên
const jsonParser = bodyParser.json({ limit: '10mb' });
const urlencodedParser = bodyParser.urlencoded({ extended: true, limit: '10mb' });

// Middleware xử lý dữ liệu JSON
router.use(jsonParser);
router.use(urlencodedParser);

// Middleware bắt lỗi khi parse body
router.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err) {
    console.error('❌ Body parser error:', err);
    return res.status(400).json({
      success: false,
      message: 'Lỗi khi phân tích dữ liệu gửi lên',
      error: 'INVALID_REQUEST_BODY'
    });
  }
  next();
});

// Middleware ghi log tất cả các request
router.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`\n=== ${new Date().toISOString()} ===`);
  console.log(`[${req.method}] ${req.originalUrl}`);
  console.log('Base URL:', req.baseUrl);
  console.log('Path:', req.path);
  console.log('Query:', req.query);
  console.log('Headers:', {
    'content-type': req.get('content-type'),
    'authorization': req.get('authorization') ? '***' : undefined,
    'user-agent': req.get('user-agent')
  });
  
  if (Object.keys(req.body).length > 0) {
    console.log('Body:', req.body);
  }
  next();
});

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Lấy danh sách bài viết
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng bài viết mỗi trang
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Từ khóa tìm kiếm
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: string
 *         description: Lọc theo danh mục
 *     responses:
 *       200:
 *         description: Danh sách bài viết
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Post'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(['/', '/posts', '/api', '/api/posts'], async (req: Request, res: Response) => {
  try {
    console.log('\n=== GET /api/posts ===');
    console.log('Request received at:', new Date().toISOString());
    console.log('Query params:', JSON.stringify(req.query, null, 2));

    // Lấy các tham số phân trang và sắp xếp
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const sortBy = (req.query.sortBy as string) || 'created_at';
    const sortOrder = (req.query.sortOrder as string) === 'asc' ? 'ASC' : 'DESC';
    const searchTerm = (req.query.search as string) || '';
    const categoryId = req.query.category_id as string | undefined;
    
    console.log('Processed parameters:', {
      page,
      limit,
      offset,
      sortBy,
      sortOrder,
      searchTerm,
      categoryId,
      hasCategoryFilter: !!categoryId
    });

    // Kiểm tra nếu chỉ cần lấy danh sách tags
    const fields = (req.query.fields as string)?.split(',').map(f => f.trim()) || [];
    const onlyTags = fields.includes('tags') && fields.length === 1;
    
    // Nếu chỉ lấy danh sách tags
    if (onlyTags) {
      try {
        // Lấy tất cả các tags duy nhất từ cột tags
        const result = await db.query(
          `SELECT DISTINCT unnest(tags) as tag 
           FROM posts 
           WHERE tags IS NOT NULL 
           AND array_length(tags, 1) > 0
           ORDER BY tag ASC`
        );
        
        // Lọc và làm sạch dữ liệu tags
        const tags = result.rows
          .map(row => row.tag)
          .filter((tag): tag is string => 
            tag !== null && 
            tag !== undefined && 
            typeof tag === 'string' && 
            tag.trim() !== ''
          );
        
        // Trả về danh sách tags duy nhất
        return res.status(200).json({
          success: true,
          data: [...new Set(tags)], // Đảm bảo không trùng lặp
          message: 'Lấy danh sách tags thành công'
        });
      } catch (error) {
        console.error('Error fetching tags:', error);
        return res.status(500).json({
          success: false,
          message: 'Lỗi khi lấy danh sách tags',
          error: error instanceof Error ? error.message : 'Lỗi không xác định'
        });
      }
    }
    
    // Nếu không phải lấy tags, tiếp tục xử lý lấy danh sách bài viết
    let query = 'SELECT * FROM posts';
    let countQuery = 'SELECT COUNT(*) as count FROM posts';
    const queryParams: any[] = [];
    const whereClauses: string[] = [];
    
    // Thêm điều kiện tìm kiếm nếu người dùng nhập từ khóa
    if (searchTerm) {
      whereClauses.push(`(title ILIKE $${queryParams.length + 1} OR content ILIKE $${queryParams.length + 1})`);
      queryParams.push(`%${searchTerm}%`);
    }

    // Thêm điều kiện lọc theo category_id nếu có
    if (req.query.category_id) {
      const paramIndex = queryParams.length + 1;
      whereClauses.push(`category_id = $${paramIndex}`);
      queryParams.push(req.query.category_id);
      console.log(`Added category filter: category_id = $${paramIndex} (${req.query.category_id})`);
    }

    // Thêm mệnh đề WHERE nếu có điều kiện tìm kiếm
    if (whereClauses.length > 0) {
      const whereClause = ' WHERE ' + whereClauses.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
      console.log('Final WHERE clause:', whereClause);
    } else {
      console.log('No WHERE conditions applied');
    }

    // Thêm điều kiện sắp xếp và phân trang
    query += ` ORDER BY ${sortBy} ${sortOrder} LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);

    console.log('\n=== SQL Query ===');
    console.log('Main Query:', query);
    console.log('Count Query:', countQuery);
    console.log('Query Parameters:', JSON.stringify(queryParams, null, 2));
    console.log('=================\n');
    
    // Thực thi đồng thởi cả 2 truy vấn: lấy dữ liệu và đếm tổng số bản ghi
    console.log('Executing database queries...');
    const startTime = Date.now();
    
    let postsResult, countResult;
    try {
      [postsResult, countResult] = await Promise.all([
        db.query(query, queryParams),
        db.query(countQuery, queryParams.slice(0, -2)) // Bỏ limit và offset cho count
      ]);
      console.log(`Queries executed in ${Date.now() - startTime}ms`);
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }

    const total = parseInt(countResult.rows[0]?.count || '0');
    const totalPages = Math.ceil(total / limit);

    console.log('Query results:', {
      postsCount: postsResult.rows.length,
      totalItems: total,
      totalPages,
      hasResults: postsResult.rows.length > 0
    });

    if (postsResult.rows.length > 0) {
      console.log('First post sample:', {
        id: postsResult.rows[0].id,
        title: postsResult.rows[0].title,
        category_id: postsResult.rows[0].category_id,
        is_published: postsResult.rows[0].is_published
      });
    }

    // Xử lý dữ liệu bài viết
    const posts = postsResult.rows.map(post => {
      const processedPost = {
        ...post,
        tags: Array.isArray(post.tags) ? post.tags : []
      };
      return processedPost;
    });
    
    // Tạo kết quả trả về
    const resultData = {
      success: true,
      data: {
        items: posts,
        pagination: {
          total,
          totalPages,
          currentPage: page,
          limit,
          hasMore: page < totalPages
        }
      },
      message: 'Lấy danh sách bài viết thành công'
    };

    console.log('Sending response with', posts.length, 'posts');
    return res.status(200).json(resultData);
  } catch (error) {
    console.error('❌ Error getting posts:', error);
    handleDatabaseError(error as Error, res);
  }
});

/**
 * @swagger
 * /api/posts/{id}:
 *   put:
 *     summary: Cập nhật bài viết
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bài viết
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Post'
 *     responses:
 *       200:
 *         description: Bài viết đã được cập nhật
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Post'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy bài viết
 *       500:
 *         description: Lỗi server
 */
router.put(['/api/posts/:id', '/posts/:id', '/:id'], async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log('\n=== UPDATE POST REQUEST ===');
    console.log(`Path: ${req.path}`);
    console.log(`Method: ${req.method}`);
    console.log(`Post ID: ${id}`);
    console.log('Update data:', updateData);

    // Xác thực dữ liệu đầu vào
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu ID bài viết',
        error: 'MISSING_POST_ID'
      });
    }

    // Kiểm tra sự tồn tại của bài viết
    const checkResult = await db.query('SELECT * FROM posts WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết',
        error: 'POST_NOT_FOUND'
      });
    }

    // Tạo câu truy vấn cập nhật
    const updatedAt = new Date().toISOString();
    const query = `
      UPDATE posts 
      SET 
        title = $1,
        slug = $2,
        content = $3,
        status = $4,
        image_url = $5,
        tags = $6,
        updated_at = $7
      WHERE id = $8
      RETURNING *
    `;

    const values = [
      updateData.title,
      updateData.slug,
      updateData.content,
      updateData.status || 'draft',
      updateData.image_url || null,
      updateData.tags || [],
      updatedAt,
      id
    ];

    console.log('Executing update query:', query);
    console.log('With values:', values);

    // Thực thi câu truy vấn cập nhật
    const result = await db.query(query, values);
    const updatedPost = result.rows[0];

    res.status(200).json({
      success: true,
      data: updatedPost,
      message: 'Cập nhật bài viết thành công'
    });

  } catch (error) {
    console.error('❌ Error updating post:', error);
    handleDatabaseError(error as Error, res);
  }
});

// Lấy thông tin chi tiết bài viết theo ID
router.get(['/api/posts/:id', '/posts/:id', '/:id'], async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log('\n=== GET POST BY ID REQUEST ===');
    console.log(`Path: ${req.path}`);
    console.log(`Method: ${req.method}`);
    console.log(`Params:`, req.params);
    console.log(`Query:`, req.query);
    console.log(`Headers:`, {
      'content-type': req.get('content-type'),
      'authorization': req.get('authorization') ? '***' : undefined,
      'accept': req.get('accept')
    });

    // Xác thực ID bài viết
    if (!id) {
      console.log('❌ Missing post ID');
      return res.status(400).json({
        success: false,
        message: 'Thiếu ID bài viết',
        error: 'MISSING_POST_ID'
      });
    }

    // Kiểm tra xem ID có phải là UUID hợp lệ không
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(id)) {
      console.log(`❌ Invalid UUID format: ${id}`);
      return res.status(400).json({
        success: false,
        message: 'ID bài viết không hợp lệ',
        error: 'INVALID_POST_ID',
        details: 'ID phải có định dạng UUID v4'
      });
    }

    // Thực hiện truy vấn cơ sở dữ liệu
    console.log(`\n🔍 Truy vấn bài viết với ID: ${id}`);
    const query = 'SELECT * FROM posts WHERE id = $1';
    console.log('Query:', query);
    console.log('Params:', [id]);
    
    const result = await db.query(query, [id]);
    console.log(`Kết quả truy vấn: ${result.rows.length} bài viết tìm thấy`);

    // Kiểm tra sự tồn tại của bài viết
    if (result.rows.length === 0) {
      console.log(`❌ Post not found with ID: ${id}`);
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết',
        error: 'POST_NOT_FOUND'
      });
    }

    const post = result.rows[0];
    
    // Đảm bảo tags luôn là mảng
    if (!Array.isArray(post.tags)) {
      post.tags = [];
    }

    console.log(`✅ Found post with ID: ${id}`);
    res.status(200).json({
      success: true,
      data: post,
      message: 'Lấy thông tin bài viết thành công'
    });
  } catch (error) {
    console.error('❌ Error getting post by ID:', error);
    handleDatabaseError(error as Error, res);
  }
});

// Create a new post
/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Tạo bài viết mới
 *     tags: [Posts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Post'
 *     responses:
 *       201:
 *         description: Bài viết đã được tạo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Post'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       500:
 *         description: Lỗi server
 */
router.post(['/', '/posts', '/api', '/api/posts'], async (req: Request, res: Response) => {
  console.log('\n=== POST REQUEST RECEIVED ===');
  console.log('Time:', new Date().toISOString());
  console.log('Method:', req.method);
  console.log('URL:', req.originalUrl);
  console.log('Path:', req.path);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Query:', req.query);
  console.log('Params:', req.params);
  console.log('Raw body:', (req as any).rawBody || 'No raw body');
  console.log('Parsed body:', req.body || 'No parsed body');
  console.log('Content-Type:', req.get('content-type'));
  console.log('Content-Length:', req.get('content-length'));
  
  // Kiểm tra middleware body-parser
  console.log('Body parser working:', !!req.body);
  console.log('Raw body exists:', !!(req as any).rawBody);
  
  // Nếu không có body hoặc body không hợp lệ
  if (!req.body || Object.keys(req.body).length === 0) {
    console.error('❌ Lỗi: Request body không hợp lệ hoặc trống');
    return res.status(400).json({
      success: false,
      message: 'Yêu cầu không hợp lệ: Thiếu dữ liệu',
      error: 'INVALID_REQUEST_BODY'
    });
  }
  
  try {
    const { title, content, tags, status, image_url } = req.body;

    // Basic validation
    if (!title || !content) {
      console.log('❌ Validation failed - Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Tiêu đề và nội dung là bắt buộc',
        error: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Check if a post with the same title already exists
    console.log('🔍 Checking for duplicate post with title:', title);
    const existingPost = await db.query<PostType>(
      'SELECT id FROM posts WHERE title = $1', 
      [title]
    );

    if (existingPost.rows.length > 0) {
      console.log('❌ Post with this title already exists');
      return res.status(409).json({
        success: false,
        message: 'Bài viết với tiêu đề này đã tồn tại',
        error: 'DUPLICATE_TITLE'
      });
    }

    // Generate slug from title
    const slug = generateSlug(title);
    console.log('✨ Generated slug:', slug);

    // Create new post
    console.log('💾 Creating new post...');
    const newPost = await Post.create({
      title,
      slug,
      content,
      status: status || 'draft',
      image_url: image_url || null,
      tags: Array.isArray(tags) ? tags : []
    });

    console.log('✅ Post created successfully:', newPost.id);
    return res.status(201).json({
      success: true,
      message: 'Tạo bài viết thành công',
      data: newPost
    });
  } catch (error: any) {
    console.error('❌ Error creating post:', error);
    
    // Xử lý lỗi kết nối cơ sở dữ liệu
    if (error.message.includes('ECONNREFUSED') || error.message.includes('ECONNRESET')) {
      return res.status(503).json({
        success: false,
        message: 'Dịch vụ tạm thời gián đoạn. Vui lòng thử lại sau.',
        error: 'SERVICE_UNAVAILABLE'
      });
    }
    
    // Xử lý lỗi validation
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        error: 'VALIDATION_ERROR',
        details: error.errors?.map((e: any) => ({
          field: e.path,
          message: e.message
        })) || []
      });
    }
    
    // Lỗi khác
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ nội bộ',
      error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_SERVER_ERROR'
    });
  }
});

// Health check endpoint
router.get(['/health', '/test', '/posts/test', '/api/posts/test'], async (req: Request, res: Response) => {
  try {
    // Kiểm tra kết nối cơ sở dữ liệu
    await db.query('SELECT NOW()');
    
    res.status(200).json({ 
      success: true,
      status: 'healthy',
      service: 'posts-service',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    });
  } catch (error: any) {
    console.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      service: 'posts-service',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// GET /posts hoặc /api/posts - Lấy danh sách bài viết
router.get(['/', '/posts', '/api', '/api/posts'], async (req: Request, res: Response) => {
  try {
    console.log('GET /api/posts - Request received');
    console.log('Query params:', req.query);

    // Xử lý tham số truy vấn
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = parseInt(req.query.page_size as string) || parseInt(req.query.limit as string) || 10;
    const limit = Math.min(100, Math.max(1, pageSize)); // Giới hạn tối đa 100 bản ghi/trang
    const offset = (page - 1) * limit;
    
    // Kiểm tra nếu có yêu cầu lọc theo trạng thái
    const status = req.query.is_published === 'true' ? 'published' : undefined;
    
    // Lấy danh sách bài viết từ database với thông tin phân trang
    const { posts, total, page: currentPage, totalPages } = await Post.findAll({ 
      limit, 
      offset,
      status
    });

    // Trả về kết quả với cấu trúc phù hợp cho frontend
    res.status(200).json({
      success: true,
      data: posts,
      pagination: {
        total,
        page: currentPage,
        pageSize: limit,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách bài viết',
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
});

// PATCH /posts/:id hoặc /api/posts/:id - Cập nhật bài viết
router.patch(['/:id', '/posts/:id', '/api/posts/:id'], async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`PATCH /api/posts/${id} - Request received`);
    console.log('Update data:', updateData);

    // Kiểm tra xem bài viết có tồn tại không
    const existingPost = await Post.findById(id);
    if (!existingPost) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết'
      });
    }

    // Cập nhật bài viết
    const updatedPost = await Post.update(id, updateData);
    
    if (!updatedPost) {
      return res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi cập nhật bài viết'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật bài viết thành công',
      data: updatedPost
    });
  } catch (error) {
    console.error('Error updating post:', error);
    
    // Xử lý lỗi kết nối cơ sở dữ liệu
    if (error instanceof Error && 
        (error.message.includes('ECONNREFUSED') || error.message.includes('ECONNRESET'))) {
      return res.status(503).json({
        success: false,
        message: 'Dịch vụ tạm thời gián đoạn. Vui lòng thử lại sau.'
      });
    }

    // Xử lý lỗi validation
    if (error instanceof Error && 
        (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError')) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: (error as any).errors?.map((e: any) => ({
          field: e.path,
          message: e.message
        }))
      });
    }

    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật bài viết',
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
});

// DELETE /posts/:id hoặc /api/posts/:id - Xóa bài viết
/**
 * @swagger
 * /api/posts/{id}:
 *   delete:
 *     summary: Xóa bài viết
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bài viết
 *     responses:
 *       200:
 *         description: Đã xóa bài viết thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Không tìm thấy bài viết
 *       500:
 *         description: Lỗi server
 */
router.delete(['/:id', '/posts/:id', '/api/posts/:id'], async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log(`DELETE /api/posts/${id} - Request received`);

    // Kiểm tra xem bài viết có tồn tại không
    const existingPost = await Post.findById(id);
    if (!existingPost) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết'
      });
    }

    // Xóa bài viết
    const isDeleted = await Post.delete(id);
    
    if (!isDeleted) {
      return res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi xóa bài viết'
      });
    }


    res.status(200).json({
      success: true,
      message: 'Xóa bài viết thành công'
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    
    // Xử lý lỗi kết nối cơ sở dữ liệu
    if (error instanceof Error && 
        (error.message.includes('ECONNREFUSED') || error.message.includes('ECONNRESET'))) {
      return res.status(503).json({
        success: false,
        message: 'Dịch vụ tạm thời gián đoạn. Vui lòng thử lại sau.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa bài viết',
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
});

export default router;
