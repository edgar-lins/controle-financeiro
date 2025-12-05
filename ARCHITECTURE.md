# 🏗️ Arquitetura de Ambientes

## Visão Geral

```
┌─────────────────────────────────────────────────────────────┐
│                    DESENVOLVIMENTO                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐         ┌──────────────┐                │
│  │   Frontend   │         │   Backend    │                │
│  │  (Vite Dev)  │────────▶│     (Go)     │                │
│  │ :5173        │  HTTP   │  :8080       │                │
│  └──────────────┘         └──────┬───────┘                │
│   │                              │                         │
│   │ .env.development             │ .env                   │
│   │ VITE_API_URL=                │ DB_HOST=localhost      │
│   │ localhost:8080               │ ENVIRONMENT=dev        │
│   │                              │                         │
│   │                              ▼                         │
│   │                      ┌──────────────┐                 │
│   │                      │  PostgreSQL  │                 │
│   │                      │  (Docker)    │                 │
│   └─────────────────────▶│  :5432       │                 │
│                          └──────────────┘                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│                        PRODUÇÃO                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐         ┌──────────────┐                │
│  │   Frontend   │         │   Backend    │                │
│  │   (Vercel)   │────────▶│   (Render)   │                │
│  │ seu-app      │  HTTPS  │ .onrender    │                │
│  │ .vercel.app  │         │ .com         │                │
│  └──────────────┘         └──────┬───────┘                │
│   │                              │                         │
│   │ .env.production              │ Env Variables          │
│   │ VITE_API_URL=                │ DATABASE_URL=...       │
│   │ api.onrender.com             │ ENVIRONMENT=prod       │
│   │                              │ JWT_SECRET=***         │
│   │                              │                         │
│   │                              ▼                         │
│   │                      ┌──────────────┐                 │
│   │                      │  PostgreSQL  │                 │
│   │                      │   (Render)   │                 │
│   └─────────────────────▶│   Managed    │                 │
│                          └──────────────┘                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Estrutura de Arquivos

```
controle-financeiro/
│
├── 🔧 Configuração de Ambiente - Backend
│   ├── .env                    # Local (não commitado)
│   ├── .env.development        # Template de dev (commitado)
│   └── .env.example            # Documentação (commitado)
│
├── 🎨 Configuração de Ambiente - Frontend
│   ├── frontend/.env.development    # Dev (commitado)
│   ├── frontend/.env.production     # Prod (commitado)
│   └── frontend/.env.example        # Documentação (commitado)
│
├── 🚀 Scripts de Automação
│   ├── scripts/setup-dev.sh         # Setup inicial
│   ├── scripts/start-dev.sh         # Iniciar dev
│   └── scripts/build-prod.sh        # Build produção
│
├── 📚 Documentação
│   ├── README.md               # Docs principal
│   ├── ENVIRONMENTS.md         # Este guia
│   ├── QUICKSTART.md          # Início rápido
│   └── DEPLOY.md              # Deploy
│
└── ⚙️ Configuração de Deploy
    ├── render.yaml            # Render config
    ├── vercel.json            # Vercel config (frontend)
    └── docker-compose.yml     # Docker local
```

---

## 🔄 Fluxo de Trabalho

### 1. Desenvolvimento Local

```bash
# Primeira vez
./scripts/setup-dev.sh

# Dia a dia
./scripts/start-dev.sh
```

**O que acontece:**
1. Backend carrega `.env` → conecta ao PostgreSQL local
2. Frontend carrega `.env.development` → aponta para `localhost:8080`
3. Você desenvolve e testa localmente
4. Commits não incluem `.env` (protegido pelo .gitignore)

### 2. Deploy para Produção

```bash
git add .
git commit -m "feat: nova funcionalidade"
git push origin main
```

**O que acontece:**
1. GitHub recebe o push
2. **Vercel** detecta mudanças:
   - Faz build do frontend com `.env.production`
   - Deploy automático
3. **Render** detecta mudanças:
   - Faz build do backend
   - Usa variáveis de ambiente do dashboard
   - Deploy automático

### 3. Rollback (se necessário)

```bash
# Vercel
vercel rollback

