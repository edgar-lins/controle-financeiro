#!/bin/bash
# Script para iniciar o ambiente de desenvolvimento completo

set -e

echo "🚀 Iniciando ambiente de desenvolvimento..."

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar se .env existe
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env..."
    cp .env.development .env
    echo -e "${GREEN}✅ Arquivo .env criado. Configure suas credenciais se necessário.${NC}"
fi

# Verificar PostgreSQL
echo "🔍 Verificando PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL não encontrado. Instale com: brew install postgresql"
    exit 1
fi

# Verificar se o banco está rodando
if ! pg_isready &> /dev/null; then
    echo "⚠️  PostgreSQL não está rodando. Iniciando..."
    brew services start postgresql || docker-compose up -d
fi

# Verificar se o banco existe
DB_NAME=$(grep DB_NAME .env | cut -d '=' -f2)
if ! psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo "📦 Criando banco de dados $DB_NAME..."
    createdb "$DB_NAME"
    
    echo "🔄 Aplicando migrations..."
    for migration in migrations/*.sql; do
        echo "  - Aplicando $(basename $migration)..."
        psql -d "$DB_NAME" -f "$migration" -q
    done
    echo -e "${GREEN}✅ Migrations aplicadas${NC}"
fi

# Instalar dependências do backend se necessário
if [ ! -d "vendor" ]; then
    echo "📦 Instalando dependências Go..."
    go mod tidy
fi

# Instalar dependências do frontend se necessário
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Instalando dependências do frontend..."
    cd frontend
    npm install
    cd ..
fi

echo ""
echo -e "${GREEN}✅ Ambiente pronto!${NC}"
echo ""
echo -e "${BLUE}Para iniciar os servidores:${NC}"
echo ""
echo "  Backend:  go run cmd/api/main.go"
echo "  Frontend: cd frontend && npm run dev"
echo ""
echo "Ou use: ./scripts/start-dev.sh"
