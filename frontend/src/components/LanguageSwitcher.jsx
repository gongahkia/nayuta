import React from 'react';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'ms', label: 'Melayu' },
  { code: 'zh', label: '中文' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' }
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  return (
    <div style={{ marginBottom: '1rem', textAlign: 'right' }}>
      {languages.map(lang =>
        <button
          key={lang.code}
          onClick={() => i18n.changeLanguage(lang.code)}
          style={{ margin: '0 0.2rem', padding: '0.2rem 0.6rem' }}
        >
          {lang.label}
        </button>
      )}
    </div>
  );
}