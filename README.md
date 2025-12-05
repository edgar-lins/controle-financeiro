# Controle Financeiro

Sistema de controle financeiro pessoal com regra 50/30/20, multi-usuário com autenticação JWT.

## Arquitetura
- **Backend**: Go + PostgreSQL
- **Frontend**: React (Vite) + TailwindCSS
- **Auth**: JWT (bcrypt password hashing)

## 📚 Documentação

> 📖 **[Ver Índice Completo](INDEX.md)** - Navegação facilitada de toda documentação

### 🚀 Começando
- **[Início Rápido](QUICKSTART.md)** - Configure e rode em 5 minutos
- **[Guia de Decisão](GUIDE.md)** - Qual comando/arquivo usar em cada situação

### ⚙️ Configuração
- **[Ambientes](ENVIRONMENTS.md)** - Guia completo dev/prod
- **[Arquitetura](ARCHITECTURE.md)** - Diagramas e estrutura
- **[Scripts](scripts/README.md)** - Automação de tarefas

### 🚢 Deploy
- **[Deploy](DEPLOY.md)** - Instruções de deploy
- **[Changelog](CHANGELOG.md)** - Histórico de mudanças

### 📊 Resumos
- **[Resumo](SUMMARY.md)** - O que foi implementado

## Requisitos
- Go 1.20+
- Node.js 18+ (recomendado 20+)
- PostgreSQL 16
- Docker (opcional, para rodar o banco)

## Setup rápido

### 1. Banco de dados
```bash
# Usando docker-compose (recomendado)
docker-compose up -d

# Ou instale PostgreSQL manualmente e crie o banco
createdb controle_financeiro
```

### 2. Migrations
Aplique as migrations na ordem:
```bash
psql -U postgres -d controle_financeiro -f migrations/001_create_expenses_table.sql
psql -U postgres -d controle_financeiro -f migrations/002_create_incomes_table.sql
psql -U postgres -d controle_financeiro -f migrations/003_create_users_table.sql
psql -U postgres -d controle_financeiro -f migrations/004_add_user_id_to_expenses.sql
psql -U postgres -d controle_financeiro -f migrations/005_add_user_id_to_incomes.sql
psql -U postgres -d controle_financeiro -f migrations/006_create_accounts_table.sql
psql -U postgres -d controle_financeiro -f migrations/007_create_goals_table.sql
psql -U postgres -d controle_financeiro -f migrations/008_add_account_id_to_transactions.sql
psql -U postgres -d controle_financeiro -f migrations/009_add_user_name.sql
```

Ou use um script:
```bash
for f in migrations/*.sql; do
  psql -U postgres -d controle_financeiro -f "$f"
done
```

### 3. Backend
```bash
# Instalar dependências
go mod tidy

# Configurar variáveis de ambiente
cp .env.development .env
# Edite o .env com suas configurações locais

# Rodar
go run cmd/api/main.go
```

Backend roda em `http://localhost:8080`.

**📝 Nota:** Veja [ENVIRONMENTS.md](ENVIRONMENTS.md) para detalhes sobre configuração de ambientes.

### 4. Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend roda em `http://localhost:5173`.

## Funcionalidades

### ✅ MVP Atual
- **Autenticação**: signup/login com JWT, suporte a nome completo do usuário
- **Multi-usuário**: dados isolados por user_id
- **Dashboard**: regra 50/30/20 com gráfico de pizza interativo
- **Gestão de Contas**: múltiplas contas bancárias (corrente, poupança, cartão, investimentos)
- **Gastos e Rendas**: cadastro com vínculo a contas específicas, atualização automática de saldos
- **Metas Financeiras**: criação de objetivos com acompanhamento de progresso e prazo
- **Adicionar dinheiro a metas**: vincular contribuições a contas específicas
- **Edição completa**: editar todas as entidades (contas, gastos, rendas, metas)
- **Filtros**: mês/ano no dashboard
- **Notificações**: sistema de toast com auto-dismiss e animações
- **Exportação CSV**: exportar dados financeiros

