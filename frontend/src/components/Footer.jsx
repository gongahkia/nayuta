import React from 'react';

export default function Footer() {
  return (
    <footer style={{
      marginTop: '3rem',
      padding: '1.5rem 0',
      textAlign: 'center',
      fontSize: '1rem',
      color: '#888'
    }}>
      Made with <span style={{color: 'red', fontSize: '1.2em'}}>♥</span> by{' '}
      <a href="https://gabrielongzm.com" target="_blank" rel="noopener noreferrer" style={{color: '#006621', textDecoration: 'underline'}}>
        Gabriel Ong
      </a>
      .<br/>
      Source code <a href="https://github.com/gongahkia/nayuta" target="_blank" rel="noopener noreferrer" style={{color: '#1a0dab', textDecoration: 'underline'}}>here</a>.
    </footer>
  );
}