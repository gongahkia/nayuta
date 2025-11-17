import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ExplanationModal from './ExplanationModal';
import { historyService } from '../services/historyService';

export default function ResultsList({ results, query }) {
  const { t } = useTranslation();
  const [selectedExplanation, setSelectedExplanation] = useState(null);

  const handleExplainClick = (result) => {
    setSelectedExplanation({
      explanation: result.explanation,
      query: query
    });
  };

  const handleResultClick = (url) => {
    // Track click in history
    if (query) {
      historyService.addClick(query, url);
    }
  };

  const closeModal = () => {
    setSelectedExplanation(null);
  };

  return (
    <>
      <div className="results-container">
        {results.map((result, index) => (
          <div key={index} className="result-item">
            <div className="result-header">
              <a
                href={result.url}
                className="result-url"
                onClick={() => handleResultClick(result.url)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {result.url}
              </a>
              {result.explanation && (
                <button
                  className="explain-button"
                  onClick={() => handleExplainClick(result)}
                  title={t('why_this_result', { defaultValue: 'Why this result?' })}
                >
                  {t('why', { defaultValue: 'Why?' })}
                </button>
              )}
            </div>
            <h3 className="result-title">{result.title || 'Untitled Document'}</h3>
            <p className="result-snippet">{result.snippet}</p>
            {result.score && (
              <div className="result-score">
                {t('score', { defaultValue: 'Score' })}: {result.score.toFixed(4)}
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedExplanation && (
        <ExplanationModal
          explanation={selectedExplanation.explanation}
          query={selectedExplanation.query}
          onClose={closeModal}
        />
      )}
    </>
  );
}