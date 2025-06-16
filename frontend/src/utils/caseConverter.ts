/**
 * Utility functions to convert between snake_case and camelCase
 */

import { Post } from "@/types";

/**
 * Convert a string from snake_case to camelCase
 */
export const toCamel = (s: string): string => {
    return s.replace(/([-_][a-z])/gi, ($1) => {
        return $1.toUpperCase().replace('-', '').replace('_', '');
    });
};

/**
 * Convert a string from camelCase to snake_case
 */
export const toSnake = (s: string): string => {
    return s.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

/**
 * Convert object keys from snake_case to camelCase
 */
export const keysToCamel = <T>(obj: any): T => {
    if (obj === null || typeof obj !== 'object') {
        return obj as T;
    }

    if (Array.isArray(obj)) {
        return obj.map((item) => keysToCamel(item)) as unknown as T;
    }


    const result: Record<string, any> = {};
    Object.keys(obj).forEach((key) => {
        const camelKey = toCamel(key);
        const value = obj[key];

        if (value !== null && typeof value === 'object') {
            result[camelKey] = keysToCamel(value);
        } else {
            result[camelKey] = value;
        }
    });

    return result as T;
};

/**
 * Convert object keys from camelCase to snake_case
 */
export const keysToSnake = <T>(obj: any): T => {
    if (obj === null || typeof obj !== 'object') {
        return obj as T;
    }


    if (Array.isArray(obj)) {
        return obj.map((item) => keysToSnake(item)) as unknown as T;
    }


    const result: Record<string, any> = {};
    Object.keys(obj).forEach((key) => {
        const snakeKey = toSnake(key);
        const value = obj[key];

        if (value !== null && typeof value === 'object') {
            result[snakeKey] = keysToSnake(value);
        } else {
            result[snakeKey] = value;
        }
    });

    return result as T;
};

/**
 * Normalize post data from API to match frontend Post interface
 */
export const normalizePost = (post: any): Post => {
    if (!post) return post;

    // Convert snake_case to camelCase for frontend
    const normalized = keysToCamel<Post>(post);

    // Ensure required fields have default values
    normalized.viewCount = normalized.viewCount || 0;
    normalized.likeCount = normalized.likeCount || 0;
    normalized.commentCount = normalized.commentCount || 0;

    // Handle status mapping
    if ('isPublished' in normalized) {
        normalized.isPublished = normalized.status === 'published';
    }

    // Map image fields
    if ((post as any).image_url) {
        (normalized as any).imageUrl = (post as any).image_url;
        normalized.featuredImage = (post as any).image_url;
    }

    return normalized;
};

/**
 * Prepare post data for API submission (convert back to snake_case)
 */
export const preparePostForApi = (post: Partial<Post>): any => {
    // First convert to snake_case
    const snakeCased = keysToSnake<Partial<Post>>(post);

    // Handle special fields
    const snakeCasted = snakeCased as any;
    if (post.featuredImage) {
        snakeCasted.image_url = post.featuredImage;
        delete snakeCasted.featuredImage; // Remove camelCase version
    } else if ((post as any).imageUrl) {
        snakeCasted.image_url = (post as any).imageUrl;
        delete snakeCasted.imageUrl;
    }

    // Ensure required fields are set
    if (post.status === 'published' && !snakeCasted.published_at) {
        snakeCasted.published_at = new Date().toISOString();
    }

    return snakeCased;
};
