import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // 隣のタブの App.tsx を読み込む
import './index.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}