// Configuração centralizada da API
const isDev = import.meta.env.DEV;
// Em modo dev sempre força localhost para evitar apontar acidentalmente para a API do Render
const API_URL = isDev
  ? (import.meta.env.VITE_API_URL || 'http://localhost:8080')
  : (import.meta.env.VITE_API_URL || 'https://controle-financeiro-api-7oc0.onrender.com');
const ENVIRONMENT = isDev ? 'development' : (import.meta.env.VITE_ENVIRONMENT || 'production');

// Log da configuração em desenvolvimento
if (ENVIRONMENT === 'development') {
  console.log('🔧 Modo:', ENVIRONMENT);
  console.log('🌐 API URL:', API_URL);
}

export { API_URL, ENVIRONMENT };
export default API_URL;
