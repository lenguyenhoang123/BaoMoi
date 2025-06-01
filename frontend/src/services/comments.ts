import api from './api';

export const commentsService = {
  /**
   * Lấy danh sách bình luận theo bài viết
   * @param postId ID bài viết
   * @param params Tham số phân trang
   */
  getCommentsByPost: async (postId: string, params: any = {}) => {
    try {
      const response = await api.get(`/posts/${postId}/comments`, { params });
      return response.data;
    } catch (error) {
      console.error(`Lỗi khi lấy bình luận cho bài viết ${postId}:`, error);
      throw error;
    }
  },

  /**
   * Thêm bình luận mới
   * @param postId ID bài viết
   * @param content Nội dung bình luận
   * @param parentId ID bình luận cha (nếu là bình luận trả lời)
   */
  addComment: async (postId: string, content: string, parentId: string | null = null) => {
    try {
      const response = await api.post('/comments', {
        postId,
        content,
        parentId
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi thêm bình luận:', error);
      throw error;
    }
  },

  /**
   * Cập nhật bình luận
   * @param commentId ID bình luận
   * @param content Nội dung mới
   */
  updateComment: async (commentId: string, content: string) => {
    try {
      const response = await api.put(`/comments/${commentId}`, { content });
      return response.data;
    } catch (error) {
      console.error(`Lỗi khi cập nhật bình luận ${commentId}:`, error);
      throw error;
    }
  },

  /**
   * Xóa bình luận
   * @param commentId ID bình luận
   */
  deleteComment: async (commentId: string) => {
    try {
      const response = await api.delete(`/comments/${commentId}`);
      return response.data;
    } catch (error) {
      console.error(`Lỗi khi xóa bình luận ${commentId}:`, error);
      throw error;
    }
  },

  /**
   * Thích/bỏ thích bình luận
   * @param commentId ID bình luận
   */
  toggleLike: async (commentId: string) => {
    try {
      const response = await api.post(`/comments/${commentId}/like`);
      return response.data;
    } catch (error) {
      console.error(`Lỗi khi thích bình luận ${commentId}:`, error);
      throw error;
    }
  }
};

export default commentsService;
