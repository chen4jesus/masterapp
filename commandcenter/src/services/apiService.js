const API_BASE = '/api';
const LOCAL_API_BASE = '/api/local';

// Cache for site configs to avoid repeated fetches
let siteConfigCache = null;

// Fetch sites from local API
const fetchSiteConfigs = async () => {
  if (siteConfigCache) return siteConfigCache;
  try {
    const response = await fetch(`${LOCAL_API_BASE}/sites`);
    if (!response.ok) throw new Error('Failed to load sites config');
    siteConfigCache = await response.json();
    return siteConfigCache;
  } catch (error) {
    console.error("Failed to load site configs:", error);
    return [];
  }
};

// Clear cache (call when sites are updated)
export const clearSiteCache = () => {
  siteConfigCache = null;
};

// Get headers for a specific site by slug
const getAuthHeaders = async (siteSlug) => {
  const sites = await fetchSiteConfigs();
  console.log(`[Debug] getAuthHeaders for slug: ${siteSlug}`);
  const site = sites.find(s => s.slug === siteSlug);
  
  if (!site || !site.api_token) {
    console.warn(`[Debug] No API token found for site: ${siteSlug}. Site found: ${!!site}`);
    return { 'Content-Type': 'application/json' };
  }
  
  // Clean up token to ensure consistent format
  let token = site.api_token.trim();
  if (token.startsWith('Token ')) {
    token = token.substring(6).trim();
  }
  const authValue = `Token ${token}`;
  
  console.log(`[Debug] Generated Authorization header length: ${authValue.length}`);
  
  return {
    'Authorization': authValue,
    'Content-Type': 'application/json'
  };
};

// Get managed sites from local API
export const getManagedSites = async () => {
  try {
    const response = await fetch(`${LOCAL_API_BASE}/sites`);
    if (!response.ok) throw new Error('Failed to load sites config');
    const sites = await response.json();
    siteConfigCache = sites; // Update cache
    return sites;
  } catch (error) {
    console.error("Failed to load managed sites:", error);
    return [];
  }
};

// Save a new site to local API
export const saveSite = async (siteConfig) => {
  try {
    const response = await fetch(`${LOCAL_API_BASE}/sites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(siteConfig)
    });
    if (!response.ok) throw new Error('Failed to save site config');
    clearSiteCache(); // Clear cache after save
    return await response.json();
  } catch (error) {
    console.error("Failed to save site:", error);
    throw error;
  }
};

// Update an existing site
export const updateSite = async (id, siteConfig) => {
  try {
    const response = await fetch(`${LOCAL_API_BASE}/sites/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(siteConfig)
    });
    if (!response.ok) throw new Error('Failed to update site config');
    clearSiteCache(); // Clear cache after update
    return await response.json();
  } catch (error) {
    console.error("Failed to update site:", error);
    throw error;
  }
};
// Delete a site
export const deleteSite = async (id) => {
  try {
    const response = await fetch(`${LOCAL_API_BASE}/sites/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete site');
    clearSiteCache(); // Clear cache after delete
    return await response.json();
  } catch (error) {
    console.error("Failed to delete site:", error);
    throw error;
  }
};

// Get site by slug
export const getSiteBySlug = async (slug) => {
  const sites = await getManagedSites();
  return sites.find(s => s.slug === slug);
};

// Get books for a site (uses local proxy)
export const getBooks = async (siteSlug) => {
  try {
    const response = await fetch(`${LOCAL_API_BASE}/proxy/bookstack/${siteSlug}/books`);
    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `API Error: ${response.status}`);
    }
    const json = await response.json();
    return json.data; 
  } catch (error) {
    console.error("Failed to fetch books:", error);
    return [];
  }
};

// Get book by slug
export const getBookBySlug = async (slug, siteSlug) => {
  const books = await getBooks(siteSlug);
  return books.find(b => b.slug === slug);
};

// Get full book details including contents
export const getBookDetails = async (id, siteSlug) => {
  try {
    const response = await fetch(`${LOCAL_API_BASE}/proxy/bookstack/${siteSlug}/books/${id}`);
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch book details ${id}:`, error);
    return null;
  }
};

