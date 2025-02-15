const axios = require('axios');

const config = {
  api: {
    externalResolver: true,
    responseLimit: '10mb',
  },
};

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed'
    });
  }

  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing query parameter: q'
    });
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

    let modifiedHtml = response.data;

    // Replace href links
    modifiedHtml = modifiedHtml.replace(
      /href=["'](https?:\/\/[^"']+)["']/gi,
      (match, url) => `href="/api/proxy.js?q=${encodeURIComponent(url)}"`
    );

    modifiedHtml = modifiedHtml.replace(
      /src=["'](https?:\/\/[^"']+)["']/gi,
      (match, url) => `src="/api/proxy.js?q=${encodeURIComponent(url)}"`
    );

    modifiedHtml = modifiedHtml.replace(
      /(https?:\/\/[^\s<>"']+)/g,
      (url) => `/api/proxy.js?q=${encodeURIComponent(url)}`
    );
    const htmlWrapper = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <base target="_self">
          <title>Search Results</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
              line-height: 1.6;
              margin: 0;
              padding: 20px;
            }
            a { color: #0066cc; text-decoration: none; }
            a:hover { text-decoration: underline; }
            img { max-width: 100%; height: auto; }
          </style>
        </head>
        <body>
          ${modifiedHtml}
        </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate');
    return res.status(200).send(htmlWrapper);

  } catch (error) {
    console.error('Search API error:', error.message);
    
    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data?.error || error.message || 'Internal server error';

    const errorHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Error</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 20px;
              color: #ff0000;
            }
          </style>
        </head>
        <body>
          <h1>Error</h1>
          <p>${errorMessage}</p>
        </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(statusCode).send(errorHtml);
  }
}

module.exports = handler;
module.exports.config = config;
