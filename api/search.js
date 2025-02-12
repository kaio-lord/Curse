const axios = require('axios');
const express = require('express');
const app = express();

app.get('/api/search.js', async (req, res) => {
    const { q } = req.query;

    if (!q) {
        return res.status(400).json({ error: 'Missing query parameter: q' });
    }

    try {
        
        const serpapiUrl = `https://serpapi.com/search.json?q=${encodeURIComponent(q)}&location=Austin,+Texas,+United+States&hl=en&gl=us&google_domain=google.com`;
        const response = await axios.get(serpapiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
            }
        });

        const searchResults = response.data;

        if (!searchResults.organic_results || !Array.isArray(searchResults.organic_results)) {
            return res.status(500).json({ 
                error: 'Invalid search results format', 
                details: 'No organic results found', 
                response: searchResults
            });
        }

        let htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Search Results for ${q}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .result { margin-bottom: 20px; }
                    .title { font-size: 18px; font-weight: bold; }
                    .url { color: green; font-size: 14px; }
                    .snippet { font-size: 14px; color: #555; }
                </style>
            </head>
            <body>
                <h1>Search Results for "${q}"</h1>
        `;

        searchResults.organic_results.forEach(result => {
            if (result.link && result.title && result.snippet) {
                htmlContent += `
                    <div class="result">
                        <div class="title"><a href="/api/proxy.js?q=${encodeURIComponent(result.link)}">${result.title}</a></div>
                        <div class="url">${result.link}</div>
                        <div class="snippet">${result.snippet}</div>
                    </div>
                `;
            }
        });

        htmlContent += `
            </body>
            </html>
        `;

        res.send(htmlContent);
    } catch (error) {
        console.error('Search error:', error.message);
        res.status(500).json({ error: 'Error fetching search results', details: error.message });
    }
});

module.exports = app;
