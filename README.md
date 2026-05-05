# 🌱 Broto — Controle Financeiro Pessoal

> *Cuide do que você planta.*

Broto é um app de controle financeiro pessoal baseado na **regra 50/30/20**, construído para quem quer sair da planilha sem abrir mão do controle real sobre o dinheiro. Nasceu de uma planilha com tabelas de gastos fixos, parcelamentos e gastos variados — e evoluiu para um app completo com múltiplas contas, metas financeiras, cartão de crédito e muito mais.

---

## Funcionalidades

| Área | O que faz |
|---|---|
| **50/30/20** | Divide gastos em Essenciais / Estilo de Vida / Investimento com orçamento baseado no salário |
| **Salário + Renda Extra** | Salário fixo configurado em Preferências; rendas eventuais (freelance, bônus) registradas separadamente |
| **Gastos** | CRUD completo com categoria, grupo, forma de pagamento, conta vinculada |
| **Parcelamentos** | Divide compras em até 48x com datas sequenciais e rastreamento de parcelas pagas |
| **Gastos Fixos** | Marque um gasto como recorrente — ele aparece todo mês aguardando confirmação |
| **Lançamento Rápido** | Registre um gasto com apenas 3 campos (valor, categoria, conta) com grupo inferido automaticamente |
| **Contas** | Corrente, poupança, cartão de crédito (fatura + limite), investimento e dinheiro físico |
| **Transferências** | Move saldo entre contas sem impactar receitas/despesas |
| **Metas** | Objetivos com progresso, prazo e aportes vinculados ao orçamento de Investimento |
| **Dashboard** | Patrimônio total, donut 50/30/20, progresso por grupo, fixos pendentes, atividade recente |
| **Histórico** | Gráfico de 12 meses com evolução de receitas, despesas e saldo |
| **Reset de Senha** | Fluxo completo via email (Resend) com token de 1 hora |
| **Exportação** | Relatório completo em CSV |

---

## Stack

### Backend
- **Go 1.24** — API REST, sem framework, stdlib nativa
- **PostgreSQL 16** — banco de dados relacional
- **JWT (HS256)** — autenticação stateless
- **bcrypt** — hash de senhas (custo 10)
- **log/slog** — logs estruturados (JSON em produção, texto em dev)
- **Resend** — envio de emails transacionais (opcional)

### Frontend
- **React 19** + **TypeScript 5.7** — UI
- **Vite 7** — build tool
- **Tailwind CSS 3** — estilização
- **Recharts** — gráficos
- **React Router 6** — navegação
- **Geist** — tipografia

### Infraestrutura
- **Render** — backend (Go)
- **Vercel** — frontend (React)
- **Docker Compose** — banco local em desenvolvimento

---

## Arquitetura

```
controle-financeiro/
├── cmd/api/main.go              # Entrypoint — middlewares, startup
├── internal/
│   ├── database/                # Conexão e migrations automáticas
│   ├── handlers/                # Handlers HTTP por domínio
│   ├── middleware/              # Auth JWT com invalidação pós-troca de senha
│   ├── models/                  # Structs de domínio
│   ├── routes/                  # Registro de rotas
│   ├── logger/                  # Configuração do slog
│   └── testhelpers/             # Utilitários para testes de integração
├── migrations/                  # 23 migrations SQL (executadas no startup)
├── frontend/
│   ├── src/
│   │   ├── components/          # Componentes reutilizáveis
│   │   ├── hooks/               # Custom hooks
│   │   ├── config/              # URL da API
│   │   ├── types.ts             # Tipos de domínio TypeScript
│   │   └── *.tsx                # Páginas
│   ├── tailwind.config.js       # Design system Broto
│   └── tsconfig.json
├── docker-compose.yml           # PostgreSQL local
├── render.yaml                  # Deploy Render
└── .env.example                 # Template de variáveis de ambiente
```

**Fluxo de request:**
```
Cliente → requestLogger → maxBytesReader (1MB) → CORS → WithAuth (JWT + DB) → Handler
```

---

## Setup Local

### Pré-requisitos
- Go 1.24+
- Node.js 20+
- PostgreSQL 16+ (ou Docker)

### 1. Clone e variáveis de ambiente

```bash
git clone https://github.com/edgar-lins/controle-financeiro.git
cd controle-financeiro

# Backend
cp .env.example .env
# Edite .env com suas credenciais do banco e JWT_SECRET

# Frontend
cd frontend
cp .env.example .env.development
```

### 2. Banco de dados

**Com Docker (recomendado):**
```bash
docker compose up -d
```

**PostgreSQL local:**
```bash
createdb controle_financeiro
```

