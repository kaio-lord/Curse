const axios = require('axios');
const express = require('express');
const app = express();

const SERPAPI_KEY = process.env.SERPAPI_KEY || '96032230089168a9568ddcadc418937154b3bfc8a4a1a15f0478dc7c02f74bda'; //Do as you wish with this.  It will change every once in a while
const resolveRedirects = async (url) => {
    try {
        const response = await axios.get(url, {
            maxRedirects: 0, 
            validateStatus: (status) => status >= 200 && status < 400,
        });

        if (response.status >= 300 && response.status < 400 && response.headers.location) {
            return response.headers.location;
        }
        return url;
    } catch (error) {
        console.error('Error resolving redirects:', error.message);
        return url;
    }
};

app.get('/api/search.js', async (req, res) => {
    const { q } = req.query;

    if (!q) {
        return res.status(400).json({ error: 'Missing query parameter: q' });
    }

    try {
        const serpapiUrl = `https://serpapi.com/search.json?q=${encodeURIComponent(q)}&location=Austin,+Texas,+United+States&hl=en&gl=us&google_domain=google.com&api_key=${SERPAPI_KEY}&output=html`;
        const response = await axios.get(serpapiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
            }
        });

        if (!response.data || typeof response.data !== 'string') {
            return res.status(500).json({ 
                error: 'Invalid search results format', 
                details: 'No HTML content found', 
                response: response.data
            });
        }

        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const linkRegex = /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/gi;
        let modifiedHtml = response.data;
        let match;

        while ((match = linkRegex.exec(response.data)) !== null) {
            const originalUrl = match[2];
            const resolvedUrl = await resolveRedirects(originalUrl); // Resolve redirects
            const proxyUrl = `${baseUrl}/api/proxy.js?q=${encodeURIComponent(resolvedUrl)}`;
            modifiedHtml = modifiedHtml.replace(`href="${originalUrl}"`, `href="${proxyUrl}" target="iframe-result"`);
        }

        res.send(modifiedHtml);
    } catch (error) {
        console.error('Search error:', error.message);
        res.status(500).json({ error: 'Error fetching search results', details: error.message });
    }
});

app.get('/api/proxy.js', async (req, res) => {
    const { q } = req.query;

    if (!q) {
        return res.status(400).json({ error: 'Missing query parameter: q' });
    }

    try {
        const response = await axios.get(q);
        res.send(response.data);
    } catch (error) {
        console.error('Proxy error:', error.message);
        res.status(500).json({ error: 'Error fetching URL', details: error.message });
    }
});

module.exports = app;
