# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [Não Lançado]

### 🌍 Separação de Ambientes (2025-12-04)

#### Adicionado
- **Configuração de Ambientes**
  - `.env.example` - Template de variáveis de ambiente
  - `.env.development` - Configurações de desenvolvimento
  - `frontend/.env.example` - Template frontend
  - `frontend/.env.development` - Config dev frontend
  - `frontend/.env.production` - Config prod frontend

- **Documentação**
  - `ENVIRONMENTS.md` - Guia completo de configuração de ambientes
  - `QUICKSTART.md` - Guia de início rápido
  - `ARCHITECTURE.md` - Diagrama e arquitetura de ambientes
  - `scripts/README.md` - Documentação dos scripts

- **Scripts de Automação**
  - `scripts/setup-dev.sh` - Setup automático do ambiente
  - `scripts/start-dev.sh` - Iniciar dev em um comando
  - `scripts/build-prod.sh` - Build de produção

- **Variáveis de Ambiente no Backend**
  - `ENVIRONMENT` - Indicador de ambiente (dev/prod)
  - `PORT` - Porta do servidor (padrão: 8080)
  - `ALLOWED_ORIGINS` - CORS configurável por ambiente
  - Suporte para `.env.development` baseado no ambiente

- **Melhorias no Frontend**
  - Scripts npm: `build:dev`, `build:prod`, `preview:prod`
  - Indicador de ambiente no console (dev only)
  - Export de `ENVIRONMENT` em `config/api.js`

#### Modificado
- **Backend (`cmd/api/main.go`)**
  - CORS agora usa variável `ALLOWED_ORIGINS`
  - Porta dinâmica via variável `PORT`
  - Mensagem de inicialização mostra ambiente
  - Imports adicionados: `os`, `strings`

- **Database (`internal/database/connection.go`)**
  - Carrega `.env.development` automaticamente em dev
  - Detecta ambiente via `ENVIRONMENT` variable

- **Frontend (`src/config/api.js`)**
  - Export nomeado para `ENVIRONMENT`
  - Console logs em modo desenvolvimento

- **Arquivos de Configuração**
  - `render.yaml` - Adicionado `ENVIRONMENT` e `ALLOWED_ORIGINS`
  - `frontend/package.json` - Novos scripts de build

#### Melhorado
- **`.gitignore`** (backend)
  - Ignora `.env.local` e `.env.*.local`
  - Ignora binários Go (`/api`, `/main`)
  - Ignora logs (`*.log`)

- **`.gitignore`** (frontend)
  - Ignora variações de `.env` (exceto `.example`)
  - Comentários explicativos

- **README.md**
  - Referência aos novos guias de documentação
  - Instruções atualizadas de setup com `.env`

#### Segurança
- Secrets não são mais hardcoded
- `.env` está protegido pelo `.gitignore`
- Templates (`.example`) documentam todas as variáveis
- CORS configurável por ambiente

---

## Estrutura de Versionamento

Este projeto segue [Semantic Versioning](https://semver.org/):
- **MAJOR**: Mudanças incompatíveis na API
- **MINOR**: Funcionalidades novas compatíveis
- **PATCH**: Correções de bugs

### Tipos de Mudanças
- `Added` - Novas funcionalidades
- `Changed` - Mudanças em funcionalidades existentes
- `Deprecated` - Funcionalidades que serão removidas
- `Removed` - Funcionalidades removidas
- `Fixed` - Correções de bugs
- `Security` - Vulnerabilidades corrigidas

---

## Histórico Anterior

### [0.1.0] - MVP Inicial
- Autenticação JWT
- Dashboard com regra 50/30/20
- Gestão de contas bancárias
- Registro de gastos e rendas
- Sistema de metas financeiras
- Exportação CSV
