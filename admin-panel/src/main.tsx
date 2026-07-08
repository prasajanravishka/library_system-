/* ══════════════════════════════════════════════════════════════════════════
   Entry Point — Hydrates auth state before rendering the app
   ══════════════════════════════════════════════════════════════════════════ */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { useAuthStore } from './store/authStore';
import { ThemeProvider } from './lib/ThemeProvider';

// Hydrate persisted auth state from localStorage before the first render
// This ensures that the user's session is restored immediately on load
useAuthStore.getState().hydrate();

// Initialize the React application and render it into the root DOM element
createRoot(document.getElementById('root')!).render(
  // StrictMode highlights potential problems in the application during development
  <StrictMode>
    {/* ThemeProvider manages the global theme state (e.g., light/dark mode) */}
    <ThemeProvider>
      {/* App is the root component containing all routing and layout logic */}
      <App />
    </ThemeProvider>
  </StrictMode>
);
