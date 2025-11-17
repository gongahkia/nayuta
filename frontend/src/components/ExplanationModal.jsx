import React from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/explanation-modal.css';

export default function ExplanationModal({ explanation, onClose, query }) {
  const { t } = useTranslation();

  if (!explanation) return null;

  const {
    position,
    total_score,
    breakdown,
    matching_terms,
    field_contributions,
    document_stats,
    formula_explanation
  } = explanation;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('why_this_result', { defaultValue: 'Why this result ranked' })} #{position}</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          {/* Total Score */}
          <div className="score-section">
            <h3>{t('total_score', { defaultValue: 'Total BM25 Score' })}</h3>
            <div className="score-display">{total_score.toFixed(4)}</div>
          </div>

          {/* Score Breakdown */}
          <div className="breakdown-section">
            <h3>{t('score_breakdown', { defaultValue: 'Score Breakdown' })}</h3>
            <div className="breakdown-bars">
              <ScoreBar
                label={t('idf_component', { defaultValue: 'IDF Component' })}
                value={breakdown.idf_component}
                max={total_score}
                color="#4CAF50"
                tooltip={t('idf_tooltip', { defaultValue: 'How rare the query terms are' })}
              />
              <ScoreBar
                label={t('length_norm', { defaultValue: 'Length Normalization' })}
                value={breakdown.length_normalization}
                max={1.0}
                color="#2196F3"
                tooltip={t('length_tooltip', { defaultValue: 'Document length adjustment' })}
              />
              <ScoreBar
                label={t('field_boost', { defaultValue: 'Field Boost' })}
                value={breakdown.field_boost}
                max={2.0}
                color="#FF9800"
                tooltip={t('field_tooltip', { defaultValue: 'Title matches get 2x boost' })}
              />
            </div>
          </div>

          {/* Matching Terms */}
          <div className="terms-section">
            <h3>{t('matching_terms', { defaultValue: 'Matching Terms' })}</h3>
            <div className="terms-grid">
              {matching_terms.map((term, idx) => (
                <TermCard key={idx} term={term} />
              ))}
            </div>
          </div>

          {/* Field Contributions */}
          <div className="field-contributions-section">
            <h3>{t('field_contributions', { defaultValue: 'Field Contributions' })}</h3>
            <div className="contributions-chart">
              <div className="contribution-bar">
                <div
                  className="contribution-segment title-segment"
                  style={{ width: `${(field_contributions.title / total_score) * 100}%` }}
                >
                  <span>Title: {field_contributions.title.toFixed(2)}</span>
                </div>
                <div
                  className="contribution-segment content-segment"
                  style={{ width: `${(field_contributions.content / total_score) * 100}%` }}
                >
                  <span>Content: {field_contributions.content.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Document Stats */}
          <div className="stats-section">
            <h3>{t('document_stats', { defaultValue: 'Document Statistics' })}</h3>
            <div className="stats-grid">
              <StatItem
                label={t('content_length', { defaultValue: 'Content Length' })}
                value={`${document_stats.content_length} words`}
              />
              <StatItem
                label={t('title_length', { defaultValue: 'Title Length' })}
                value={`${document_stats.title_length} words`}
              />
              <StatItem
                label={t('avg_length', { defaultValue: 'Average Length' })}
                value={`${Math.round(document_stats.avg_content_length)} words`}
              />
              <StatItem
                label={t('length_ratio', { defaultValue: 'Length Ratio' })}
                value={document_stats.length_ratio}
              />
            </div>
          </div>

          {/* BM25 Formula */}
          <div className="formula-section">
            <h3>{t('bm25_formula', { defaultValue: 'BM25 Formula' })}</h3>
            <div className="formula-box">
              <code>{formula_explanation.formula}</code>
            </div>
            <div className="formula-components">
              <h4>{t('components', { defaultValue: 'Components' })}:</h4>
              <ul>
                {Object.entries(formula_explanation.components).map(([key, desc]) => (
                  <li key={key}>
                    <strong>{key}</strong>: {desc}
                  </li>
                ))}
              </ul>
              <p className="formula-explanation">{formula_explanation.explanation}</p>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="close-btn" onClick={onClose}>
            {t('close', { defaultValue: 'Close' })}
          </button>
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ label, value, max, color, tooltip }) {
  const percentage = (value / max) * 100;

  return (
    <div className="score-bar-container" title={tooltip}>
      <div className="score-bar-label">
        <span>{label}</span>
        <span className="score-bar-value">{value.toFixed(4)}</span>
      </div>
      <div className="score-bar-track">
        <div
          className="score-bar-fill"
          style={{
            width: `${Math.min(percentage, 100)}%`,
            backgroundColor: color
          }}
        />
      </div>
    </div>
  );
}

function TermCard({ term }) {
  const { t } = useTranslation();

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'very_rare': return '#4CAF50';
      case 'rare': return '#8BC34A';
      case 'common': return '#FFC107';
      case 'very_common': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  const getRarityLabel = (rarity) => {
    const labels = {
      'very_rare': t('very_rare', { defaultValue: 'Very Rare' }),
      'rare': t('rare', { defaultValue: 'Rare' }),
      'common': t('common', { defaultValue: 'Common' }),
      'very_common': t('very_common', { defaultValue: 'Very Common' }),
      'not_found': t('not_found', { defaultValue: 'Not Found' })
    };
    return labels[rarity] || rarity;
  };

  return (
    <div className="term-card">
      <div className="term-header">
        <span className="term-text">"{term.term}"</span>
        <span
          className="term-rarity"
          style={{ backgroundColor: getRarityColor(term.rarity) }}
        >
          {getRarityLabel(term.rarity)}
        </span>
      </div>
      <div className="term-stats">
        <div className="term-stat">
          <span className="stat-label">{t('in_content', { defaultValue: 'In Content' })}:</span>
          <span className="stat-value">{term.content_frequency}×</span>
        </div>
        <div className="term-stat">
          <span className="stat-label">{t('in_title', { defaultValue: 'In Title' })}:</span>
          <span className="stat-value">{term.title_frequency}×</span>
        </div>
        <div className="term-stat">
          <span className="stat-label">{t('idf_score', { defaultValue: 'IDF Score' })}:</span>
          <span className="stat-value">{term.idf_score.toFixed(4)}</span>
        </div>
        <div className="term-stat">
          <span className="stat-label">{t('doc_freq', { defaultValue: 'Doc Frequency' })}:</span>
          <span className="stat-value">{term.document_frequency}/{term.total_documents}</span>
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value }) {
  return (
    <div className="stat-item">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}
