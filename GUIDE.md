# 🧭 Guia de Decisão Rápida

Use este guia para saber qual comando/arquivo usar em cada situação.

## 🤔 Qual comando devo usar?

```
┌─────────────────────────────────────────┐
│ Primeira vez configurando o projeto?    │
└───────────────┬─────────────────────────┘
                │
                ├─ SIM → ./scripts/setup-dev.sh
                │
                └─ NÃO ↓

┌─────────────────────────────────────────┐
│ Quer iniciar o ambiente de dev?        │
└───────────────┬─────────────────────────┘
                │
                ├─ Rápido → ./scripts/start-dev.sh
                │
                └─ Manual →
                    Terminal 1: go run cmd/api/main.go
                    Terminal 2: cd frontend && npm run dev

┌─────────────────────────────────────────┐
│ Precisa fazer build para produção?     │
└───────────────┬─────────────────────────┘
                │
                ├─ Completo → ./scripts/build-prod.sh
                │
                └─ Separado →
                    Backend: go build -o api cmd/api/main.go
                    Frontend: cd frontend && npm run build

┌─────────────────────────────────────────┐
│ Quer testar build de prod localmente?  │
└───────────────┬─────────────────────────┘
                │
                ├─ Backend → ENVIRONMENT=production ./api
                │
                └─ Frontend → cd frontend && npm run preview
```

---

## 📝 Qual arquivo .env devo editar?

```
┌─────────────────────────────────────────┐
│ O que você quer fazer?                 │
└───────────────┬─────────────────────────┘
                │
                ├─ Configurar meu dev local
                │  → Edite: .env
                │  (não será commitado)
                │
                ├─ Ver exemplo de todas as variáveis
                │  → Veja: .env.example
                │  (template de documentação)
                │
                ├─ Alterar padrões de dev para todos
                │  → Edite: .env.development
                │  (será commitado)
                │
                ├─ Configurar frontend dev
                │  → Edite: frontend/.env.development
                │  (será commitado)
                │
                └─ Configurar frontend prod
                   → Edite: frontend/.env.production
                   (será commitado)
```

---

## 🐛 Estou com um problema, o que fazer?

```
┌─────────────────────────────────────────┐
│ Qual é o problema?                      │
└───────────────┬─────────────────────────┘
                │
                ├─ Backend não conecta ao banco
                │  1. Verifique: cat .env
                │  2. PostgreSQL rodando? pg_isready
                │  3. Banco existe? psql -l | grep controle
                │  4. Guia completo: ENVIRONMENTS.md
                │
                ├─ Frontend não conecta à API
                │  1. Backend está rodando? curl http://localhost:8080
                │  2. Console do navegador: import.meta.env.VITE_API_URL
                │  3. Verifique: frontend/.env.development
                │  4. Guia: QUICKSTART.md → Troubleshooting
                │
                ├─ Erro de CORS
                │  1. Adicione URL em ALLOWED_ORIGINS no .env
                │  2. Reinicie o backend
                │  3. Veja: ENVIRONMENTS.md → CORS
                │
                ├─ Script não executa
                │  1. Dê permissão: chmod +x scripts/*.sh
                │  2. Veja: scripts/README.md
                │
                ├─ Variável de ambiente não carrega
                │  1. Frontend: variável começa com VITE_?
                │  2. Reinicie o servidor
                │  3. Verifique nome do arquivo: .env.development
                │
                └─ Erro geral/outro
                   1. Leia: QUICKSTART.md → Troubleshooting
                   2. Veja logs do backend no terminal
                   3. Veja console do navegador (F12)
```

---

## 🚀 Preciso fazer deploy, o que fazer?

