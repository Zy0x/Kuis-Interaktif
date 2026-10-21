import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { setupAudioAutoUnlock } from './lib/audio/sharedAudioContext';
import './index.css';

// Aktifkan unlock audio otomatis untuk perangkat mobile & low-end
setupAudioAutoUnlock();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
