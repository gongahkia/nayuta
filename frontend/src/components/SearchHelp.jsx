import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/search-help.css';

export default function SearchHelp() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const operators = [
    {
      operator: 'site:',
      example: 'site:example.com search terms',
      description: t('help_site', { defaultValue: 'Restrict search to a specific domain' })
    },
    {
      operator: 'filetype:',
      example: 'filetype:pdf annual report',
      description: t('help_filetype', { defaultValue: 'Search for specific file types' })
    },
    {
      operator: 'intitle:',
      example: 'intitle:"machine learning"',
      description: t('help_intitle', { defaultValue: 'Search only in page titles' })
    },
    {
      operator: 'inurl:',
      example: 'inurl:blog technology',
      description: t('help_inurl', { defaultValue: 'Match keywords in URLs' })
    },
    {
      operator: 'daterange:',
      example: 'daterange:2024-01-01..2024-12-31',
      description: t('help_daterange', { defaultValue: 'Filter by crawl date range' })
    },
    {
      operator: '"exact phrase"',
      example: '"artificial intelligence"',
      description: t('help_phrase', { defaultValue: 'Search for exact phrase matches' })
    },
    {
      operator: '-exclude',
      example: 'python -snake',
      description: t('help_exclude', { defaultValue: 'Exclude terms from results' })
    },
    {
      operator: 'OR',
      example: 'cat OR dog',
      description: t('help_or', { defaultValue: 'Match any of the terms' })
    },
    {
      operator: 'AND',
      example: 'machine AND learning',
      description: t('help_and', { defaultValue: 'Match all terms (default)' })
    }
  ];

  const examples = [
    {
      query: 'site:github.com machine learning filetype:md',
      description: t('example_1', { defaultValue: 'Find machine learning markdown files on GitHub' })
    },
    {
      query: 'intitle:"neural networks" -tensorflow',
      description: t('example_2', { defaultValue: 'Neural networks pages without TensorFlow' })
    },
    {
      query: '"deep learning" (pytorch OR keras)',
      description: t('example_3', { defaultValue: 'Deep learning with PyTorch or Keras' })
    },
    {
      query: 'site:arxiv.org daterange:2024-01-01..2024-12-31 transformers',
      description: t('example_4', { defaultValue: 'Recent transformer papers on arXiv' })
    }
  ];

  return (
    <div className="search-help-container">
      <button
        className="help-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        title={t('search_operators_help', { defaultValue: 'Search Operators Help' })}
      >
        {t('help', { defaultValue: '?' })}
      </button>

      {isOpen && (
        <div className="help-modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="help-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="help-header">
              <h2>{t('search_operators', { defaultValue: 'Advanced Search Operators' })}</h2>
              <button className="close-btn" onClick={() => setIsOpen(false)}>&times;</button>
            </div>

            <div className="help-body">
              <section className="operators-section">
                <h3>{t('available_operators', { defaultValue: 'Available Operators' })}</h3>
                <div className="operators-grid">
                  {operators.map((op, idx) => (
                    <div key={idx} className="operator-card">
                      <div className="operator-header">
                        <code className="operator-name">{op.operator}</code>
                      </div>
                      <p className="operator-description">{op.description}</p>
                      <div className="operator-example">
                        <span className="example-label">{t('example', { defaultValue: 'Example' })}:</span>
                        <code className="example-code">{op.example}</code>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="examples-section">
                <h3>{t('example_queries', { defaultValue: 'Example Queries' })}</h3>
                <div className="examples-list">
                  {examples.map((ex, idx) => (
                    <div key={idx} className="example-item">
                      <code className="query-code">{ex.query}</code>
                      <p className="query-description">{ex.description}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="tips-section">
                <h3>{t('tips', { defaultValue: 'Tips' })}</h3>
                <ul className="tips-list">
                  <li>{t('tip_1', { defaultValue: 'Combine multiple operators for precise searches' })}</li>
                  <li>{t('tip_2', { defaultValue: 'Use quotes for exact phrase matching' })}</li>
                  <li>{t('tip_3', { defaultValue: 'Operators are case-insensitive' })}</li>
                  <li>{t('tip_4', { defaultValue: 'Use - to exclude unwanted terms' })}</li>
                  <li>{t('tip_5', { defaultValue: 'Parentheses group OR operations' })}</li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