// Get single page
export const getPage = async (id, siteSlug) => {
  try {
    const response = await fetch(`${LOCAL_API_BASE}/proxy/bookstack/${siteSlug}/pages/${id}`);
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch page ${id}:`, error);
    return null;
  }
};

// Get pages with pagination to fetch all pages
export const getPages = async (params = {}, siteSlug) => {
  try {
    const headers = await getAuthHeaders(siteSlug);
    let allPages = [];
    let offset = 0;
    const count = 100;
    
    // Paginate through all pages
    while (true) {
      const url = `${LOCAL_API_BASE}/proxy/bookstack/${siteSlug}/pages?offset=${offset}&count=${count}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      const json = await response.json();
      
      allPages = allPages.concat(json.data);
      
      // If we got fewer than requested, we've reached the end
      if (json.data.length < count) break;
      offset += count;
      
      // Safety limit to prevent infinite loops
      if (offset > 1000) break;
    }
    
    // Filter by book_id if provided
    if (params.book_id) {
      allPages = allPages.filter(p => p.book_id === parseInt(params.book_id));
    }
    
    return allPages;
  } catch (error) {
    console.error("Failed to fetch pages:", error);
    return [];
  }
};
// Helper to convert HTML content to clean Markdown-like text for the blog
const unescapeHTML = (html) => {
  if (!html) return '';
  
  // 1. First, handle any literal unicode escapes (like \u003c) just in case
  let processed = html.replace(/\\u([0-9a-fA-F]{4})/g, (match, grp) => {
    return String.fromCharCode(parseInt(grp, 16));
  });

  // 2. Create a temporary DOM element to parse the HTML structure
  const temp = document.createElement('div');
  temp.innerHTML = processed;

  // 3. Helper to recursively process nodes into text/markdown symbols
  const processNode = (node) => {
    let text = '';
    node.childNodes.forEach(child => {
      if (child.nodeType === 3) { // Text Node
        text += child.textContent;
      } else if (child.nodeType === 1) { // Element Node
        const tag = child.tagName.toLowerCase();
        const childContent = processNode(child).trim();
        
        if (!childContent && tag !== 'br') return;

        switch (tag) {
          case 'h1': text += `\n# ${childContent}\n\n`; break;
          case 'h2': text += `\n## ${childContent}\n\n`; break;
          case 'h3': text += `\n### ${childContent}\n\n`; break;
          case 'p':  text += `\n${childContent}\n`; break;
          case 'li': text += `\n• ${childContent}`; break;
          case 'ul': case 'ol': text += `\n${childContent}\n`; break;
          case 'a':  text += childContent; break; // Link text only as per example
          case 'br': text += '\n'; break;
          case 'strong': case 'b': text += `**${childContent}**`; break;
          case 'em': case 'i': text += `*${childContent}*`; break;
          default:   text += childContent;
        }
      }
    });
    return text;
  };

  // 4. Extract and clean up the result
  return processNode(temp)
    .replace(/\n{3,}/g, '\n\n') // Collapse excessive newlines
    .trim();
};

// --- New Book Config Methods ---

export const getBookConfig = async (bookId) => {
  try {
    const response = await fetch(`${LOCAL_API_BASE}/books/${bookId}/config`);
    if (!response.ok) throw new Error('Failed to load book config');
    return await response.json();
  } catch (error) {
    console.error("Failed to load book config:", error);
    return {};
  }
};

export const saveBookConfig = async (bookId, config) => {
  try {
    const response = await fetch(`${LOCAL_API_BASE}/books/${bookId}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    if (!response.ok) throw new Error('Failed to save book config');
    return await response.json();
  } catch (error) {
    console.error("Failed to save book config:", error);
    throw error;
  }
};

// Push page content to external blog API (via local proxy to avoid CORS)
export const pushPageToBlog = async (pageData, siteSlug, bookData = null) => {
  try {
    const proxyUrl = `${LOCAL_API_BASE}/proxy/blog/${siteSlug}`;
    
    // Unescape the HTML content
    const cleanContent = pageData.markdown || unescapeHTML(pageData.html);

    let body = {
      book: bookData?.slug || "",
      title: pageData.name,
      meta_title: "",
      description: pageData.name,
      date: pageData.created_at || new Date().toISOString(),
      image: bookData?.cover?.url || "/images/image-placeholder.png",
      categories: ["Software"],
      author: "BookStack Command Center",
      tags: ["bookstack", "automation"],
      draft: false,
      content: cleanContent
    };

    // Merge book-level config if available
    if (bookData && bookData.id) {
        try {
            const bookConfig = await getBookConfig(bookData.id);
            if (Object.keys(bookConfig).length > 0) {
                // Merge config, carefully handling defaults
                // Config values override defaults
                body = { ...body, ...bookConfig };
                
                // Keep critical fields (unless explicitly allowed to override?)
                // Allow overriding everything except content probably.
                body.content = cleanContent;
                // If the user wants to override title via config, they can, but usually title comes from page.
                // Let's assume title is dynamic.
                body.title = pageData.name;
            }
        } catch (e) {
            console.warn('Failed to apply book config', e);
        }
    }

    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      let errorMessage = `Blog API Error: ${response.status}`;
      try {
        const errorJson = await response.json();
        errorMessage += ` - ${errorJson.error || errorJson.details || 'Unknown error'}`;
      } catch (e) {
        // Not JSON
        const text = await response.text();
        errorMessage += ` - ${text.substring(0, 100)}...`;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to push page to blog:", error);
    throw error;
  }
};
