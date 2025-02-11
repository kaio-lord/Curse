const axios = require('axios');
const express = require('express');
const path = require('path');
const RateLimit = require('express-rate-limit');
const app = express();
const port = process.env.PORT || 3000;

const limiter = RateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 500,
});

app.use(limiter);

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.get('/api/proxy.js', async (req, res) => {
    const { q, search } = req.query;

    if (!q) {
        return res.status(400).json({ error: 'Missing query parameter: q' });
    }

    try {
        let targetUrl = q;

        if (search === 'true') {
            const qwantSearchUrl = 'https://www.qwant.com';
            targetUrl = `${qwantSearchUrl}/?l=en&q=${encodeURIComponent(q)}&t=web`;
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

        let contentType = response.headers['content-type'];
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=3600');

        if (contentType.includes('text/html')) {
            let htmlContent = response.data.toString('utf-8');

            htmlContent = htmlContent.replace(/(href|src|action)="([^"]*)"/g, (match, attr, url) => {
                if (url.startsWith('http') || url.startsWith('//')) {
                    return `${attr}="/api/proxy.js?q=${encodeURIComponent(url)}"`;
                }
                return match;
            });

            if (search === 'true') {
                htmlContent = htmlContent.replace(/<a href="(https:\/\/www.qwant.com\/\?q=[^"]*)"/g, (match, url) => {
                    return `<a href="/api/proxy.js?q=${encodeURIComponent(url)}"`;
                });
            }

            res.send(htmlContent);
        } else {
            res.send(response.data);
        }
    } catch (error) {
        console.error('Proxy error:', error.message);
        res.status(500).json({ error: 'Error fetching resource', details: error.message });
    }
});

app.use(express.static('public'));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Proxy server running on http://localhost:${port}`);
});
