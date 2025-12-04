import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Configurar URL da API globalmente
window.API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Interceptar fetch para usar API_URL
const originalFetch = window.fetch;
window.fetch = function(...args) {
  let url = args[0];
  if (typeof url === 'string' && url.startsWith('/')) {
    url = window.API_URL + url;
    args[0] = url;
  }
  return originalFetch.apply(this, args);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
