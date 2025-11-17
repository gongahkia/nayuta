import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import SearchBar from './components/SearchBar';
import ResultsList from './components/ResultsList';
import Loader from './components/Loader';
import Footer from './components/Footer';
import LanguageSwitcher from './components/LanguageSwitcher';
import { searchAPI } from './api/search';
import './styles/main.css';

export default function App() {
  const { t } = useTranslation();
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentQuery, setCurrentQuery] = useState('');
  const [explainEnabled, setExplainEnabled] = useState(true);

  const handleSearch = async (query) => {
    setIsLoading(true);
    setError(null);
    setCurrentQuery(query);

    try {
      const data = await searchAPI.query(query, explainEnabled);
      setResults(data.results || []);
    } catch (err) {
      setError(t('failed_to_fetch_results', { defaultValue: 'Failed to fetch results' }));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExplanation = () => {
    setExplainEnabled(!explainEnabled);
    if (currentQuery) {
      handleSearch(currentQuery);
    }
  };

  return (
    <div className="app-container">
      <h1 className="app-title">Nayuta Search</h1>
      <LanguageSwitcher />
      <SearchBar onSearch={handleSearch} />

      <div className="search-options">
        <label className="explain-toggle">
          <input
            type="checkbox"
            checked={explainEnabled}
            onChange={toggleExplanation}
          />
          <span>{t('show_explanations', { defaultValue: 'Show result explanations' })}</span>
        </label>
      </div>

      {error && <div className="error-message">{error}</div>}
      {isLoading ? <Loader /> : <ResultsList results={results} query={currentQuery} />}
      <Footer />
    </div>
  );
}