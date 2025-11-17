// LocalStorage-based search history service

const HISTORY_KEY = 'nayuta_search_history';
const MAX_HISTORY_ITEMS = 100;

export const historyService = {
  // Get all history items
  getHistory() {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get history:', error);
      return [];
    }
  },

  // Add a search to history
  addSearch(query, resultsCount = 0) {
    try {
      const history = this.getHistory();

      const newEntry = {
        id: Date.now().toString(),
        query,
        resultsCount,
        timestamp: new Date().toISOString()
      };

      // Check if query already exists recently (within last 10 entries)
      const recentIndex = history.slice(0, 10).findIndex(
        item => item.query.toLowerCase() === query.toLowerCase()
      );

      if (recentIndex !== -1) {
        // Update existing entry
        history[recentIndex] = { ...history[recentIndex], timestamp: newEntry.timestamp };
      } else {
        // Add new entry at the beginning
        history.unshift(newEntry);
      }

      // Limit history size
      if (history.length > MAX_HISTORY_ITEMS) {
        history.splice(MAX_HISTORY_ITEMS);
      }

      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      return newEntry;
    } catch (error) {
      console.error('Failed to add to history:', error);
      return null;
    }
  },

  // Add a click event to history
  addClick(query, url) {
    try {
      const history = this.getHistory();
      const entry = history.find(item => item.query === query);

      if (entry) {
        if (!entry.clicks) {
          entry.clicks = [];
        }

        entry.clicks.push({
          url,
          timestamp: new Date().toISOString()
        });

        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      }
    } catch (error) {
      console.error('Failed to add click:', error);
    }
  },

  // Delete a history entry
  deleteEntry(id) {
    try {
      const history = this.getHistory();
      const filtered = history.filter(item => item.id !== id);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
      return filtered;
    } catch (error) {
      console.error('Failed to delete entry:', error);
      return history;
    }
  },

  // Clear all history
  clearAll() {
    try {
      localStorage.removeItem(HISTORY_KEY);
      return true;
    } catch (error) {
      console.error('Failed to clear history:', error);
      return false;
    }
  },

  // Search within history
  searchHistory(searchTerm) {
    try {
      const history = this.getHistory();
      if (!searchTerm) return history;

      return history.filter(item =>
        item.query.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (error) {
      console.error('Failed to search history:', error);
      return [];
    }
  },

  // Get history statistics
  getStats() {
    try {
      const history = this.getHistory();

      return {
        totalSearches: history.length,
        totalClicks: history.reduce((sum, item) => sum + (item.clicks?.length || 0), 0),
        avgResultsPerSearch: history.length > 0
          ? history.reduce((sum, item) => sum + (item.resultsCount || 0), 0) / history.length
          : 0,
        mostSearchedQueries: this._getMostFrequent(history),
        recentSearches: history.slice(0, 10)
      };
    } catch (error) {
      console.error('Failed to get stats:', error);
      return null;
    }
  },

  // Helper: Get most frequent queries
  _getMostFrequent(history) {
    const frequency = {};

    history.forEach(item => {
      const query = item.query.toLowerCase();
      frequency[query] = (frequency[query] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));
  },

  // Export history as JSON
  exportHistory() {
    try {
      const history = this.getHistory();
      const dataStr = JSON.stringify(history, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `nayuta-history-${Date.now()}.json`;
      link.click();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export history:', error);
    }
  },

  // Import history from JSON
  importHistory(jsonData) {
    try {
      const imported = JSON.parse(jsonData);
      const current = this.getHistory();

      // Merge without duplicates
      const merged = [...current];

      imported.forEach(item => {
        if (!merged.find(existing => existing.id === item.id)) {
          merged.push(item);
        }
      });

      // Sort by timestamp (newest first)
      merged.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Limit size
      if (merged.length > MAX_HISTORY_ITEMS) {
        merged.splice(MAX_HISTORY_ITEMS);
      }

      localStorage.setItem(HISTORY_KEY, JSON.stringify(merged));
      return merged;
    } catch (error) {
      console.error('Failed to import history:', error);
      return null;
    }
  }
};
