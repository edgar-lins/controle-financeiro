import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Configurar URL da API globalmente
window.API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
// console.log('🌐 API_URL:', window.API_URL);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
