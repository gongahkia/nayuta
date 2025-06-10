import React, { useState, useEffect } from 'react';
import { searchAPI } from '../api/search';

export default function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('');
  
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if(query.trim()) {
        onSearch(query);
      }
    }, 300);
    
    return () => clearTimeout(debounceTimer);
  }, [query]);

  return (
    <div className="search-container">
      <input
        type="text"
        placeholder="Search Nayuta..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </div>
  );
}