# Render
# Use o dashboard para escolher deploy anterior
```

---

## 🔐 Segurança

### ❌ NUNCA commitar
- `.env` (seu arquivo local)
- `.env.local`
- `.env.*.local`
- Qualquer arquivo com senhas/secrets reais

### ✅ SEMPRE commitar
- `.env.example` (template)
- `.env.development` (dev configs)
- `.env.production` (prod configs, mas sem secrets!)

### 🛡️ Secrets em Produção
- **Render**: Configure no dashboard → Environment Variables
- **Vercel**: Configure em Settings → Environment Variables
- Use secrets diferentes para dev e prod
- Rotacione secrets periodicamente

---

## 🌐 Variáveis de Ambiente por Serviço

### Backend (Render)

| Variável | Desenvolvimento | Produção |
|----------|----------------|----------|
| `ENVIRONMENT` | development | production |
| `PORT` | 8080 | 8080 |
| `DB_*` | localhost | - |
| `DATABASE_URL` | - | Render PostgreSQL |
| `JWT_SECRET` | dev_key | strong_random |
| `ALLOWED_ORIGINS` | localhost:* | *.vercel.app |

### Frontend (Vercel)

| Variável | Desenvolvimento | Produção |
|----------|----------------|----------|
| `VITE_API_URL` | localhost:8080 | *.onrender.com |
| `VITE_ENVIRONMENT` | development | production |

---

## 🧪 Testando Builds de Produção Localmente

### Backend
```bash
# Build
./scripts/build-prod.sh

# Configurar env de prod
export ENVIRONMENT=production
export DATABASE_URL="postgresql://..."
export JWT_SECRET="strong_secret"

# Rodar
./api
```

### Frontend
```bash
cd frontend

# Build com config de produção
npm run build

# Preview
npm run preview

# Acesse: http://localhost:4173
```

---

## 📊 Monitoramento

### Desenvolvimento
- Logs no terminal
- Console do navegador (DevTools)
- PostgreSQL logs: `tail -f /usr/local/var/log/postgresql@16.log`

### Produção
- **Render**: Dashboard → Logs tab
- **Vercel**: Dashboard → Deployments → Function logs
- **Sentry** (futuro): Monitoramento de erros

---

## 🆘 Troubleshooting

| Problema | Solução |
|----------|---------|
| Backend não inicia | Verificar `.env`, PostgreSQL rodando |
| CORS error | Adicionar URL em `ALLOWED_ORIGINS` |
| Frontend não conecta | Verificar `VITE_API_URL` |
| Variável não carrega | Reiniciar servidor, verificar prefixo `VITE_` |
| Deploy falha | Checar logs no Render/Vercel |
| Banco não conecta | Verificar `DATABASE_URL` no Render |

---

## 📝 Checklist de Deploy

Antes de fazer deploy:

- [ ] Testar build local: `npm run build && npm run preview`
- [ ] Verificar se todas as variáveis estão no Render/Vercel
- [ ] Confirmar que `.env` não está no git: `git status`
- [ ] Testar migrations no banco de produção
- [ ] Verificar CORS origins incluem o domínio de produção
- [ ] Confirmar JWT_SECRET é forte (prod)
- [ ] Fazer backup do banco de produção
- [ ] Documentar mudanças no DEPLOY.md

Após deploy:

- [ ] Testar login/signup
- [ ] Verificar todas as rotas principais
- [ ] Checar logs de erro no Render
- [ ] Monitorar performance inicial
- [ ] Avisar usuários sobre mudanças (se necessário)

---

## 🎯 Próximos Passos

- [ ] Configurar CI/CD com testes automáticos
- [ ] Adicionar Sentry para monitoramento de erros
- [ ] Configurar alertas (Uptime Robot)
- [ ] Implementar feature flags
- [ ] Adicionar ambiente de staging
- [ ] Configurar backups automáticos
