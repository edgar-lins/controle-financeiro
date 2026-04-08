# Conto

Aplicativo pessoal de controle financeiro com regra 50/30/20, suporte a múltiplas contas, cartão de crédito e metas financeiras.

**Stack:** Go · PostgreSQL · React (Vite) · TailwindCSS

---

## Requisitos

- Go 1.21+
- Node.js 18+
- PostgreSQL 16+

---

## Setup local

### 1. Clone e configure as variáveis de ambiente

```bash
git clone <repo>
cd controle-financeiro

cp .env.example .env
# Edite o .env com suas configurações locais
```

```bash
cd frontend
cp .env.example .env.development
# Edite se necessário (padrão já aponta para localhost:8080)
```

### 2. Banco de dados

```bash
createdb controle_financeiro
```

> As migrations rodam automaticamente na inicialização do servidor.

### 3. Backend

```bash
go mod tidy
go run cmd/api/main.go
# Rodando em http://localhost:8080
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
# Rodando em http://localhost:5173
```

---

## Variáveis de ambiente

### Backend (`.env`)

| Variável | Descrição | Obrigatória em prod |
|----------|-----------|---------------------|
| `ENVIRONMENT` | `development` ou `production` | Sim |
| `DB_HOST` | Host do PostgreSQL | Sim (ou `DATABASE_URL`) |
| `DB_PORT` | Porta do PostgreSQL | Sim |
| `DB_USER` | Usuário do banco | Sim |
| `DB_PASSWORD` | Senha do banco | Sim |
| `DB_NAME` | Nome do banco | Sim |
| `DATABASE_URL` | URL completa (Render/Railway) — substitui as vars acima | — |
| `PORT` | Porta do servidor HTTP (padrão: `8080`) | Não |
| `JWT_SECRET` | Chave para assinar tokens JWT | **Sim** |
| `ALLOWED_ORIGINS` | Origens CORS permitidas (separadas por vírgula) | **Sim** |
| `RESEND_API_KEY` | API key do [Resend](https://resend.com) para envio de email | Recomendada |
| `RESEND_FROM_EMAIL` | Endereço de envio (domínio verificado no Resend) | Recomendada |
| `APP_URL` | URL pública do frontend (usada no link de reset de senha) | Recomendada |

> Sem `RESEND_API_KEY`, o link de reset de senha é apenas logado no console (útil para desenvolvimento).

### Frontend (`frontend/.env.development` / `.env.production`)

| Variável | Descrição |
|----------|-----------|
| `VITE_API_URL` | URL base da API Go |

---

## Estrutura do projeto

```
.
├── cmd/api/main.go              # Entrypoint do servidor
├── internal/
│   ├── database/                # Conexão e execução de migrations
│   ├── handlers/                # Handlers HTTP
│   │   ├── auth_handler.go      # Signup, login, reset de senha, exclusão de conta
│   │   ├── expense_handler.go
│   │   ├── income.handler.go
│   │   ├── account_handler.go   # Contas, transferências
│   │   ├── goal_handler.go
│   │   ├── summary_handler.go
│   │   └── preferences_handler.go
│   ├── middleware/              # JWT auth
│   ├── models/                  # Structs de domínio
│   └── routes/                  # Registro de rotas
├── migrations/                  # SQL migrations (rodam automaticamente)
├── frontend/
│   ├── src/
│   │   ├── components/          # Componentes reutilizáveis
│   │   ├── hooks/               # useAccounts
│   │   ├── config/              # api.js (URL base)
│   │   ├── utils/               # format.js
│   │   ├── constants.js         # PAYMENT_METHODS, EXPENSE_GROUPS
│   │   ├── App.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Expenses.jsx
│   │   ├── Incomes.jsx
│   │   ├── Accounts.jsx
│   │   ├── Goals.jsx
│   │   ├── Settings.jsx
│   │   ├── Login.jsx
│   │   └── ResetPassword.jsx
│   ├── .env.development
│   └── .env.production
├── .env.example                 # Template de variáveis de ambiente
└── docker-compose.yml
```

---

## API — Endpoints

### Públicos

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/auth/signup` | Criar conta |
| `POST` | `/auth/login` | Login (retorna JWT) |
| `POST` | `/auth/forgot-password` | Solicitar reset de senha |
| `POST` | `/auth/reset-password` | Redefinir senha com token |

### Autenticados (`Authorization: Bearer <token>`)

| Método | Rota | Descrição |
|--------|------|-----------|
| `DELETE` | `/auth/delete-account` | Excluir conta e todos os dados |
| `GET` | `/summary` | Resumo financeiro do mês |
| `GET/POST` | `/expenses` | Listar / criar gastos |
| `PUT` | `/expenses/update?id=` | Atualizar gasto |
| `DELETE` | `/expenses/delete?id=` | Deletar gasto |
| `GET/POST` | `/incomes` | Listar / criar rendas |
| `PUT` | `/incomes/update?id=` | Atualizar renda |
| `DELETE` | `/incomes/delete?id=` | Deletar renda |
| `GET/POST` | `/accounts` | Listar / criar contas |
| `PUT` | `/accounts/update?id=` | Atualizar conta |
| `DELETE` | `/accounts/delete?id=` | Deletar conta |
| `POST` | `/accounts/transfer` | Transferência entre contas |
| `GET/POST` | `/goals` | Listar / criar metas |
| `PUT` | `/goals/update?id=` | Atualizar meta |
| `PUT` | `/goals/add-money?id=` | Adicionar valor à meta |
| `DELETE` | `/goals/delete?id=` | Deletar meta |
| `GET/PUT` | `/preferences` | Preferências do usuário |

---

## Deploy

O projeto está configurado para **Render** (backend + banco) e **Vercel** (frontend).

### Backend — Render

1. Crie um Web Service apontando para este repositório
2. Build command: `go build -o api ./cmd/api`
3. Start command: `./api`
4. Configure todas as variáveis do `.env.example` no painel do Render
5. Crie um PostgreSQL no Render e use a `DATABASE_URL` gerada

### Frontend — Vercel

1. Importe o repositório e defina o **Root Directory** como `frontend`
2. Framework: Vite
3. Adicione a variável `VITE_API_URL` com a URL do seu backend no Render

> As migrations rodam automaticamente no primeiro `go run` / startup do servidor.

---

## Funcionalidades

- Autenticação JWT com bcrypt, rate limiting e reset de senha por email
- Dashboard com gráfico 50/30/20 e resumo por grupo de gastos
- Gastos e rendas com vínculo a contas, filtro por mês/ano
- Múltiplas contas (corrente, poupança, cartão de crédito, investimentos, dinheiro)
- Cartão de crédito: fatura, limite disponível e fluxo de pagamento
- Transferências entre contas
- Metas financeiras com progresso
- Exportação de dados
- Empty state de boas-vindas para novos usuários
- Detecção de sessão expirada com redirect automático
- Exclusão de conta com confirmação
