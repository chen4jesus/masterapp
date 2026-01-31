const express = require("express");
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors()); // Enable All CORS Requests
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || "development-api-key";
const BLOG_DIR = path.join(__dirname, "../content/chinese/blog");
const ASSETS_IMAGES_DIR = path.join(__dirname, "../assets/images");

app.use(express.json());

// Helper to download image
async function downloadImage(url, slug) {
  try {
    const extension = path.extname(new URL(url).pathname) || ".jpg";
    const filename = `${slug}${extension}`;
    const destPath = path.join(ASSETS_IMAGES_DIR, filename);

    if (!fs.existsSync(ASSETS_IMAGES_DIR)) {
      fs.mkdirSync(ASSETS_IMAGES_DIR, { recursive: true });
    }

    const response = await axios({
      url,
      method: "GET",
      responseType: "stream",
    });

    const writer = fs.createWriteStream(destPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", () => resolve(`images/${filename}`));
      writer.on("error", reject);
    });
  } catch (error) {
    console.error("Download failed:", url, error.message);
    return null;
  }
}

// Helper to strip HTML tags and unescape entities
function stripHtmlTags(str) {
  if (!str) return "";
  const unescaped = str
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&");
  // Only strip tags that start with a letter, /, or ! (to preserve < bilingual >, <3, etc.)
  return unescaped.replace(/<(?:\/?[a-zA-Z!][^>]*)>/g, "");
}

// Middleware for API Key authentication
// Middleware for API Key authentication or Basic Auth
const authenticate = (req, res, next) => {
  // 1. Check Legacy API Key (config variable)
  const apiKey = req.headers['x-api-key'];
  if (apiKey && apiKey === API_KEY) {
    return next();
  }

  // 2. Check Basic Auth (username/password from config file)
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const auth = new Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
    const user = auth[0];
    const pass = auth[1];

    try {
      const configPath = path.resolve(__dirname, '../config/admin_credentials.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (user === config.username && pass === config.password) {
          return next();
        }
      } else {
         console.warn("Admin Config file missing at " + configPath);
      }
    } catch (err) {
      console.error("Error reading admin config:", err);
    }
  }

  // If we got here, authentication failed
  res.status(401).json({ error: 'Unauthorized: Invalid credentials or API Key' });
};

app.post("/api/v1/blog", authenticate, async (req, res) => {
  const {
    title,
    content,
    author = "API User",
    categories = ["Uncategorized"],
    tags = [],
    image = "/images/image-placeholder.png",
    description = "",
    meta_title = "",
    draft = false,
    book = "",
  } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required" });
  }

  // Create a slug that supports Chinese characters
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s\u4e00-\u9fa5-]/g, "") // Remove illegal characters but keep CJK
    .replace(/[\s_]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/-+/g, "-"); // Collapse multiple hyphens

  let targetDir = BLOG_DIR;
  let urlPath = `/blog/${slug}/`;

  if (book) {
    // Sanitize book name to prevent directory traversal
    const safeBookName = book.trim().replace(/(\.\.(\/|\\|$))+/g, "");
    targetDir = path.join(BLOG_DIR, safeBookName);
    // Assuming default Hugo behavior where subdirectory becomes part of the URL
    // We normalize the book name for the URL path as Hugo likely does (e.g. spaces to %20 or dashes depending on config)
    // For simplicity in this API response, we just append it.
    urlPath = `/blog/${safeBookName}/${slug}/`;
  }

  const filename = `${slug}.md`;
  const filePath = path.join(targetDir, filename);

  if (fs.existsSync(filePath)) {
    return res
      .status(409)
      .json({
        error:
          "A post with this title already exists in the specified location",
      });
  }

  // Handle remote image download
  let finalImagePath = image;
  if (image && image.startsWith("http")) {
    const downloadedPath = await downloadImage(image, slug);
    if (downloadedPath) {
      finalImagePath = downloadedPath;
    }
  }

  // Sanitize content and description to remove HTML tags
  const sanitizedContent = stripHtmlTags(content);
  const sanitizedDescription = stripHtmlTags(description);

  const frontMatter = {
    title,
    meta_title,
    description: sanitizedDescription,
    date: new Date().toISOString(),
    image: finalImagePath,
    categories,
    author,
    tags: Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : []),
    draft,
  };

  const fileContent = `---\n${yaml.dump(frontMatter)}---\n\n${sanitizedContent}`;

  try {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    fs.writeFileSync(filePath, fileContent);
    res.status(201).json({
      message: "Post created successfully",
      slug,
      path: urlPath,
      image: finalImagePath,
    });
  } catch (error) {
    console.error("Error writing file:", error);
    res.status(500).json({ error: "Failed to save the blog post" });
  }
});

