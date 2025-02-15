const axios = require('axios');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Missing query parameter: q' });
  }

  const apiKey = process.env.SERPAPI_KEY || '96032230089168a9568ddcadc418937154b3bfc8a4a1a15f0478dc7c02f74bda';

  try {
    const searchUrl = 'https://serpapi.com/search.json';
    const params = {
      engine: 'duckduckgo',
      q: Array.isArray(q) ? q[0] : q,
      kl: 'us-en',
      api_key: apiKey,
      output: 'html'
    };

    const response = await axios.get(searchUrl, { 
      params,
      headers: {
        'Accept': 'text/html',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
      }
    });

    const baseUrl = `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`;

    let processedHtml = response.data;

    const urlReplacements = [
      { 
        pattern: /href=["']([^"']+)["']/gi, 
        replace: (match, url) => `href="/api/proxy.js?q=${encodeURIComponent(url)}"`
      },
      { 
        pattern: /src=["']([^"']+)["']/gi, 
        replace: (match, url) => `src="/api/proxy.js?q=${encodeURIComponent(url)}"`
      },
      { 
        pattern: /(https?:\/\/[^\s<>"']+)/gi, 
        replace: (url) => `/api/proxy.js?q=${encodeURIComponent(url)}`
      }
    ];

    urlReplacements.forEach(({ pattern, replace }) => {
      processedHtml = processedHtml.replace(pattern, replace);
    });
    const fullHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Search Results</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
          }
          a { color: #0066cc; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        ${processedHtml}
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(fullHtml);

  } catch (error) {
    console.error('Search API error:', error);
    
    const errorHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Search Error</title>
        <style>
          body { 
            font-family: Arial, sans-serif;
            color: red;
            padding: 20px;
          }
        </style>
      </head>
      <body>
        <h1>Search Error</h1>
        <p>${error.message}</p>
      </body>
      </html>
    `;

    res.status(500).send(errorHtml);
  }
}

export const config = {
  api: {
    responseLimit: false,
  },
};
