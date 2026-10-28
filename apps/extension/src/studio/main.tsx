import React from 'react';
import ReactDOM from 'react-dom/client';
import { StudioApp } from './StudioApp';
import { ExportMuxer } from '../recording/exportMuxer';
import '@verse-studio/tokens/css';
import './studio.css';

if (typeof window !== 'undefined') {
  (window as any).__EXPORT_MUXER__ = ExportMuxer;
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <StudioApp />
  </React.StrictMode>
);
