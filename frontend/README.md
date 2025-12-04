# Controle Financeiro — Frontend

Frontend React (Vite) para o app de controle financeiro. Já integrado com o backend Go em `http://localhost:8080`.

## Requisitos
- Node.js 18+ (recomendado 20.19+ para evitar warnings do Vite)
- npm

## Instalação
```bash
# dentro da pasta frontend
npm install
```

## Executar em desenvolvimento
```bash
# backend (em outro terminal na raiz do projeto)
go run cmd/api/main.go

# frontend
npm run dev
```

Backend expõe CORS para `http://localhost:5173`.

## Funcionalidades
- Dashboard com regra 50/30/20
- Cadastro de gastos e rendas
- Filtros de mês/ano no dashboard
- Exportação CSV de gastos e rendas

## Exportação CSV
No dashboard, use os botões “Exportar Gastos” e “Exportar Rendas”. O arquivo é gerado no navegador com os dados atuais.

## Dicas de ambiente
- Em macOS, ajuste case sensitivity no git para evitar problemas de imports:
```bash
git config core.ignorecase false
```
- Se aparecer aviso de engine do Vite, troque para Node 20:
```bash
# usando nvm
nvm install 20
nvm use 20
```

## Estrutura
- `src/Dashboard.jsx`: resumo, filtros e exportação CSV
- `src/Expenses.jsx`: CRUD de gastos
- `src/Incomes.jsx`: CRUD de rendas

## Próximos passos (MVP)
- Autenticação e multiusuário
- Exportação PDF e relatórios
- Deploy (Docker Compose + hosting)
