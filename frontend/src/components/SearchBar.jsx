import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import SearchHelp from './SearchHelp';

export default function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if(query.trim()) {
        onSearch(query);
      }
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, onSearch]);

  return (
    <div className="search-container">
      <div className="search-input-wrapper">
        <input
          type="text"
          placeholder={t('search_placeholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
        />
      </div>
    </div>
  );
}