/* ══════════════════════════════════════════════════════════════════════════
   Entry Point — Hydrates auth state before rendering the app
   ══════════════════════════════════════════════════════════════════════════ */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { useAuthStore } from './store/authStore';
import { ThemeProvider } from './lib/ThemeProvider';

// Hydrate persisted auth state from localStorage before first render
useAuthStore.getState().hydrate();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
);
