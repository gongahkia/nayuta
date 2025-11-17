import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import SearchBar from './components/SearchBar';
import ResultsList from './components/ResultsList';
import Loader from './components/Loader';
import Footer from './components/Footer';
import LanguageSwitcher from './components/LanguageSwitcher';
import GraphVisualization from './components/GraphVisualization';
import { searchAPI } from './api/search';
import './styles/main.css';

export default function App() {
  const { t } = useTranslation();
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentQuery, setCurrentQuery] = useState('');
  const [explainEnabled, setExplainEnabled] = useState(true);
  const [showGraph, setShowGraph] = useState(false);
  const [parsedQuery, setParsedQuery] = useState(null);

  const handleSearch = async (query) => {
    setIsLoading(true);
    setError(null);
    setCurrentQuery(query);

    try {
      const data = await searchAPI.query(query, explainEnabled);
      setResults(data.results || []);
      setParsedQuery(data.parsed_query);
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

        <button className="graph-button" onClick={() => setShowGraph(true)}>
          {t('view_graph', { defaultValue: '🕸️ View Graph' })}
        </button>
      </div>

      {parsedQuery && (
        <div className="parsed-query-info">
          <strong>{t('query_parsed', { defaultValue: 'Query interpreted as' })}:</strong>
          {parsedQuery.site && <span className="query-tag">site:{parsedQuery.site}</span>}
          {parsedQuery.filetype && <span className="query-tag">filetype:{parsedQuery.filetype}</span>}
          {parsedQuery.intitle && <span className="query-tag">intitle:"{parsedQuery.intitle}"</span>}
          {parsedQuery.inurl && <span className="query-tag">inurl:{parsedQuery.inurl}</span>}
          {parsedQuery.daterange && (
            <span className="query-tag">
              daterange:{parsedQuery.daterange.start}..{parsedQuery.daterange.end}
            </span>
          )}
          {parsedQuery.exact_phrases.map((phrase, i) => (
            <span key={i} className="query-tag phrase">"{phrase}"</span>
          ))}
          {parsedQuery.excluded_terms.map((term, i) => (
            <span key={i} className="query-tag excluded">-{term}</span>
          ))}
          {parsedQuery.base_terms.length > 0 && (
            <span className="query-tag base">{parsedQuery.base_terms.join(' ')}</span>
          )}
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
      {isLoading ? <Loader /> : <ResultsList results={results} query={currentQuery} />}
      <Footer />

      {showGraph && <GraphVisualization onClose={() => setShowGraph(false)} />}
    </div>
  );
}