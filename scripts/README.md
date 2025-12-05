# Scripts de Automação

Esta pasta contém scripts úteis para facilitar o desenvolvimento e deploy.

## 📜 Scripts Disponíveis

### 🛠️ `setup-dev.sh`
**Uso:** Setup inicial do ambiente de desenvolvimento

```bash
./scripts/setup-dev.sh
```

**O que faz:**
- ✅ Cria arquivo `.env` se não existir
- ✅ Verifica se PostgreSQL está instalado e rodando
- ✅ Cria banco de dados se não existir
- ✅ Aplica todas as migrations automaticamente
- ✅ Instala dependências do Go
- ✅ Instala dependências do frontend (npm)

**Quando usar:** Na primeira vez que configurar o projeto ou após clonar em nova máquina.

---

### 🚀 `start-dev.sh`
**Uso:** Iniciar backend e frontend simultaneamente

```bash
./scripts/start-dev.sh
```

**O que faz:**
- 🔵 Inicia o backend Go na porta 8080
- 🟢 Inicia o frontend Vite na porta 5173
- 🛑 Ctrl+C para parar ambos os servidores

**Quando usar:** Desenvolvimento diário, para não precisar abrir múltiplos terminais.

---

### 🏗️ `build-prod.sh`
**Uso:** Build de produção de backend e frontend

```bash
./scripts/build-prod.sh
```

**O que faz:**
- 📦 Compila backend Go → `./api`
- 📦 Faz build do frontend → `./frontend/dist`
- 📊 Mostra informações sobre os arquivos gerados

**Quando usar:** Antes de fazer deploy manual ou para testar build de produção localmente.

---

## 🎯 Fluxo de Trabalho Típico

### Primeira Vez
```bash
# 1. Clone o repositório
git clone <repo-url>
cd controle-financeiro

# 2. Execute setup
./scripts/setup-dev.sh

# 3. Inicie os servidores
./scripts/start-dev.sh
```

### Desenvolvimento Diário
```bash
# Apenas inicie os servidores
./scripts/start-dev.sh
```

### Antes de Deploy
```bash
# Teste o build
./scripts/build-prod.sh

# Teste localmente
ENVIRONMENT=production ./api
cd frontend && npm run preview
```

---

## ⚙️ Personalização

Você pode modificar os scripts conforme suas necessidades:

### Adicionar Linting Automático
```bash
# Em start-dev.sh, adicione antes de iniciar:
echo "Running linters..."
cd frontend && npm run lint
go vet ./...
```

### Adicionar Testes
```bash
# Em start-dev.sh, adicione:
echo "Running tests..."
go test ./...
cd frontend && npm test
```

### Mudar Portas
```bash
# No .env, altere:
PORT=3000

# No frontend/.env.development:
VITE_API_URL=http://localhost:3000
```

---

## 🐛 Troubleshooting

### Script não executa
```bash
# Certifique-se de dar permissão de execução
chmod +x scripts/*.sh
```

### PostgreSQL não encontrado
```bash
# macOS
brew install postgresql
brew services start postgresql

# Linux (Ubuntu/Debian)
sudo apt-get install postgresql
sudo systemctl start postgresql
```

### Porta já em uso
```bash
# Verificar o que está usando a porta
lsof -i :8080
lsof -i :5173

# Matar processo
kill -9 <PID>
```

---

## 📝 Contribuindo

Ao adicionar novos scripts:

1. Adicione comentários explicativos
2. Use `set -e` para parar em erros
3. Adicione mensagens de progresso com emojis
4. Documente neste README
5. Dê permissão de execução: `chmod +x seu-script.sh`

---

## 💡 Ideias para Novos Scripts

- `test.sh` - Rodar todos os testes
- `migrate.sh` - Gerenciar migrations
- `backup-db.sh` - Backup do banco
- `clean.sh` - Limpar caches e builds
- `deploy-prod.sh` - Deploy automatizado
- `seed-db.sh` - Popular banco com dados de teste
