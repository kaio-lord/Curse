const axios = require('axios');

const config = {
  api: {
    externalResolver: true,
  },
};

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed'
    });
  }

  const { q, output = 'json' } = req.query;

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
      output: output
    };

    const response = await axios.get(searchUrl, { 
      params,
      headers: {
        'Accept': output === 'html' ? 'text/html' : 'application/json',
      }
    });

    if (output === 'html') {
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(response.data);
    }

    return res.status(200).json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error('Search API error:', error.message);
    
    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data?.error || error.message || 'Internal server error';

    return res.status(statusCode).json({
      success: false,
      error: errorMessage
    });
  }
}

module.exports = handler;
module.exports.config = config;
