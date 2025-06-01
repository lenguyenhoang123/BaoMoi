/**
 * Generate a URL-friendly slug from a string
 * @param str Input string to convert to slug
 * @returns URL-friendly slug
 */
export const generateSlug = (str: string): string => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with a single dash
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes
};

/**
 * Generate a unique slug by appending a number if the slug already exists
 * @param str Input string to convert to slug
 * @param existingSlugs Array of existing slugs to check against
 * @returns Unique slug
 */
export const generateUniqueSlug = async (
  str: string,
  existingSlugs: string[]
): Promise<string> => {
  let slug = generateSlug(str);
  let uniqueSlug = slug;
  let counter = 1;

  while (existingSlugs.includes(uniqueSlug)) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  return uniqueSlug;
};
