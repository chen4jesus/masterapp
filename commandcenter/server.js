import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const SITES_FILE = path.join(__dirname, 'sites.yaml');
const BOOKS_FILE = path.join(__dirname, 'books.yaml');

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Log all requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Helper for Sites Config (sites.yaml)
const readSitesConfig = () => {
    if (!fs.existsSync(SITES_FILE)) {
        return [];
    }
    const fileContents = fs.readFileSync(SITES_FILE, 'utf8');
    const data = yaml.load(fileContents);
    if (data && data.sites) return data.sites;
    return Array.isArray(data) ? data : [];
};

const saveSitesConfig = (sites) => {
    fs.writeFileSync(SITES_FILE, yaml.dump(sites), 'utf8');
};

// Helper for Books Config (books.yaml)
const readBooksConfig = () => {
    if (!fs.existsSync(BOOKS_FILE)) {
        return {};
    }
    const fileContents = fs.readFileSync(BOOKS_FILE, 'utf8');
    const data = yaml.load(fileContents);
    return data || {};
};

const saveBooksConfig = (config) => {
    fs.writeFileSync(BOOKS_FILE, yaml.dump(config), 'utf8');
};

// --- Sites Endpoints ---

app.get('/api/local/sites', (req, res) => {
    try {
        const sites = readSitesConfig();
        res.json(sites);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to read sites configuration' });
    }
});

app.post('/api/local/sites', (req, res) => {
    try {
        const newSite = req.body;
        const sites = readSitesConfig();
        if (!newSite.id) newSite.id = Date.now();
        sites.push(newSite);
        saveSitesConfig(sites);
        res.json(newSite);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to save site configuration' });
    }
});

app.put('/api/local/sites/:id', (req, res) => {
    try {
        const siteId = parseInt(req.params.id);
        const updatedSite = req.body;
        const sites = readSitesConfig();
        const index = sites.findIndex(s => s.id === siteId);
        if (index === -1) return res.status(404).json({ error: 'Site not found' });
        sites[index] = { ...sites[index], ...updatedSite };
        saveSitesConfig(sites);
        res.json(sites[index]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update site configuration' });
    }
});

app.delete('/api/local/sites/:id', (req, res) => {
    try {
        const siteId = parseInt(req.params.id);
        let sites = readSitesConfig();
        const initialLength = sites.length;
        sites = sites.filter(s => s.id !== siteId);
        if (sites.length === initialLength) return res.status(404).json({ error: 'Site not found' });
        saveSitesConfig(sites);
        res.json({ message: 'Site deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete site' });
    }
});

// --- Proxy Endpoints ---

// Using a Regex Literal to bypass Path-to-RegExp string parsing entirely
app.all(/\/api\/local\/proxy\/bookstack\/(.*)/, async (req, res) => {
    try {
        const fullUrlPath = req.params[0] || '';
        const parts = fullUrlPath.split('/');
        const siteSlug = parts[0].split('?')[0]; 
        const apiPath = '/' + parts.slice(1).join('/');
        
        const sites = readSitesConfig();
        const site = sites.find(s => s.slug === siteSlug);

        if (!site) {
            return res.status(404).json({ error: `Site configuration not found for slug: ${siteSlug}` });
        }

        const baseUrl = site.url.endsWith('/') ? site.url.slice(0, -1) : site.url;
        const queryString = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
        const targetUrl = `${baseUrl}/api${apiPath}${queryString}`;
        
        let token = (site.api_token || '').trim();
        if (token.startsWith('Token ')) {
            token = token.substring(6).trim();
        }

        console.log(`[Proxy] BookStack ${req.method} ${targetUrl}`);

        const fetchOptions = {
            method: req.method,
            headers: {
                'Authorization': `Token ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };

        if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
            fetchOptions.body = JSON.stringify(req.body);
        }

        const response = await fetch(targetUrl, fetchOptions);
        const data = await response.json();
        res.status(response.status).json(data);
        
    } catch (error) {
        console.error('BookStack Proxy Error:', error);
        res.status(500).json({ error: 'Internal server error during proxy', details: error.message });
    }
});

// Proxy for Blog API
app.post('/api/local/proxy/blog/:siteSlug', (req, res) => {
    try {
        const { siteSlug } = req.params;
        const sites = readSitesConfig();
        const site = sites.find(s => s.slug === siteSlug);

        if (!site) return res.status(404).json({ error: 'Site configuration not found' });

        const blogApiUrl = site.blog_url || 'http://localhost/api/v1/blog';
        const apiKey = site.blog_api_key || 'development-api-key';

        fetch(blogApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey
            },
            body: JSON.stringify(req.body)
        }).then(async response => {
            const data = await response.json();
            if (!response.ok) return res.status(response.status).json(data);
            res.json(data);
        }).catch(err => {
            console.error('Fetch Proxy Error:', err);
            res.status(502).json({ error: 'Failed to connect to the remote blog API', details: err.message });
        });
        
    } catch (error) {
        console.error('Proxy Error:', error);
        res.status(500).json({ error: 'Internal server error during proxy', details: error.message });
    }
});

// --- Book Configuration Endpoints ---

app.get('/api/local/books/:bookId/config', (req, res) => {
    try {
        const { bookId } = req.params;
        const booksConfig = readBooksConfig();
        res.json(booksConfig[bookId] || {});
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to read book configuration' });
    }
});

app.post('/api/local/books/:bookId/config', (req, res) => {
    try {
        const { bookId } = req.params;
        const newConfig = req.body;
        const booksConfig = readBooksConfig();
        booksConfig[bookId] = newConfig;
        saveBooksConfig(booksConfig);
        res.json(booksConfig[bookId]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to save book configuration' });
    }
});

// --- MiroTalk Service ---
// Import and setup MiroTalk routes for on-demand meeting room management
import('./src/services/mirotalkService.js')
    .then(({ setupMiroTalkRoutes }) => {
        setupMiroTalkRoutes(app, {
            linodeToken: process.env.LINODE_TOKEN,
            apiKeySecret: process.env.MIROTALK_API_SECRET || 'mirotalkp2p_default_secret',
            webhookBaseUrl: process.env.WEBHOOK_BASE_URL || `http://localhost:${PORT}`
        });
    })
    .catch(err => {
        console.warn('[MiroTalk] Service not loaded:', err.message);
    });

app.listen(PORT, () => {
    console.log(`Local configuration server running on http://localhost:${PORT}`);
});