app.post("/api/v1/keywords", authenticate, async (req, res) => {
  const { filePath, keyword } = req.body;

  if (!filePath || !keyword) {
    return res.status(400).json({ error: "FilePath and keyword are required" });
  }

  // Resolve file path relative to project root
  // __dirname is scripts/, so ../ is project root
  const projectRoot = path.resolve(__dirname, '..');
  const contentDir = path.resolve(projectRoot, 'content');

  // Logging for debugging
  console.log(`[Keywords API] Request to add keyword "${keyword}" to file "${filePath}"`);

  // Sanitize filePath to remove leading slashes/backslashes to ensure it's treated as relative
  // This prevents path.resolve from treating it as absolute path on the drive
  const safeFilePath = filePath.replace(/^[/\\]+/, '');

  console.log(`[Keywords API] Safe file path: ${safeFilePath}`);

  // Try to resolve the full path.
  // First, assume it might be relative to project root
  let fullPath = path.resolve(projectRoot, safeFilePath);

  // If that path doesn't start with contentDir or doesn't exist, check other locations
  if (!fullPath.startsWith(contentDir) || !fs.existsSync(fullPath)) {
    // Try directly in content dir
    const contentPath = path.resolve(contentDir, safeFilePath);

    // Try in content/chinese dir (hardcoded for this repo structure)
    const chineseContentPath = path.resolve(contentDir, 'chinese', safeFilePath);

    if (fs.existsSync(contentPath)) {
      fullPath = contentPath;
    } else if (fs.existsSync(chineseContentPath)) {
      fullPath = chineseContentPath;
    }
  }

  console.log(`[Keywords API] Resolved path: ${fullPath}`);
  console.log(`[Keywords API] Content dir: ${contentDir}`);

  // Security check: ensure path is within content directory
  if (!fullPath.startsWith(contentDir)) {
    console.error('[Keywords API] Security check failed: Path outside content directory');
    return res.status(403).json({ error: 'Invalid file path: Must be within content directory' });
  }

  if (!fs.existsSync(fullPath)) {
    console.error('[Keywords API] File not found at:', fullPath);
    return res.status(404).json({ error: 'File not found' });
  }

  try {
    const fileContent = fs.readFileSync(fullPath, "utf8");

    // Parse frontmatter
    // We assume the file starts with ---
    const match = fileContent.match(/^---\n([\s\S]*?)\n---/);
    if (!match) {
      return res.status(500).json({ error: "Could not parse frontmatter" });
    }

    const frontMatterStr = match[1];
    const contentBody = fileContent.slice(match[0].length);

    let frontMatter = yaml.load(frontMatterStr);

    // Initialize keywords if missing
    if (!frontMatter.keywords) {
      frontMatter.keywords = [];
    } else if (typeof frontMatter.keywords === "string") {
      // Handle case where keywords might be a single string
      frontMatter.keywords = [frontMatter.keywords];
    }

    // Check if keyword already exists (case insensitive?)
    // Let's keep it exact match but trim
    const newKeyword = keyword.trim();
    if (frontMatter.keywords.includes(newKeyword)) {
      return res
        .status(200)
        .json({
          message: "Keyword already exists",
          keywords: frontMatter.keywords,
        });
    }

    frontMatter.keywords.push(newKeyword);

    // Reconstruct file
    // Use yaml.dump but ensure we don't not mess up too much formatting
    const newFrontMatterStr = yaml.dump(frontMatter);
    const newFileContent = `---\n${newFrontMatterStr}---\n${contentBody}`;

    fs.writeFileSync(fullPath, newFileContent);

    console.log(`Updated keywords for ${filePath}: added "${newKeyword}"`);

    res.status(200).json({
      message: "Keyword added successfully",
      keywords: frontMatter.keywords,
    });
  } catch (error) {
    console.error("Error updating keywords:", error);
    res.status(500).json({ error: "Failed to update keywords" });
  }
});

app.delete('/api/v1/keywords', authenticate, async (req, res) => {
  const { filePath, keyword } = req.body;

  if (!filePath || !keyword) {
    return res.status(400).json({ error: 'FilePath and keyword are required' });
  }

  // Sanitize filePath
  const safeFilePath = filePath.replace(/^[/\\]+/, '');

  const projectRoot = path.resolve(__dirname, '..');
  const contentDir = path.resolve(projectRoot, 'content');

  let fullPath = path.resolve(projectRoot, safeFilePath);

  if (!fullPath.startsWith(contentDir) || !fs.existsSync(fullPath)) {
     const contentPath = path.resolve(contentDir, safeFilePath);
     const chineseContentPath = path.resolve(contentDir, 'chinese', safeFilePath);

     if (fs.existsSync(contentPath)) {
        fullPath = contentPath;
     } else if (fs.existsSync(chineseContentPath)) {
        fullPath = chineseContentPath;
     } else {
        console.error('[Keywords API DELETE] File not found:', fullPath);
        return res.status(404).json({ error: 'File not found' });
     }
  }

  try {
    const fileContent = fs.readFileSync(fullPath, 'utf8');

    // Parse frontmatter
    const match = fileContent.match(/^---\n([\s\S]*?)\n---/);
    if (!match) {
      return res.status(500).json({ error: 'Could not parse frontmatter' });
    }

    const frontMatterStr = match[1];
    const contentBody = fileContent.slice(match[0].length);
    let frontMatter = yaml.load(frontMatterStr);

    if (!frontMatter.keywords || !Array.isArray(frontMatter.keywords)) {
      return res.status(404).json({ error: 'Keyword not found' });
    }

    const keywordTrimmed = keyword.trim();
    const initialLength = frontMatter.keywords.length;
    frontMatter.keywords = frontMatter.keywords.filter(k => k !== keywordTrimmed);

    if (frontMatter.keywords.length === initialLength) {
       return res.status(404).json({ error: 'Keyword not found in list' });
    }

    const newFrontMatterStr = yaml.dump(frontMatter);
    const newFileContent = `---\n${newFrontMatterStr}---\n${contentBody}`;

    fs.writeFileSync(fullPath, newFileContent);

    console.log(`Removed keyword from ${filePath}: deleted "${keywordTrimmed}"`);

    res.status(200).json({
      message: 'Keyword deleted successfully',
      keywords: frontMatter.keywords
    });

  } catch (error) {
    console.error('Error deleting keyword:', error);
    res.status(500).json({ error: 'Failed to delete keyword' });
  }
});

