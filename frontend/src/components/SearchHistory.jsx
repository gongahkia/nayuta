import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { historyService } from '../services/historyService';
import '../styles/search-history.css';

export default function SearchHistory({ onSelectQuery }) {
  const { t } = useTranslation();
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState('');
  const [stats, setStats] = useState(null);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    loadHistory();
    loadStats();
  }, []);

  const loadHistory = () => {
    const data = historyService.getHistory();
    setHistory(data);
  };

  const loadStats = () => {
    const data = historyService.getStats();
    setStats(data);
  };

  const handleDelete = (id) => {
    historyService.deleteEntry(id);
    loadHistory();
    loadStats();
  };

  const handleClearAll = () => {
    if (window.confirm(t('confirm_clear_history', { defaultValue: 'Clear all history?' }))) {
      historyService.clearAll();
      loadHistory();
      loadStats();
    }
  };

  const handleExport = () => {
    historyService.exportHistory();
  };

  const filteredHistory = filter
    ? historyService.searchHistory(filter)
    : history;

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return t('just_now', { defaultValue: 'Just now' });
    if (diffMins < 60) return t('mins_ago', { defaultValue: `${diffMins}m ago`, count: diffMins });
    if (diffMins < 1440) return t('hours_ago', { defaultValue: `${Math.floor(diffMins / 60)}h ago`, count: Math.floor(diffMins / 60) });

    return date.toLocaleDateString();
  };

  return (
    <div className="search-history">
      <div className="history-header">
        <h3>{t('search_history', { defaultValue: 'Search History' })}</h3>
        <div className="history-actions">
          <button onClick={() => setShowStats(!showStats)} className="stats-btn">
            {t('stats', { defaultValue: 'Stats' })}
          </button>
          <button onClick={handleExport} className="export-btn">
            {t('export', { defaultValue: 'Export' })}
          </button>
          <button onClick={handleClearAll} className="clear-btn">
            {t('clear_all', { defaultValue: 'Clear All' })}
          </button>
        </div>
      </div>

      {showStats && stats && (
        <div className="history-stats">
          <div className="stat-box">
            <span className="stat-value">{stats.totalSearches}</span>
            <span className="stat-label">{t('total_searches', { defaultValue: 'Searches' })}</span>
          </div>
          <div className="stat-box">
            <span className="stat-value">{stats.totalClicks}</span>
            <span className="stat-label">{t('total_clicks', { defaultValue: 'Clicks' })}</span>
          </div>
          <div className="stat-box">
            <span className="stat-value">{stats.avgResultsPerSearch.toFixed(1)}</span>
            <span className="stat-label">{t('avg_results', { defaultValue: 'Avg Results' })}</span>
          </div>
        </div>
      )}

      <input
        type="text"
        className="history-filter"
        placeholder={t('filter_history', { defaultValue: 'Filter history...' })}
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      <div className="history-list">
        {filteredHistory.length === 0 ? (
          <div className="empty-history">
            {t('no_history', { defaultValue: 'No search history yet' })}
          </div>
        ) : (
          filteredHistory.map((item) => (
            <div key={item.id} className="history-item">
              <div
                className="history-query"
                onClick={() => onSelectQuery(item.query)}
              >
                <span className="query-icon">🔍</span>
                <span className="query-text">{item.query}</span>
              </div>
              <div className="history-meta">
                <span className="history-time">{formatDate(item.timestamp)}</span>
                {item.resultsCount > 0 && (
                  <span className="history-results">
                    {item.resultsCount} {t('results', { defaultValue: 'results' })}
                  </span>
                )}
                {item.clicks && item.clicks.length > 0 && (
                  <span className="history-clicks">
                    {item.clicks.length} {t('clicks', { defaultValue: 'clicks' })}
                  </span>
                )}
              </div>
              <button
                className="delete-btn"
                onClick={() => handleDelete(item.id)}
                title={t('delete', { defaultValue: 'Delete' })}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
