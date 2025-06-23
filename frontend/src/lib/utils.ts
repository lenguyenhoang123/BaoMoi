import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date string to a more readable format
 * @param dateString - The date string to format
 * @param formatStr - The format string (default: 'dd/MM/yyyy HH:mm')
 * @returns Formatted date string
 */
export function formatDateString(
  dateString: string | Date,
  formatStr: string = 'dd/MM/yyyy HH:mm'
): string {
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
}

/**
 * Truncate a string to a specified length
 * @param str - The string to truncate
 * @param length - The maximum length of the string
 * @param ellipsis - Whether to add an ellipsis at the end (default: true)
 * @returns The truncated string
 */
export function truncateString(str: string, length: number, ellipsis: boolean = true): string {
  if (!str || str.length <= length) return str;
  return ellipsis ? `${str.substring(0, length)}...` : str.substring(0, length);
}

/**
 * Generate a slug from a string
 * @param str - The string to convert to a slug
 * @returns The generated slug
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove all non-word chars
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with a single dash
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes
}

/**
 * Debounce a function
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns A debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
 * Throttle a function
 * @param func - The function to throttle
 * @param limit - The time limit in milliseconds
 * @returns A throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Get the value at path of object
 * @param obj - The object to query
 * @param path - The path of the property to get
 * @param defaultValue - The value returned for undefined resolved values
 * @returns The resolved value
 */
export function get(
  obj: Record<string, any>,
  path: string | string[],
  defaultValue: any = undefined
): any {
  const travel = (regexp: RegExp) =>
    String.prototype.split
      .call(path, regexp)
      .filter(Boolean)
      .reduce((res, key) => (res !== null && res !== undefined ? res[key] : res), obj);
  
  const result = travel(/[,[\]]+?/) || travel(/[,.]+?/);
  return result === undefined || result === obj ? defaultValue : result;
}

/**
 * Check if value is empty
 * @param value - The value to check
 * @returns True if the value is empty, false otherwise
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' || Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Generate a unique ID
 * @param length - The length of the ID (default: 8)
 * @returns A unique ID string
 */
export function generateId(length: number = 8): string {
  return Math.random().toString(36).substring(2, 2 + length);
}
