import React from 'react';

export default function ResultsList({ results }) {
  return (
    <div className="results-container">
      {results.map((result, index) => (
        <div key={index} className="result-item">
          <a href={result.url} className="result-url">{result.url}</a>
          <h3 className="result-title">{result.title || 'Untitled Document'}</h3>
          <p className="result-snippet">{result.snippet}</p>
        </div>
      ))}
    </div>
  );
}