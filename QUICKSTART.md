# 🚀 Quick Start - Controle Financeiro

## Primeira vez? Siga estes passos:

### 1️⃣ Setup Inicial (apenas uma vez)

```bash
# Clone o repositório (se ainda não fez)
git clone https://github.com/seu-usuario/controle-financeiro.git
cd controle-financeiro

# Execute o script de setup
./scripts/setup-dev.sh
```

Este script irá:
- ✅ Criar arquivo `.env` de desenvolvimento
- ✅ Verificar e iniciar PostgreSQL
- ✅ Criar o banco de dados
- ✅ Aplicar todas as migrations
- ✅ Instalar dependências do backend e frontend

---

### 2️⃣ Desenvolvimento Diário

**Opção A: Script automático (recomendado)**
```bash
./scripts/start-dev.sh
```
Inicia backend e frontend simultaneamente.

**Opção B: Manual (em terminais separados)**
```bash
# Terminal 1 - Backend
go run cmd/api/main.go

# Terminal 2 - Frontend
cd frontend
npm run dev
```

---

### 3️⃣ Acessar a Aplicação

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8080

---

## 🔧 Comandos Úteis

### Backend (Go)
```bash
# Rodar servidor
go run cmd/api/main.go

# Build
go build -o api cmd/api/main.go

# Instalar dependências
go mod tidy

# Rodar com variáveis específicas
ENVIRONMENT=production PORT=3000 go run cmd/api/main.go
```

### Frontend (React)
```bash
cd frontend

# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build de produção
npm run preview

# Lint
npm run lint
```

### Database
```bash
# Conectar ao banco
psql -d controle_financeiro

# Aplicar migration específica
psql -d controle_financeiro -f migrations/001_create_expenses_table.sql

# Aplicar todas as migrations
for f in migrations/*.sql; do psql -d controle_financeiro -f "$f"; done

# Backup
pg_dump controle_financeiro > backup.sql

# Restore
psql -d controle_financeiro < backup.sql
```

---

## 🌍 Ambientes

### Desenvolvimento Local
Usa `.env` ou `.env.development`:
- Banco: localhost PostgreSQL
- CORS: permite localhost
- JWT: chave simples

### Produção (Render + Vercel)
Usa variáveis de ambiente do serviço:
- Banco: Render PostgreSQL
- CORS: URLs específicas
- JWT: chave forte gerada

Ver [ENVIRONMENTS.md](ENVIRONMENTS.md) para detalhes.

---

## 🐛 Resolução de Problemas

### Backend não inicia
```bash
# Verificar se PostgreSQL está rodando
pg_isready

# Verificar variáveis de ambiente
cat .env

# Ver logs completos
go run cmd/api/main.go 2>&1 | tee logs.txt
```

### Frontend não conecta à API
```bash
# Verificar URL da API (deve aparecer no console do navegador)
# Abra DevTools -> Console

# Verificar arquivo .env
cat frontend/.env.development

# Limpar cache e rebuild
cd frontend
rm -rf node_modules dist
npm install
npm run dev
```

### Erro de CORS
Adicione a URL do frontend em `ALLOWED_ORIGINS` no `.env`:
```env
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Erro de conexão com banco
```bash
# Verificar se o banco existe
psql -l | grep controle_financeiro

# Recriar banco (⚠️ apaga todos os dados!)
dropdb controle_financeiro
createdb controle_financeiro
for f in migrations/*.sql; do psql -d controle_financeiro -f "$f"; done
```

---

## 📦 Deploy

### Frontend (Vercel)
```bash
cd frontend
npm run build
vercel --prod
```

Ou configure deploy automático no GitHub.

### Backend (Render)
1. Push para GitHub
2. Render detecta mudanças e faz deploy automático
3. Configure variáveis de ambiente no dashboard

Ver [DEPLOY.md](DEPLOY.md) para detalhes.

---

## 📚 Mais Informações

- [ENVIRONMENTS.md](ENVIRONMENTS.md) - Configuração detalhada de ambientes
- [DEPLOY.md](DEPLOY.md) - Guia de deploy
- [README.md](README.md) - Documentação completa da API

---

## 💡 Dicas

1. **Use os scripts**: `./scripts/setup-dev.sh` e `./scripts/start-dev.sh`
2. **Não commite .env**: Apenas `.env.example` e `.env.development`
3. **Teste antes de fazer deploy**: `npm run build && npm run preview`
4. **Mantenha migrations organizadas**: Numere sequencialmente
5. **Use branches**: Trabalhe em features separadas e faça merge

---

## 🆘 Precisa de Ajuda?

1. Leia a documentação completa em [README.md](README.md)
2. Verifique [ENVIRONMENTS.md](ENVIRONMENTS.md) para problemas de configuração
3. Procure por erros similares no console do navegador
4. Verifique logs do backend no terminal
