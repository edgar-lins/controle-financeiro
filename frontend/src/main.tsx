import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Interceptor global: detecta 401 em rotas autenticadas e força logout
const _originalFetch = window.fetch;
window.fetch = async (...args) => {
  const response = await _originalFetch(...args);
  if (response.status === 401) {
    const first = args[0];
    const url = typeof first === 'string'
      ? first
      : first instanceof URL
        ? first.href
        : first instanceof Request
          ? first.url
          : '';
    // Ignora endpoints públicos de auth para não interferir com login/signup
    if (!url.includes('/auth/')) {
      localStorage.removeItem('token');
      localStorage.removeItem('firstName');
      localStorage.removeItem('lastName');
      localStorage.setItem('session_expired', 'true');
      window.location.href = '/';
    }
  }
  return response;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
