# Histórico de Versões - 7Pet MVP

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [BETA20260105-0041] - 2026-01-05

### ✨ Novidades (Features)

- **Push Notifications**: Sistema completo de notificações push para PWA
  - Hook customizado `usePushNotifications`
  - Integração com VAPID keys
  - Suporte para notificações em background
- **PWA Settings**: Página de configurações do app com:
  - Controle de notificações
  - Instruções específicas para iOS
  - Status de conexão e instalação
- **Sistema de Versionamento**: Implementação de versionamento customizado
  - Formato: `NOME+YYYYMMDD-HHMM`
  - Histórico completo em `CHANGELOG.md`
  - Exibição em UI e API

### 🔒 Segurança (Security)

- **Validação de Ambiente**: Validação obrigatória de variáveis críticas no startup
  - `JWT_SECRET` com mínimo de 32 caracteres
  - `DATABASE_URL` com padrão PostgreSQL
- **Interceptor 401**: Auto-logout e redirecionamento ao detectar sessão expirada
- **CORS Flexível**: Suporte para IPs locais em desenvolvimento (192.168.x.x)

### 🐛 Correções (Bug Fixes)

- **Database Connection**: Correção de conexão via PgBouncer substituída por conexão direta
- **Environment Validation**: Correção do erro que impedia startup do servidor
- **JWT Secret**: Geração de nova chave segura para resolver incompatibilidade

### 🔧 Melhorias (Improvements)

- **UserManager**: Exibição de divisão ao invés de role na tabela
- **API Error Handling**: Mensagens de erro mais descritivas
- **PWA Guide**: Documentação completa para instalação e uso

### 📝 Documentação (Documentation)

- `PUSH_NOTIFICATIONS_GUIDE.md`: Guia completo de notificações push
- `PUSH_NOTIFICATIONS_FIX.md`: Documentação da correção do erro 500
- `CHANGELOG.md`: Este arquivo

---

## [BETA20260104-1900] - 2026-01-04

### ✨ Novidades (Features)

- Sistema base do 7Pet MVP
- Autenticação de clientes e colaboradores
- Gestão de pets e agendamentos
- Sistema de orçamentos
- Agenda SPA e Logística
- Sistema financeiro básico

### 🎨 UI/UX

- Design system completo
- Mobile-first responsive
- Sidebar para navegação
- Modais e formulários otimizados

---

## Convenções de Versionamento

### Formato

`NOME+YYYYMMDD-HHMM`

- **NOME**: Estágio de desenvolvimento
  - `ALPHA`: Versão inicial em desenvolvimento
  - `BETA`: Versão de testes
  - `RC`: Release Candidate
  - `STABLE`: Versão estável
  - `v2`, `v3`, etc.: Versões principais

- **YYYYMMDD**: Data (Ano+Mês+Dia)
- **HHMM**: Hora (Hora:Minuto no formato 24h)

### Categorias de Mudanças

- **✨ Novidades**: Novas funcionalidades
- **🔒 Segurança**: Correções de vulnerabilidades
- **🐛 Correções**: Bug fixes
- **🔧 Melhorias**: Otimizações e refinamentos
- **📝 Documentação**: Mudanças na documentação
- **⚠️ Depreciado**: Funcionalidades que serão removidas
- **🗑️ Removido**: Funcionalidades removidas
