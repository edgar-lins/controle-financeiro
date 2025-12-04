// Módulo centralizado para chamar a API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  console.log(`📡 Chamando: ${url}`);
  
  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    console.error(`❌ Erro ao chamar ${url}:`, error);
    throw error;
  }
}

export default API_BASE_URL;
