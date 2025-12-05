#!/bin/bash
# Script para iniciar backend e frontend simultaneamente

set -e

echo "🚀 Iniciando servidores de desenvolvimento..."

# Verificar se .env existe
if [ ! -f .env ]; then
    echo "❌ Arquivo .env não encontrado. Execute primeiro: ./scripts/setup-dev.sh"
    exit 1
fi

# Função para limpar processos ao sair
cleanup() {
    echo ""
    echo "🛑 Parando servidores..."
    kill 0
}

trap cleanup EXIT

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Iniciar backend em background
echo -e "${BLUE}[Backend]${NC} Iniciando na porta 8080..."
go run cmd/api/main.go &
BACKEND_PID=$!

# Aguardar backend iniciar
sleep 2

# Iniciar frontend
echo -e "${BLUE}[Frontend]${NC} Iniciando na porta 5173..."
cd frontend
npm run dev
