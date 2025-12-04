# Controle Financeiro

Sistema de controle financeiro pessoal com regra 50/30/20, multi-usuário com autenticação JWT.

## Arquitetura
- **Backend**: Go + PostgreSQL
- **Frontend**: React (Vite) + TailwindCSS
- **Auth**: JWT (bcrypt password hashing)

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

# Configurar JWT_SECRET (opcional, usa default em dev)
export JWT_SECRET="seu-secret-aqui"

# Rodar
go run cmd/api/main.go
```

Backend roda em `http://localhost:8080`.

### 4. Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend roda em `http://localhost:5173`.

## Funcionalidades

### ✅ MVP Atual
- Autenticação (signup/login com JWT)
- Multi-usuário (dados isolados por user_id)
- Dashboard com regra 50/30/20
- Cadastro de gastos e rendas
- Filtros de mês/ano
- Exportação CSV

### 🔜 Roadmap (Monetização)
- [ ] Autenticação social (Google, GitHub)
- [ ] Exportação PDF de relatórios
- [ ] Análise de gastos por categoria (gráficos)
- [ ] Metas e objetivos financeiros
- [ ] Itens recorrentes (mensalidades)
- [ ] Contas compartilhadas
- [ ] Notificações (email/push)
- [ ] API pública para integrações

## Endpoints

### Auth (público)
- `POST /auth/signup` - criar conta
  ```json
  {"email": "user@example.com", "password": "senha"}
  ```
- `POST /auth/login` - login
  ```json
  {"email": "user@example.com", "password": "senha"}
  ```
  Retorna: `{"token": "jwt..."}`

### Protegidos (requer `Authorization: Bearer <token>`)
- `GET /summary?month=11&year=2025` - resumo financeiro
- `GET /expenses` - listar gastos
- `POST /expenses` - criar gasto
- `DELETE /expenses/delete?id=1` - deletar gasto
- `GET /incomes` - listar rendas
- `POST /incomes` - criar renda
- `DELETE /incomes/delete?id=1` - deletar renda

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
│   │   └── summary_handler.go
│   ├── middleware/          # JWT auth middleware
│   ├── models/              # Structs
│   └── routes/              # Rotas
├── migrations/              # SQL migrations
├── frontend/                # React app
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
