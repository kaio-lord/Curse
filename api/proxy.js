const axios = require('axios');

module.exports = async (req, res) => {
    const { q, search } = req.query;

    if (!q) {
        return res.status(400).send('Missing query parameter');
    }

    try {
        let targetUrl = q;

        if (search === 'true') {
            const searxInstance = 'https://searx.be';
            targetUrl = `${searxInstance}/search?q=${encodeURIComponent(q)}`;
        }

        // Fetch the content from the target URL
        const response = await axios.get(targetUrl, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
            }
        });

        // Set appropriate headers and send the response
        res.setHeader('Content-Type', response.headers['content-type']);
        res.send(response.data);
    } catch (error) {
        console.error('Proxy error:', error.message);
        res.status(500).send('Error fetching resource');
    }
};
