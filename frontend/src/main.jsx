import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Interceptor global: detecta 401 em rotas autenticadas e força logout
const _originalFetch = window.fetch;
window.fetch = async (...args) => {
  const response = await _originalFetch(...args);
  if (response.status === 401) {
    const url = (typeof args[0] === 'string' ? args[0] : args[0]?.url) ?? '';
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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
