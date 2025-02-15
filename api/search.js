import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const SERPAPI_KEY = process.env.SERPAPI_KEY || '96032230089168a9568ddcadc418937154b3bfc8a4a1a15f0478dc7c02f74bda';

const resolveRedirects = async (url: string): Promise<string> => {
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
        console.error('Error resolving redirects:', error);
        return url;
    }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { q, path } = req.query;
    if (path === 'proxy') {
        if (!q) {
            return res.status(400).json({ error: 'Missing query parameter: q' });
        }

        try {
            const response = await axios.get(q as string);
            return res.send(response.data);
        } catch (error: any) {
            console.error('Proxy error:', error.message);
            return res.status(500).json({ error: 'Error fetching URL', details: error.message });
        }
    }
    if (!q) {
        return res.status(400).json({ error: 'Missing query parameter: q' });
    }

    try {
        const serpapiUrl = `https://serpapi.com/search.json?engine=duckduckgo&q=${encodeURIComponent(q as string)}&kl=us-en&api_key=${SERPAPI_KEY}`;
        
        const response = await axios.get(serpapiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
            }
        });

        if (!response.data) {
            return res.status(500).json({
                error: 'Invalid search results format',
                details: 'No content found',
                response: response.data
            });
        }

        const baseUrl = `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`;
        if (typeof response.data === 'string') {
            const linkRegex = /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/gi;
            let modifiedHtml = response.data;
            let match;

            while ((match = linkRegex.exec(response.data)) !== null) {
                const originalUrl = match[2];
                const resolvedUrl = await resolveRedirects(originalUrl);
                const proxyUrl = `${baseUrl}/api/search?path=proxy&q=${encodeURIComponent(resolvedUrl)}`;
                modifiedHtml = modifiedHtml.replace(`href="${originalUrl}"`, `href="${proxyUrl}" target="iframe-result"`);
            }

            return res.send(modifiedHtml);
        }
        const searchResults = response.data;
        if (searchResults.organic_results) {
            searchResults.organic_results = searchResults.organic_results.map((result: any) => ({
                ...result,
                link: `${baseUrl}/api/search?path=proxy&q=${encodeURIComponent(result.link)}`
            }));
        }

        return res.json(searchResults);

    } catch (error: any) {
        console.error('Search error:', error.message);
        return res.status(500).json({ error: 'Error fetching search results', details: error.message });
    }
}
