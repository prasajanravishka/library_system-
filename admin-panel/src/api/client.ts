/* ══════════════════════════════════════════════════════════════════════════
   Axios Client — Centralized HTTP client with JWT & API Key interceptors
   ══════════════════════════════════════════════════════════════════════════ */

import axios from 'axios';

// Resolve base API URL from environment variables or fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';
// Resolve API Key for authentication from environment variables or fallback to default
const API_KEY = import.meta.env.VITE_API_KEY || 'LIBRARY_SECRET_API_KEY_2026';

/**
 * Configured Axios HTTP client instance.
 * All API requests should be routed through this client.
 */
const client = axios.create({
  baseURL: API_URL,
  timeout: 15000, // 15 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY, // Inject API key into all outgoing requests
  },
});

// ── Request Interceptor: Inject JWT ─────────────────────────────────────────
/**
 * Intercepts outgoing requests to dynamically inject the JWT token 
 * from local storage into the Authorization header.
 */
client.interceptors.request.use(
  (config) => {
    // Retrieve admin authentication token from local storage
    const token = localStorage.getItem('admin_token');
    // If token exists, attach it as a Bearer token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  // Handle request preparation errors
  (error) => Promise.reject(error)
);

// ── Response Interceptor: Handle 401 ────────────────────────────────────────
/**
 * Intercepts incoming responses to globally handle authentication failures (401).
 * Automatically logs out the user and redirects to the login page on token expiry.
 */
client.interceptors.response.use(
  // Pass successful responses through seamlessly
  (response) => response,
  (error) => {
    // Check if the error is due to an unauthorized status code
    if (error.response?.status === 401) {
      // Token expired or invalid — clear auth state and redirect
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      // Redirect application to login route
      window.location.href = '/login';
    }
    // Forward the error for specific handler catch blocks
    return Promise.reject(error);
  }
);

export default client;
