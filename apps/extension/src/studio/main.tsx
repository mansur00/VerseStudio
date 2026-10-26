import React from 'react';
import ReactDOM from 'react-dom/client';
import { StudioApp } from './StudioApp';
import '@verse-studio/tokens/css';
import './studio.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <StudioApp />
  </React.StrictMode>
);