> As migrations rodam automaticamente no startup do servidor.

### 3. Backend

```bash
go mod tidy
go run cmd/api/main.go
# Servidor em http://localhost:8080
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
# App em http://localhost:5173
```

---

## Variáveis de Ambiente

### Backend (`.env`)

| Variável | Descrição | Obrigatória em prod |
|---|---|:---:|
| `ENVIRONMENT` | `development` ou `production` | ✅ |
| `DATABASE_URL` | URL completa do banco (Render/Railway) — substitui as vars abaixo | — |
| `DB_HOST` | Host do PostgreSQL | ✅ |
| `DB_PORT` | Porta (padrão: `5432`) | ✅ |
| `DB_USER` | Usuário do banco | ✅ |
| `DB_PASSWORD` | Senha do banco | ✅ |
| `DB_NAME` | Nome do banco | ✅ |
| `PORT` | Porta do servidor (padrão: `8080`) | — |
| `JWT_SECRET` | Chave de assinatura JWT — **obrigatória em produção** | ✅ |
| `ALLOWED_ORIGINS` | Origens CORS permitidas (separadas por vírgula) | ✅ |
| `RESEND_API_KEY` | API key do Resend para envio de emails | — |
| `RESEND_FROM_EMAIL` | Endereço de envio (domínio verificado) | — |
| `APP_URL` | URL pública do frontend (usada no link de reset de senha) | — |

> ⚠️ O servidor **não inicia** em `ENVIRONMENT=production` sem `JWT_SECRET` configurado.

> 💡 Gere um secret forte: `openssl rand -hex 32`

### Frontend (`.env.development` / `.env.production`)

| Variável | Descrição |
|---|---|
| `VITE_API_URL` | URL da API backend |
| `VITE_ENVIRONMENT` | `development` ou `production` |

---

## API

Todos os endpoints protegidos requerem o header:
```
Authorization: Bearer <jwt_token>
```

Limite de payload: **1MB** por request.

### Autenticação (público)

| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/auth/signup` | Cadastro |
| `POST` | `/auth/login` | Login — retorna JWT (24h) |
| `POST` | `/auth/forgot-password` | Solicita reset de senha (rate limit: 5/15min por IP) |
| `POST` | `/auth/reset-password` | Redefine senha com token |
| `DELETE` | `/auth/delete-account` | 🔒 Remove conta e todos os dados (requer senha) |

### Gastos 🔒

| Método | Endpoint | Query Params | Descrição |
|---|---|---|---|
| `GET` | `/expenses` | `month`, `year`, `all_installments` | Lista gastos |
| `POST` | `/expenses` | — | Cria gasto (suporta parcelamento) |
| `PUT` | `/expenses/update` | `id` | Atualiza gasto |
| `DELETE` | `/expenses/delete` | `id`, `delete_group` | Remove gasto (ou todo o parcelamento) |
| `GET` | `/expenses/recurring-pending` | — | Lista fixos sem confirmação no mês atual |
| `POST` | `/expenses/confirm-recurring` | — | Confirma um fixo para o mês atual |

**Corpo de criação de gasto:**
```json
{
  "description": "Netflix",
  "amount": 55.90,
  "category": "streaming",
  "group": "lazer",
  "payment_method": "credito",
  "date": "2026-05-01",
  "account_id": 1,
  "installments": 1,
  "is_recurring": true
}
```

### Renda Extra 🔒

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/incomes` | Lista rendas extras |
| `POST` | `/incomes` | Registra renda extra |
| `PUT` | `/incomes/update?id=X` | Atualiza renda |
| `DELETE` | `/incomes/delete?id=X` | Remove renda |

### Contas 🔒

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/accounts` | Lista contas |
| `POST` | `/accounts` | Cria conta |
| `PUT` | `/accounts/update?id=X` | Atualiza conta |
| `DELETE` | `/accounts/delete?id=X` | Remove conta |
| `POST` | `/accounts/transfer` | Transfere entre contas |

**Tipos de conta:** `corrente`, `poupanca`, `cartao`, `investimento`

### Metas 🔒

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/goals` | Lista metas |
| `POST` | `/goals` | Cria meta |
| `PUT` | `/goals/update?id=X` | Atualiza meta |
| `PUT` | `/goals/add-money?id=X` | Adiciona aporte (registra como investimento no 50/30/20) |
| `DELETE` | `/goals/delete?id=X` | Remove meta |

