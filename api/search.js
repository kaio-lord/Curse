import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

interface SearchResponse {
  organic_results?: SearchResult[];
  error?: string;
  details?: string;
}

const SERPAPI_KEY = process.env.SERPAPI_KEY || '96032230089168a9568ddcadc418937154b3bfc8a4a1a15f0478dc7c02f74bda';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SearchResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Missing query parameter: q' });
  }

  try {
    const searchUrl = `https://serpapi.com/search.json?engine=duckduckgo&q=${encodeURIComponent(String(q))}&kl=us-en&api_key=${SERPAPI_KEY}`;

    const response = await axios.get(searchUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
      }
    });

    return res.status(200).json(response.data);

  } catch (error: any) {
    console.error('Search error:', error.message);
    
    if (axios.isAxiosError(error)) {
      return res.status(error.response?.status || 500).json({
        error: 'Search API error',
        details: error.response?.data?.error || error.message
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}
