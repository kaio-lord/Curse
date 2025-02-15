import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

type SearchResponse = {
  success?: boolean;
  data?: any;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SearchResponse>
) {
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
    const response = await axios.get('https://serpapi.com/search.json', {
      params: {
        engine: 'duckduckgo',
        q: q,
        kl: 'us-en',
        api_key: apiKey
      },
      headers: {
        'Accept': 'application/json'
      }
    });

    return res.status(200).json({
      success: true,
      data: response.data
    });

  } catch (error: any) {
    console.error('Search API error:', error);

    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data?.error || error.message || 'Internal server error';

    return res.status(statusCode).json({
      success: false,
      error: errorMessage
    });
  }
}
