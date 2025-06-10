import axios from 'axios';

const API_BASE = 'http://localhost:8000';

export const searchAPI = {
  query: async (q) => {
    try {
      const response = await axios.get(`${API_BASE}/search`, {
        params: { q }
      });
      return response.data;
    } catch (error) {
      console.error('Search API error:', error);
      return [];
    }
  }
};