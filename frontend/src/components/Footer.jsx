import React from 'react';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer style={{
      marginTop: '3rem',
      padding: '1.5rem 0',
      textAlign: 'center',
      fontSize: '1rem',
      color: '#888'
    }}>
      {t('made_by', { heart: <span style={{color: 'red', fontSize: '1.2em'}}>♥</span> })}{" "}
      <a href="https://gabrielongzm.com" target="_blank" rel="noopener noreferrer" style={{color: '#006621', textDecoration: 'underline'}}>
        Gabriel Ong
      </a>
      .<br/>
      {t('source_code')} <a href="https://github.com/gongahkia/nayuta" target="_blank" rel="noopener noreferrer" style={{color: '#1a0dab', textDecoration: 'underline'}}>Repo</a>.
    </footer>
  );
}