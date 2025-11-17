import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/welcome-banner.css';

export default function WelcomeBanner() {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isCollapsed) {
    return (
      <div className="welcome-banner collapsed">
        <button 
          className="expand-btn"
          onClick={() => setIsCollapsed(false)}
          aria-label={t('show_features', { defaultValue: 'Show Features' })}
        >
          {t('features_guide', { defaultValue: 'Features & Guide' })} ▼
        </button>
      </div>
    );
  }

  return (
    <div className="welcome-banner">
      <div className="welcome-header">
        <h2>{t('welcome_to_nayuta', { defaultValue: 'Welcome to Nayuta' })}</h2>
        <button 
          className="collapse-btn"
          onClick={() => setIsCollapsed(true)}
          aria-label={t('hide_features', { defaultValue: 'Hide Features' })}
        >
          ×
        </button>
      </div>
      
      <p className="welcome-description">
        {t('nayuta_description', { 
          defaultValue: 'A powerful search engine with advanced operators and intelligent ranking.' 
        })}
      </p>

      <div className="features-grid">
        <div className="feature-card">
          <h3>{t('feature_operators_title', { defaultValue: 'Advanced Search Operators' })}</h3>
          <p>{t('feature_operators_desc', { 
            defaultValue: 'Use site:, filetype:, intitle:, inurl:, daterange:, and more to refine your searches.' 
          })}</p>
          <div className="feature-example">
            <code>site:github.com machine learning</code>
          </div>
        </div>

        <div className="feature-card">
          <h3>{t('feature_phrase_title', { defaultValue: 'Exact Phrase Matching' })}</h3>
          <p>{t('feature_phrase_desc', { 
            defaultValue: 'Use quotes to search for exact phrases in your results.' 
          })}</p>
          <div className="feature-example">
            <code>"artificial intelligence"</code>
          </div>
        </div>

        <div className="feature-card">
          <h3>{t('feature_exclude_title', { defaultValue: 'Exclude Terms' })}</h3>
          <p>{t('feature_exclude_desc', { 
            defaultValue: 'Use minus sign (-) to exclude specific terms from results.' 
          })}</p>
          <div className="feature-example">
            <code>python -snake</code>
          </div>
        </div>

        <div className="feature-card">
          <h3>{t('feature_boolean_title', { defaultValue: 'Boolean Operators' })}</h3>
          <p>{t('feature_boolean_desc', { 
            defaultValue: 'Combine terms with AND/OR for complex queries.' 
          })}</p>
          <div className="feature-example">
            <code>react AND (hooks OR components)</code>
          </div>
        </div>

        <div className="feature-card">
          <h3>{t('feature_graph_title', { defaultValue: 'Knowledge Graph' })}</h3>
          <p>{t('feature_graph_desc', { 
            defaultValue: 'Visualize connections between search results in an interactive graph.' 
          })}</p>
        </div>

        <div className="feature-card">
          <h3>{t('feature_explanations_title', { defaultValue: 'Result Explanations' })}</h3>
          <p>{t('feature_explanations_desc', { 
            defaultValue: 'See detailed scoring breakdowns for each search result.' 
          })}</p>
        </div>

        <div className="feature-card">
          <h3>{t('feature_history_title', { defaultValue: 'Search History' })}</h3>
          <p>{t('feature_history_desc', { 
            defaultValue: 'Track your searches and quickly revisit previous queries.' 
          })}</p>
        </div>

        <div className="feature-card">
          <h3>{t('feature_multilingual_title', { defaultValue: 'Multilingual Support' })}</h3>
          <p>{t('feature_multilingual_desc', { 
            defaultValue: 'Available in English, 日本語, 中文, 한국어, Bahasa Melayu, and தமிழ்.' 
          })}</p>
        </div>
      </div>

      <div className="quick-start">
        <h3>{t('quick_start', { defaultValue: 'Quick Start' })}</h3>
        <ol>
          <li>{t('quick_start_1', { defaultValue: 'Enter your search query in the search box above' })}</li>
          <li>{t('quick_start_2', { defaultValue: 'Click the "?" button for advanced search operators help' })}</li>
          <li>{t('quick_start_3', { defaultValue: 'Enable "Show result explanations" to understand ranking scores' })}</li>
          <li>{t('quick_start_4', { defaultValue: 'Click "View Graph" to visualize result relationships' })}</li>
          <li>{t('quick_start_5', { defaultValue: 'Your search history is saved locally for quick access' })}</li>
        </ol>
      </div>
    </div>
  );
}
