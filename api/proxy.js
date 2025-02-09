const axios = require('axios');

module.exports = async (req, res) => {
    const { url, query } = req.query;

    if (!url && !query) {
        return res.status(400).json({ error: 'URL or search query is required' });
    }

    try {
        let targetUrl = url;

        if (!url && query) {
            const searxInstance = 'https://searx.be'; 
            targetUrl = `${searxInstance}/search?q=${encodeURIComponent(query)}`;
        }
        const response = await axios.get(targetUrl, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
            }
        });

        // Set appropriate headers and send the response
        res.setHeader('Content-Type', response.headers['content-type']);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.send(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch the URL or perform the search' });
    }
};
