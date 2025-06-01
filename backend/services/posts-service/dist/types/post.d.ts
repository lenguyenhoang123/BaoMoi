export type PostStatus = 'draft' | 'published' | 'archived';
export interface Post {
    id: string;
    title: string;
    slug: string;
    summary: string;
    content: string;
    thumbnail?: string;
    status: PostStatus;
    view_count: number;
    like_count: number;
    comment_count: number;
    user_id: string;
    category_id: string;
    created_at: Date;
    updated_at: Date;
    published_at?: Date;
}
export interface PostWithDetails extends Post {
    author_username: string;
    author_avatar?: string;
    category_name: string;
    category_slug: string;
    tags: Array<{
        id: string;
        name: string;
        slug: string;
    }>;
}
export interface CreatePostDto {
    title: string;
    slug?: string;
    summary: string;
    content: string;
    thumbnail?: string;
    status?: PostStatus;
    category_id: string;
    tags?: string[];
}
export interface UpdatePostDto extends Partial<CreatePostDto> {
    id: string;
}
export interface GetPostsQuery {
    page?: number;
    limit?: number;
    status?: PostStatus;
    category_id?: string;
    tag?: string;
    search?: string;
    sort?: 'newest' | 'oldest' | 'most_viewed' | 'most_liked';
}
export interface PostFilterOptions {
    status?: PostStatus;
    category_id?: string;
    tag_id?: string;
    user_id?: string;
    search?: string;
    sort?: string;
    page: number;
    limit: number;
}
//# sourceMappingURL=post.d.ts.map