### Resumo e Dashboard 🔒

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/summary` | Resumo do mês (salário, renda extra, gastos por grupo, patrimônio) |
| `GET` | `/summary/history` | Histórico de 12 meses |
| `GET` | `/summary/breakdown` | Breakdown por grupo e categoria |

**Resposta do `/summary`:**
```json
{
  "mes": "May",
  "ano": 2026,
  "salario": 6000.00,
  "renda_extra": 800.00,
  "renda_total": 6800.00,
  "gasto_total": 3120.00,
  "ideal_fixos": 3400.00,
  "real_fixos": 1820.00,
  "ideal_lazer": 2040.00,
  "real_lazer": 760.00,
  "ideal_invest": 1360.00,
  "real_invest": 540.00,
  "saldo_restante": 3680.00,
  "patrimonio_total": 12450.00
}
```

### Preferências 🔒

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/preferences` | Retorna preferências do usuário |
| `PUT` | `/preferences` | Atualiza salário e percentuais 50/30/20 |

---

## Testes de Integração

Os testes rodam contra um banco de dados real. Use `TEST_DATABASE_URL` para configurar:

```bash
# Criar banco de teste (uma vez)
createdb controle_financeiro_test

# Rodar testes
TEST_DATABASE_URL="host=localhost port=5432 user=<usuario> dbname=controle_financeiro_test sslmode=disable" \
  go test ./internal/... -v

# Sem TEST_DATABASE_URL, os testes são pulados com SKIP (não falham)
go test ./internal/...
```

**Cobertura atual (16 testes):**
- `account_handler_test.go` — Transferências, saldo insuficiente, conta de outro usuário, mesma conta
- `auth_handler_test.go` — Login, senha errada, rate limiting, reset de senha, email duplicado
- `expense_handler_test.go` — Gasto único, parcelamento, datas sequenciais, filtro por mês
- `income_handler_test.go` — Criar, deletar e atualizar renda com ajuste de saldo

---

## Segurança

| Medida | Implementação |
|---|---|
| Autenticação | JWT HS256, 24h de validade |
| Senhas | bcrypt custo 10 |
| Invalidação pós-reset | `password_changed_at` no banco; middleware rejeita tokens emitidos antes |
| Rate limiting | 5 tentativas/15min por IP em `/auth/login` e `/auth/forgot-password` (persiste entre restarts) |
| Deleção de conta | Requer confirmação da senha atual |
| Autorização | Todas as queries incluem `AND user_id = $X` — impossível acessar dados de outro usuário |
| Race condition | `SELECT FOR UPDATE` em transferências |
| Payload | Limite de 1MB por request via `MaxBytesReader` |
| Validação de input | Valores negativos rejeitados, tipos de conta validados, `closing_day` validado (1-31) |
| Parcelamentos | Máximo 48x no backend |
| Recorrentes | `NOT EXISTS` check antes de confirmar — previne duplicatas |
| Headers | `X-Frame-Options`, `X-XSS-Protection`, `HSTS`, `CSP`, `X-Content-Type-Options` |
| CORS | Lista explícita de origens — nega tudo se `ALLOWED_ORIGINS` vazio |
| JWT em produção | Servidor não inicia sem `JWT_SECRET` configurado (`os.Exit(1)`) |
| Connection pool | 25 max open, 5 idle, 5min lifetime |
| Logs | `log/slog` — JSON em prod, texto em dev. Nenhum dado sensível (senha, token) nos logs |

---

## Deploy

### Backend — Render

O arquivo `render.yaml` configura o deploy automaticamente:

```bash
# Build
go build -o bin/api cmd/api/main.go

# Start
./bin/api
```

As migrations rodam automaticamente no startup. Configure as variáveis de ambiente no painel do Render.

### Frontend — Vercel

```bash
cd frontend
npm run build
# Deploy via Vercel CLI ou GitHub integration
```

Variáveis necessárias no Vercel:
- `VITE_API_URL` — URL da sua API no Render

---

## Design System

O Broto usa um sistema de cores próprio baseado no tema verde-escuro:

| Token | Cor | Uso |
|---|---|---|
| `primary` | `#7FE0A0` | Verde broto — ações principais, receitas |
| `bg` | `#0E1410` | Fundo do app |
| `surface` | `#161E18` | Cards e superfícies |
| `terracotta` | `#D8997A` | Gastos essenciais |
| `amber` | `#E8B86A` | Estilo de vida / alertas |
| `blue` | `#8FB7E6` | Investimento / metas |
| `rose` | `#E68A8A` | Erro / acima do orçamento |

Tipografia: **Geist** com numerais tabulares para valores monetários.
Ícones: **Material Symbols Rounded**.

---

## Licença

Uso pessoal. Sinta-se à vontade para adaptar para o seu próprio controle financeiro.

---

<div align="center">
  Feito com 🌱 e Go + React
</div>
