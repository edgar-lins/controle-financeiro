# 🚀 Guia de Deploy - Controle Financeiro

## Pré-requisitos
- Conta no GitHub (já tem ✅)
- Conta na Vercel (gratuita)
- Conta no Render (gratuita)

## Passo 1: Deploy do Backend (Render)

1. Acesse [render.com](https://render.com) e faça login com GitHub
2. Clique em "New" → "Blueprint"
3. Conecte seu repositório `controle-financeiro`
4. O Render vai detectar o `render.yaml` automaticamente
5. Clique em "Apply" para criar:
   - PostgreSQL Database (gratuito)
   - Web Service para a API Go

**Importante:** Após o deploy, copie a URL da API (ex: `https://controle-financeiro-api.onrender.com`)

## Passo 2: Configurar Frontend

Antes de fazer deploy do frontend, precisamos configurar a URL da API:

1. Crie/edite o arquivo `frontend/.env.production`:
```bash
VITE_API_URL=https://sua-api-do-render.onrender.com
```

2. Atualize todos os `fetch` no frontend para usar `import.meta.env.VITE_API_URL`

## Passo 3: Deploy do Frontend (Vercel)

1. Acesse [vercel.com](https://vercel.com) e faça login com GitHub
2. Clique em "Add New Project"
3. Importe o repositório `controle-financeiro`
4. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Adicione a variável de ambiente:
   - `VITE_API_URL` = URL da sua API no Render
6. Clique em "Deploy"

## Passo 4: Rodar Migrações

Após o deploy do backend, rode as migrações:

```bash
# No Render, vá em Shell do seu Web Service e execute:
psql $DATABASE_URL -f migrations/001_create_expenses_table.sql
psql $DATABASE_URL -f migrations/002_create_incomes_table.sql
```

## URLs Finais

- **Frontend:** `https://seu-app.vercel.app`
- **Backend API:** `https://seu-api.onrender.com`

## Custos

- Vercel: Gratuito (100GB bandwidth/mês)
- Render: Gratuito (750h/mês)
- PostgreSQL: Gratuito (1GB storage)

**Limitações do plano gratuito:**
- Backend "dorme" após 15min sem uso (primeiro acesso pode demorar ~30s)
- 1GB de armazenamento no banco

## Próximos Passos

1. Testar todas as funcionalidades em produção
2. Convidar amigos para testar
3. Coletar feedback
4. Se precisar de mais recursos, considerar upgrade (~$7/mês no Render)
