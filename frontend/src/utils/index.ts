/**
 * Utility functions
 * Tập trung các hàm tiện ích dùng chung trong ứng dụng
 */

import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

/**
 * Format date to Vietnamese locale
 * @param date Date string or Date object
 * @param formatStr Format string (default: 'dd/MM/yyyy HH:mm')
 * @returns Formatted date string
 */
export const formatDate = (
  date: string | Date,
  formatStr: string = 'dd/MM/yyyy HH:mm',
): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr, { locale: vi });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Truncate text with ellipsis
 * @param text Input text
 * @param maxLength Maximum length before truncation
 * @returns Truncated text with ellipsis
 */
export const truncateText = (text: string, maxLength: number = 100): string => {
  if (!text) return '';
  return text.length > maxLength
    ? `${text.substring(0, maxLength)}...`
    : text;
};

/**
 * Generate slug from text
 * @param text Input text
 * @returns URL-friendly slug
 */
export const generateSlug = (text: string): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Get first letter of each word
 * @param text Input text
 * @returns First letter of each word in uppercase
 */
export const getInitials = (text: string): string => {
  if (!text) return '';
  return text
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase();
};

/**
 * Format number with thousands separator
 * @param num Input number
 * @returns Formatted number string
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('vi-VN').format(num);
};

/**
 * Check if value is empty
 * @param value Any value
 * @returns boolean
 */
export const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === 'object' && Object.keys(value).length === 0) return true;
  return false;
};

/**
 * Debounce function
 * @param func Function to debounce
 * @param wait Wait time in milliseconds
 * @returns Debounced function
 */
export const debounce = <F extends (...args: any[]) => any>(
  func: F,
  wait: number = 300,
): ((...args: Parameters<F>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<F>): void => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function
 * @param func Function to throttle
 * @param limit Time limit in milliseconds
 * @returns Throttled function
 */
export const throttle = <F extends (...args: any[]) => any>(
  func: F,
  limit: number = 300,
): ((...args: Parameters<F>) => void) => {
  let inThrottle = false;
  return (...args: Parameters<F>): void => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Get value from nested object using path string
 * @param obj Object to get value from
 * @param path Path string (e.g., 'user.profile.name')
 * @param defaultValue Default value if path not found
 * @returns Value at path or default value
 */
export const get = (
  obj: Record<string, any>,
  path: string,
  defaultValue: any = undefined,
): any => {
  const travel = (regexp: RegExp) =>
    String.prototype.split
      .call(path, regexp)
      .filter(Boolean)
      .reduce(
        (res, key) => (res !== null && res !== undefined ? res[key] : res),
        obj,
      );
  const result = travel(/[,[\]]+?/) || travel(/[,[\].]+?/);
  return result === undefined || result === obj ? defaultValue : result;
};

/**
 * Remove HTML tags from string
 * @param html HTML string
 * @returns Plain text without HTML tags
 */
export const stripHtml = (html: string): string => {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '');
};

/**
 * Generate random string
 * @param length Length of random string
 * @returns Random string
 */
export const randomString = (length: number = 10): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Convert object to query string
 * @param params Object with query parameters
 * @returns Query string
 */
export const toQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => searchParams.append(key, String(item)));
    } else if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  
  return searchParams.toString();
};

/**
 * Parse query string to object
 * @param queryString Query string (with or without '?')
 * @returns Object with query parameters
 */
/**
 * Parses a query string into an object of key-value pairs
 * @param queryString The query string to parse (with or without leading '?')
 * @returns Object containing the query parameters
 */
export const parseQueryString = (queryString: string): Record<string, string> => {
  // Remove leading '?' if present
  const query = queryString.startsWith('?') ? queryString.slice(1) : queryString;
  const params = new URLSearchParams(query);
  const result: Record<string, string> = {};
  
  // Using Array.from to handle URLSearchParams iteration
  Array.from(params.entries()).forEach(([key, value]) => {
    result[key] = value;
  });
  
  return result;
};
