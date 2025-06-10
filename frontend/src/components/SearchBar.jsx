import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

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
      <input
        type="text"
        placeholder={t('search_placeholder')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </div>
  );
}