
const axios = require('axios');
const express = require('express');
const router = express.Router();

router.use((req, res, next) => {
    req.query = req.query || {};
    next();
});

router.get('/proxy', async (req, res) => {
    const { q, search } = req.query;

    if (!q) {
        return res.status(400).send('Missing query parameter: q');
    }

    try {
        let targetUrl = q;

        if (search === 'true') {
            const searxInstance = 'https://searx.be';
            targetUrl = `${searxInstance}/search?q=${encodeURIComponent(q)}`;
        }

        const response = await axios.get(targetUrl, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
                'Referer': targetUrl,
                'Accept': req.headers['accept'] || '*/*',
                'Accept-Language': req.headers['accept-language'] || 'en-US,en;q=0.9',
            }
        });

        res.setHeader('Content-Type', response.headers['content-type']);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.send(response.data);
    } catch (error) {
        console.error('Proxy error:', error.message);
        res.status(500).send('Error fetching resource');
    }
});

module.exports = { router };
