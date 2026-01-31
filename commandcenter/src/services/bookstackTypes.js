// Type definitions for BookStack API

/**
 * @typedef {Object} BookStackConfig
 * @property {string} baseURL
 * @property {string} tokenId
 * @property {string} tokenSecret
 */

/**
 * @typedef {Object} Book
 * @property {number} id
 * @property {string} name
 * @property {string} slug
 * @property {string} description
 * @property {string} created_at
 * @property {string} updated_at
 * @property {{id: number, name: string, slug: string}} created_by
 * @property {{id: number, name: string, slug: string}} updated_by
 * @property {Array<{id: number, type: string, name: string, slug: string, book_id: number, chapter_id?: number, pages?: Array<{id: number, name: string, slug: string}>}>} contents
 * @property {Array<{name: string, value: string, order: number}>} tags
 */

/**
 * @typedef {Object} Chapter
 * @property {number} id
 * @property {number} book_id
 * @property {string} name
 * @property {string} slug
 * @property {string} description
 * @property {number} priority
 * @property {string} created_at
 * @property {string} updated_at
 * @property {{id: number, name: string, slug: string}} created_by
 * @property {{id: number, name: string, slug: string}} updated_by
 * @property {Array<{id: number, name: string, slug: string}>} pages
 * @property {Array<{name: string, value: string, order: number}>} tags
 */

/**
 * @typedef {Object} Page
 * @property {number} id
 * @property {number} book_id
 * @property {number} [chapter_id]
 * @property {string} name
 * @property {string} slug
 * @property {string} html
 * @property {string} markdown
 * @property {number} priority
 * @property {boolean} draft
 * @property {boolean} template
 * @property {string} created_at
 * @property {string} updated_at
 * @property {{id: number, name: string, slug: string}} created_by
 * @property {{id: number, name: string, slug: string}} updated_by
 * @property {Array<{name: string, value: string, order: number}>} tags
 */

export {};
