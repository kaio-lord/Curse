const axios = require('axios');

module.exports = async (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'URL parameter is required' });
    }

    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer'
        });

        res.setHeader('Content-Type', response.headers['content-type']);
        res.send(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch the URL' });
    }
};
