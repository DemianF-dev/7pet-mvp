# Testing Strategy - my7pet

Abordagem recomendada para testar o sistema pós-refatoração.

## 1. Testes de Unidade (Backend)

- Focar em `services/*.ts`.
- Mockar o Prisma Client usando `jest-mock-extended`.
- Objetivo: Cobrir lógica de cálculo, transformações e validações.

## 2. Testes de Integração (API)

- Usar `supertest`.
- Testar rotas que envolvem múltiplos serviços (Ex: Criar Agendamento + Notificação).
- Limpar/Migrar o banco de teste (`DATABASE_URL_TEST`) antes de cada rodada.

## 3. Testes de UI (Frontend)

- **Smoke Tests**: Verificar se as páginas principais carregam sem crash.
- **Critical Flow**: Verificar Login, Cadastro de Pet e Fluxo de Orçamento.

## 4. CI / Quality Gates

Idealmente, nenhum código deve ser mergeado se:

- `npm run lint` falhar.
- `tsc` (Typecheck) falhar.
- Testes regredirem.