// --- Tags API ---

app.post("/api/v1/tags", authenticate, async (req, res) => {
  const { filePath, tag } = req.body;

  if (!filePath || !tag) {
    return res.status(400).json({ error: "FilePath and tag are required" });
  }

  const projectRoot = path.resolve(__dirname, '..');
  const contentDir = path.resolve(projectRoot, 'content');
  const safeFilePath = filePath.replace(/^[/\\]+/, '');
  let fullPath = path.resolve(projectRoot, safeFilePath);

  if (!fullPath.startsWith(contentDir) || !fs.existsSync(fullPath)) {
    const contentPath = path.resolve(contentDir, safeFilePath);
    const chineseContentPath = path.resolve(contentDir, 'chinese', safeFilePath);
    if (fs.existsSync(contentPath)) fullPath = contentPath;
    else if (fs.existsSync(chineseContentPath)) fullPath = chineseContentPath;
  }

  if (!fullPath.startsWith(contentDir) || !fs.existsSync(fullPath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  try {
    const fileContent = fs.readFileSync(fullPath, "utf8");
    const match = fileContent.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return res.status(500).json({ error: "Could not parse frontmatter" });

    const frontMatterStr = match[1];
    const contentBody = fileContent.slice(match[0].length);
    let frontMatter = yaml.load(frontMatterStr);

    if (!frontMatter.tags) frontMatter.tags = [];
    else if (typeof frontMatter.tags === "string") frontMatter.tags = [frontMatter.tags];

    const newTag = tag.trim();
    if (frontMatter.tags.includes(newTag)) {
      return res.status(200).json({ message: "Tag already exists", tags: frontMatter.tags });
    }

    frontMatter.tags.push(newTag);
    const newFrontMatterStr = yaml.dump(frontMatter);
    const newFileContent = `---\n${newFrontMatterStr}---\n${contentBody}`;
    fs.writeFileSync(fullPath, newFileContent);

    res.status(200).json({ message: "Tag added successfully", tags: frontMatter.tags });
  } catch (error) {
    console.error("Error updating tags:", error);
    res.status(500).json({ error: "Failed to update tags" });
  }
});

app.delete('/api/v1/tags', authenticate, async (req, res) => {
  const { filePath, tag } = req.body;

  if (!filePath || !tag) {
    return res.status(400).json({ error: 'FilePath and tag are required' });
  }

  const projectRoot = path.resolve(__dirname, '..');
  const contentDir = path.resolve(projectRoot, 'content');
  const safeFilePath = filePath.replace(/^[/\\]+/, '');
  let fullPath = path.resolve(projectRoot, safeFilePath);

  if (!fullPath.startsWith(contentDir) || !fs.existsSync(fullPath)) {
     const contentPath = path.resolve(contentDir, safeFilePath);
     const chineseContentPath = path.resolve(contentDir, 'chinese', safeFilePath);
     if (fs.existsSync(contentPath)) fullPath = contentPath;
     else if (fs.existsSync(chineseContentPath)) fullPath = chineseContentPath;
     else return res.status(404).json({ error: 'File not found' });
  }

  try {
    const fileContent = fs.readFileSync(fullPath, 'utf8');
    const match = fileContent.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return res.status(500).json({ error: 'Could not parse frontmatter' });

    const frontMatterStr = match[1];
    const contentBody = fileContent.slice(match[0].length);
    let frontMatter = yaml.load(frontMatterStr);

    if (!frontMatter.tags || !Array.isArray(frontMatter.tags)) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    const tagTrimmed = tag.trim();
    const initialLength = frontMatter.tags.length;
    frontMatter.tags = frontMatter.tags.filter(t => t !== tagTrimmed);

    if (frontMatter.tags.length === initialLength) {
       return res.status(404).json({ error: 'Tag not found in list' });
    }

    const newFrontMatterStr = yaml.dump(frontMatter);
    const newFileContent = `---\n${newFrontMatterStr}---\n${contentBody}`;
    fs.writeFileSync(fullPath, newFileContent);

    res.status(200).json({ message: 'Tag deleted successfully', tags: frontMatter.tags });
  } catch (error) {
    console.error('Error deleting tag:', error);
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`🔑 API Key restricted: Use X-API-Key header`);
});
