# 🌍 Guia de Ambientes - Desenvolvimento e Produção

Este guia explica como configurar e trabalhar com diferentes ambientes (desenvolvimento e produção) no projeto.

## 📋 Índice

1. [Estrutura de Arquivos](#estrutura-de-arquivos)
2. [Configuração Inicial](#configuração-inicial)
3. [Desenvolvimento Local](#desenvolvimento-local)
4. [Deploy para Produção](#deploy-para-produção)
5. [Variáveis de Ambiente](#variáveis-de-ambiente)

---

## 📁 Estrutura de Arquivos

### Backend (Go)
```
.env.example           # Template com todas as variáveis
.env.development       # Configurações de desenvolvimento (commitado)
.env                   # Configurações locais (NÃO commitado)
```

### Frontend (React/Vite)
```
frontend/.env.example        # Template com todas as variáveis
frontend/.env.development    # Configurações de desenvolvimento
frontend/.env.production     # Configurações de produção
```

---

## ⚙️ Configuração Inicial

### 1. Backend (Go)

Crie seu arquivo `.env` local baseado no `.env.development`:

```bash
cp .env.development .env
```

Ajuste as configurações no `.env` conforme necessário:

```env
ENVIRONMENT=development
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui
DB_NAME=controle_financeiro
PORT=8080
JWT_SECRET=dev_secret_key_123
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 2. Frontend (React)

O Vite carrega automaticamente os arquivos `.env.development` e `.env.production` baseado no modo de build.

Para desenvolvimento local, você pode criar um `.env.local` se precisar sobrescrever alguma configuração:

```bash
cd frontend
cp .env.example .env.local
```

---

## 💻 Desenvolvimento Local

### Iniciando o Backend

```bash
# Com o arquivo .env configurado
go run cmd/api/main.go
```

O servidor irá:
- Carregar `.env.development` primeiro
- Carregar `.env` (sobrescreve valores se existir)
- Iniciar na porta definida em `PORT` (padrão: 8080)
- Mostrar o ambiente: `🚀 Iniciando servidor em modo: development`

### Iniciando o Frontend

```bash
cd frontend
npm run dev
```

O Vite irá:
- Carregar automaticamente `.env.development`
- Usar `VITE_API_URL=http://localhost:8080`
- Iniciar na porta 5173

---

## 🚀 Deploy para Produção

### Backend (Render/Heroku)

Configure as seguintes variáveis de ambiente no painel do Render:

```env
ENVIRONMENT=production
DATABASE_URL=postgresql://usuario:senha@host:porta/dbname
PORT=8080
JWT_SECRET=seu_jwt_super_secreto_forte_aqui
ALLOWED_ORIGINS=https://seu-frontend.vercel.app
```

**⚠️ IMPORTANTE:** 
- Use um `JWT_SECRET` forte e único para produção
- Adicione todas as URLs do frontend em `ALLOWED_ORIGINS`

### Frontend (Vercel)

O arquivo `.env.production` já está configurado:

```env
VITE_API_URL=https://controle-financeiro-api-7oc0.onrender.com
VITE_ENVIRONMENT=production
```

Para fazer deploy:

```bash
cd frontend
npm run build  # Usa automaticamente .env.production
```

Ou pelo Vercel CLI:

```bash
vercel --prod
```

---

## 🔐 Variáveis de Ambiente

### Backend

| Variável | Descrição | Obrigatória | Padrão |
|----------|-----------|-------------|--------|
| `ENVIRONMENT` | Ambiente atual (development/production) | Não | development |
| `DB_HOST` | Host do banco (dev) | Sim* | localhost |
| `DB_PORT` | Porta do banco (dev) | Sim* | 5432 |
| `DB_USER` | Usuário do banco (dev) | Sim* | - |
| `DB_PASSWORD` | Senha do banco (dev) | Sim* | - |
| `DB_NAME` | Nome do banco (dev) | Sim* | - |
| `DATABASE_URL` | URL completa do banco (prod) | Sim** | - |
| `PORT` | Porta do servidor | Não | 8080 |
| `JWT_SECRET` | Chave secreta para JWT | Sim | - |
| `ALLOWED_ORIGINS` | URLs permitidas (CORS) | Não | localhost |

\* Obrigatório em desenvolvimento  
\** Obrigatório em produção (substitui as variáveis individuais)

### Frontend

| Variável | Descrição | Obrigatória | Padrão |
|----------|-----------|-------------|--------|
| `VITE_API_URL` | URL da API backend | Não | http://localhost:8080 |
| `VITE_ENVIRONMENT` | Ambiente atual | Não | development |

---

## 🔄 Workflow de Desenvolvimento

### 1. Trabalhando em uma nova feature

```bash
# 1. Certifique-se que está no ambiente de desenvolvimento
cat .env | grep ENVIRONMENT  # deve mostrar development

# 2. Inicie o backend
go run cmd/api/main.go

# 3. Em outro terminal, inicie o frontend
cd frontend
npm run dev

# 4. Faça suas alterações e teste localmente
```

### 2. Preparando para deploy

```bash
# 1. Teste o build de produção do frontend localmente
cd frontend
npm run build
npm run preview  # Testa a versão de produção localmente

# 2. Commit suas alterações
git add .
git commit -m "feat: sua nova feature"
git push origin main

# 3. O deploy automático irá disparar
# - Vercel: frontend
# - Render: backend
```

---

## 🐛 Troubleshooting

### Backend não conecta ao banco

Verifique se as variáveis estão corretas:
```bash
cat .env
```

Teste a conexão manual:
```bash
psql -h localhost -U postgres -d controle_financeiro
```

### CORS bloqueando requisições

Certifique-se que a URL do frontend está em `ALLOWED_ORIGINS`:
```env
ALLOWED_ORIGINS=http://localhost:5173,https://seu-frontend.vercel.app
```

### Frontend não encontra a API

Verifique o console do navegador e confirme a URL:
```javascript
// No DevTools Console
console.log(import.meta.env.VITE_API_URL)
```

---

## 📝 Boas Práticas

1. **NUNCA** commite arquivos `.env` com secrets reais
2. Mantenha `.env.example` sempre atualizado
3. Use `JWT_SECRET` forte em produção (mínimo 32 caracteres)
4. Documente novas variáveis de ambiente neste README
5. Teste builds de produção localmente antes do deploy
6. Use variáveis separadas para cada serviço (BD, APIs externas, etc)

---

## 🔗 Links Úteis

- [Documentação Vite - Env Variables](https://vitejs.dev/guide/env-and-mode.html)
- [godotenv - Go Package](https://github.com/joho/godotenv)
- [Render Docs - Environment Variables](https://render.com/docs/environment-variables)
- [Vercel Docs - Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
