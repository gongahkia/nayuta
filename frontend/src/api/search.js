import axios from 'axios';

const API_BASE = 'http://localhost:8000';

export const searchAPI = {
  query: async (q, explain = false) => {
    try {
      const response = await axios.get(`${API_BASE}/search`, {
        params: {
          q,
          explain: explain ? 'true' : 'false'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Search API error:', error);
      return { results: [], query_time: 0, total_hits: 0 };
    }
  }
};