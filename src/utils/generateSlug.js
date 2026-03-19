'use strict';

/**
 * Convert a title string to a URL-friendly slug.
 * Appends a short random suffix to ensure uniqueness.
 *
 * @param {string} title
 * @returns {string} slug
 */
function generateSlug(title) {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')   // remove special chars
    .replace(/\s+/g, '-')            // spaces to hyphens
    .replace(/-+/g, '-')             // collapse multiple hyphens
    .replace(/^-|-$/g, '');          // trim leading/trailing hyphens

  const suffix = Math.random().toString(36).substring(2, 7); // 5-char random
  return `${base}-${suffix}`;
}

module.exports = generateSlug;
