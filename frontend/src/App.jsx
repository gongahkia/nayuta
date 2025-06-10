import React, { useState } from 'react';
import SearchBar from './components/SearchBar';
import ResultsList from './components/ResultsList';
import Loader from './components/Loader';
import Footer from './components/Footer';
import { searchAPI } from './api/search';
import './styles/main.css';

export default function App() {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (query) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await searchAPI.query(query);
      setResults(data);
    } catch (err) {
      setError('Failed to fetch results');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <h1 className="app-title">Nayuta Search</h1>
      <SearchBar onSearch={handleSearch} />
      {error && <div className="error-message">{error}</div>}
      {isLoading ? <Loader /> : <ResultsList results={results} />}
      <Footer />
    </div>
  );
}