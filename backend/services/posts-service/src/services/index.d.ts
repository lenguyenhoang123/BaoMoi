// This file helps TypeScript understand the types for JavaScript modules

declare module '*.service' {
  import { Post, PostCreateInput, PostUpdateInput } from '../types';

  export interface GetPostsOptions {
    limit: number;
    offset: number;
    category?: string;
    authorId?: string;
    search?: string;
    status?: 'draft' | 'published' | 'archived';
  }

  export interface GetPostsResult {
    posts: Post[];
    total: number;
  }

  export interface SearchPostsOptions {
    query: string;
    limit: number;
    offset: number;
  }

  export interface CategoryPostsOptions {
    categoryId: string;
    limit: number;
    offset: number;
  }

  export interface TagPostsOptions {
    tagId: string;
    limit: number;
    offset: number;
  }

  const PostService: {
    getPosts(options: GetPostsOptions): Promise<GetPostsResult>;
    getFeaturedPosts(limit: number): Promise<Post[]>;
    getLatestPosts(limit: number): Promise<Post[]>;
    getPostById(id: string): Promise<Post | null>;
    getPostsByCategory(options: CategoryPostsOptions): Promise<{ posts: Post[]; total: number }>;
    getPostsByTag(options: TagPostsOptions): Promise<{ posts: Post[]; total: number }>;
    searchPosts(options: SearchPostsOptions): Promise<{ posts: Post[]; total: number }>;
    createPost(data: PostCreateInput, authorId: string): Promise<Post>;
    updatePost(id: string, data: PostUpdateInput, userId: string): Promise<Post>;
    deletePost(id: string, userId: string): Promise<boolean>;
    incrementViewCount(id: string): Promise<void>;
    incrementLikeCount(id: string): Promise<void>;
  };

  export default PostService;
}