```
┌─────────────────────────────────────────┐
│ Primeiro deploy?                        │
└───────────────┬─────────────────────────┘
                │
                ├─ SIM → Leia DEPLOY.md (guia completo)
                │
                └─ NÃO ↓

┌─────────────────────────────────────────┐
│ Deploy de qual parte?                   │
└───────────────┬─────────────────────────┘
                │
                ├─ Frontend (Vercel)
                │  1. cd frontend
                │  2. npm run build
                │  3. git push origin main
                │  4. Vercel detecta e faz deploy auto
                │
                ├─ Backend (Render)
                │  1. git push origin main
                │  2. Render detecta e faz deploy auto
                │  3. Verifique logs no dashboard
                │
                └─ Ambos
                   1. Teste localmente primeiro!
                   2. git add .
                   3. git commit -m "feat: sua feature"
                   4. git push origin main
                   5. Monitore deploys nos dashboards
```

---

## 📚 Qual documentação devo ler?

```
┌─────────────────────────────────────────┐
│ O que você precisa?                     │
└───────────────┬─────────────────────────┘
                │
                ├─ Nunca usei este projeto
                │  → QUICKSTART.md
                │  (início rápido, 5 minutos)
                │
                ├─ Entender arquitetura/ambientes
                │  → ARCHITECTURE.md
                │  (diagramas e fluxos)
                │
                ├─ Configurar ambientes
                │  → ENVIRONMENTS.md
                │  (guia completo e detalhado)
                │
                ├─ Fazer deploy
                │  → DEPLOY.md
                │  (passo a passo para produção)
                │
                ├─ Usar os scripts
                │  → scripts/README.md
                │  (explicação de cada script)
                │
                ├─ Ver o que mudou
                │  → CHANGELOG.md
                │  (histórico de mudanças)
                │
                └─ API, funcionalidades, etc
                   → README.md
                   (documentação principal)
```

---

## 🛠️ Comandos Mais Usados

### Desenvolvimento
```bash
# Setup inicial (primeira vez)
./scripts/setup-dev.sh

# Iniciar desenvolvimento
./scripts/start-dev.sh

# Verificar banco
psql -d controle_financeiro

# Ver logs do backend
go run cmd/api/main.go 2>&1 | tee logs.txt
```

### Testes
```bash
# Testar build de produção
./scripts/build-prod.sh

# Rodar backend em modo prod
ENVIRONMENT=production ./api

# Preview do frontend
cd frontend && npm run preview
```

### Git
```bash
# Status (verificar se .env não está incluído)
git status

# Commit
git add .
git commit -m "feat: sua mensagem"
git push origin main
```

### Banco de Dados
```bash
# Aplicar uma migration
psql -d controle_financeiro -f migrations/XXX_nome.sql

# Aplicar todas as migrations
for f in migrations/*.sql; do psql -d controle_financeiro -f "$f"; done

# Backup
pg_dump controle_financeiro > backup_$(date +%Y%m%d).sql
```

---

## ⚡ Atalhos Úteis

| Situação | Comando |
|----------|---------|
| Setup rápido | `./scripts/setup-dev.sh` |
| Iniciar dev | `./scripts/start-dev.sh` |
| Build prod | `./scripts/build-prod.sh` |
| Ver variáveis | `cat .env` |
| Verificar BD | `pg_isready && psql -l` |
| Limpar tudo | `rm -rf node_modules dist api .env` |
| Recomeçar | `./scripts/setup-dev.sh` |

---

## 🎯 Fluxo Recomendado

### Dia típico de desenvolvimento
1. `./scripts/start-dev.sh` ← Inicia tudo
2. Desenvolva sua feature
3. Teste no navegador
4. Commit e push
5. Monitore deploy automático

### Antes de fazer um PR/deploy importante
1. Teste localmente com build de produção
2. Verifique variáveis de ambiente
3. Revise mudanças: `git diff`
4. Leia logs de erro
5. Faça commit bem descrito
6. Push e monitore deploy

### Se algo der errado
1. Verifique logs (terminal + console)
2. Consulte QUICKSTART.md → Troubleshooting
3. Verifique variáveis de ambiente
4. Reinicie servidores
5. Se persistir: limpe e recomece
