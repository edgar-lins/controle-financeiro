// Configuração centralizada da API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ENVIRONMENT = import.meta.env.VITE_ENVIRONMENT || 'development';

// Log da configuração em desenvolvimento
if (ENVIRONMENT === 'development') {
  console.log('🔧 Modo:', ENVIRONMENT);
  console.log('🌐 API URL:', API_URL);
}

export { API_URL, ENVIRONMENT };
export default API_URL;