### 🔜 Roadmap
- [ ] Autenticação social (Google, GitHub)
- [ ] Exportação PDF de relatórios
- [ ] Análise avançada de gastos por categoria
- [ ] Itens recorrentes (mensalidades automáticas)
- [ ] Contas compartilhadas
- [ ] Notificações por email/push
- [ ] API pública para integrações
- [ ] App mobile (React Native)

## Endpoints

### Auth (público)
- `POST /auth/signup` - criar conta
  ```json
  {"email": "user@example.com", "password": "senha", "first_name": "João", "last_name": "Silva"}
  ```
- `POST /auth/login` - login
  ```json
  {"email": "user@example.com", "password": "senha"}
  ```
  Retorna: `{"token": "jwt...", "first_name": "João", "last_name": "Silva"}`

### Protegidos (requer `Authorization: Bearer <token>`)

#### Summary
- `GET /summary?month=11&year=2025` - resumo financeiro com regra 50/30/20

#### Expenses (Gastos)
- `GET /expenses` - listar gastos
- `POST /expenses` - criar gasto (com account_id opcional)
- `PUT /expenses/update?id=1` - atualizar gasto
- `DELETE /expenses/delete?id=1` - deletar gasto

#### Incomes (Rendas)
- `GET /incomes` - listar rendas
- `POST /incomes` - criar renda (com account_id opcional)
- `PUT /incomes/update?id=1` - atualizar renda
- `DELETE /incomes/delete?id=1` - deletar renda

#### Accounts (Contas)
- `GET /accounts` - listar contas
- `POST /accounts` - criar conta
- `PUT /accounts/update?id=1` - atualizar conta
- `DELETE /accounts/delete?id=1` - deletar conta

#### Goals (Metas)
- `GET /goals` - listar metas
- `POST /goals` - criar meta
- `PUT /goals/update?id=1` - atualizar meta
- `PUT /goals/add-money?id=1` - adicionar dinheiro a meta (vincula a conta)
- `DELETE /goals/delete?id=1` - deletar meta

## Estrutura
```
.
├── cmd/api/main.go          # Entrypoint
├── internal/
│   ├── database/            # Conexão PostgreSQL
│   ├── handlers/            # Handlers HTTP
│   │   ├── auth_handler.go
│   │   ├── expense_handler.go
│   │   ├── income.handler.go
│   │   ├── account_handler.go
│   │   ├── goal_handler.go
│   │   └── summary_handler.go
│   ├── middleware/          # JWT auth middleware
│   ├── models/              # Structs (User, Expense, Income, Account, Goal)
│   └── routes/              # Rotas
├── migrations/              # SQL migrations (001-009)
├── frontend/                # React app
│   ├── src/
│   │   ├── components/      # Toast, AccountTypeSelect, CurrencyInput
│   │   ├── styles/          # DashboardCharts
│   │   ├── utils/           # format.js (formatCurrencyBR)
│   │   ├── Dashboard.jsx
│   │   ├── Accounts.jsx
│   │   ├── Expenses.jsx
│   │   ├── Incomes.jsx
│   │   ├── Goals.jsx
│   │   └── Login.jsx
│   └── tailwind.config.js
└── docker-compose.yml
```

## Deploy

### Opção 1: Manual
- Deploy backend em um servidor (VPS, Fly.io, Railway)
- Deploy frontend em Vercel/Netlify
- PostgreSQL gerenciado (Supabase, Neon, AWS RDS)

### Opção 2: Docker
```bash
# TODO: adicionar Dockerfile para backend e frontend
docker-compose up --build
```

## Variáveis de ambiente
- `JWT_SECRET`: secret para assinar JWT (default: `dev-secret-change-me`)
- `DATABASE_URL`: string de conexão PostgreSQL

## Contribuir
Pull requests são bem-vindos! Para grandes mudanças, abra uma issue primeiro.

## Licença
MIT
