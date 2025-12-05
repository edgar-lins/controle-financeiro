#!/bin/bash
# Script para build de produção

set -e

echo "🏗️  Iniciando build de produção..."

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Build do backend
echo -e "${BLUE}[Backend]${NC} Compilando..."
go build -o api cmd/api/main.go
echo -e "${GREEN}✅ Backend compilado: ./api${NC}"

# Build do frontend
echo -e "${BLUE}[Frontend]${NC} Compilando..."
cd frontend
npm run build
echo -e "${GREEN}✅ Frontend compilado: ./frontend/dist${NC}"
cd ..

echo ""
echo -e "${GREEN}🎉 Build completo!${NC}"
echo ""
echo -e "${YELLOW}Arquivos gerados:${NC}"
echo "  Backend:  ./api"
echo "  Frontend: ./frontend/dist"
echo ""
echo -e "${BLUE}Para testar localmente:${NC}"
echo "  1. Configure .env com ENVIRONMENT=production"
echo "  2. Execute: ./api"
echo "  3. Sirva frontend: cd frontend && npm run preview"
