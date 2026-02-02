---
name: refactor-stability-security
description: Orientar e automatizar refatorações profundas focadas em performance, estabilidade, qualidade e segurança no my7pet.
---

# Refactor Stability & Security Skill

Este módulo fornece um guia estruturado e ferramentas para realizar refatorações seguras no monorepo **my7pet**. O foco é elevar a maturidade técnica do projeto, reduzindo erros em produção e vulnerabilidades de segurança.

## 1. Metadados

- **Escopo**: Fullstack (Frontend React/Vite, Backend Node/Express/Prisma)
- **Quando usar**:
  - Antes de grandes migrações de lógica.
  - Para resolver débitos técnicos de performance.
  - Para implementar hardening de segurança.
  - Em manutenções preventivas de estabilidade.
- **Quando NÃO usar**:
  - Para correções rápidas (hotfixes) que não toquem em estrutura.
  - Mudanças puramente estéticas sem impacto funcional ou de performance.
- **Pré-requisitos**:
  - Acesso ao banco de dados (Prisma).
  - Ambiente local configurado com `npm`.

## 2. Modo de Operação (Piloto)

### Etapa 0: "Do No Harm"

- Nunca altere configurações de produção diretamente.
- Garanta que existe um commit limpo antes de iniciar.
- Verifique se o `npm run build` passa antes de começar.

### Etapa 1: Scan e Diagnóstico

- Use os scripts da skill para identificar pontos críticos:
  - `scripts/scan-logs.sh` para buscar vazamentos de PII/Tokens.
  - `scripts/scan-health.sh` para verificar a integridade da estrutura.
  - `scripts/scan-deps.sh` para vulnerabilidades conhecidas.

### Etapa 2: Plano Incremental

- Quebre a refatoração em PRs menores.
- Siga a ordem: **Infra/Types -> Logic -> UI**.

### Etapa 3: Refatoração Segura

- Aplique os padrões definidos na seção 5.
- Mantenha compatibilidade com o Evidence Pack.

### Etapa 4: Verificação

- Execute `npm run test` em ambas as pastas.
- Rode `npm run lint` e `tsc` (typecheck).

### Etapa 5: Evidence Pack Final

- Gere o relatório detalhado de antes/depois.

## 3. Guardrails (Regras de Ouro)

1. **Privacidade**: Nunca logar PII (Personal Identifiable Information) ou Tokens no console/arquivos.
2. **Serverless Safe**: No backend (Vercel), não use o filesystem para logs persistentes. Use `pino`.
3. **UI Dinâmica**: Toda mudança de layout global deve ser verificada em mobile-first.
4. **Resiliência**: Blank screens são proibidos. Use `ErrorBoundary` e `Suspense`.
5. **Auth Integrity**: Alterações em `AuthMiddleware` ou rotas `/auth` exigem testes de integração.

## 4. Checklist de Auditoria

| Item | Comando / Ação |
| :--- | :--- |
| **Secrets** | `grep -r "key\|secret\|password" .` (excluindo .env) |
| **Logs** | `grep -r "console.log" src` (backend) |
| **Types** | `npm run test` no frontend (tsc) |
| **N+1 Queries** | Revisar `prisma.findMany` em loops |
| **Dependencies** | `npm audit` no root e subpastas |
| **CSP/Headers** | Verificar configuração do `helmet` no `index.ts` |

## 5. Padrões de Refatoração Exigidos

### Backend (Node/Express/Prisma)

- **Service Layer**: Controllers devem apenas orquestrar. A lógica de negócio reside em `backend/src/services`.
- **Validation**: Use **Zod** para validar todos os `req.body` e `req.params`.
- **Error Handling**: Padronize retornos de erro usando o formato `{ error: { code, message, details } }`.
- **Prisma Selection**: Evite `include` genéricos. Use `select` para buscar apenas o necessário (evitar over-fetching).

### Frontend (React/Vite/Tailwind)

- **Loading UX**: Implemente Skeletons para áreas críticas.
- **Error Boundaries**: Componentes pai devem capturar erros de filhos para evitar crash da página.
- **Zustand Optimization**: Use selectores estáveis para evitar re-renders desnecessários.
- **CSS Hygiene**: Remova width fixo em containers principais. Use `max-w-7xl mx-auto px-4`.

## 6. Estratégia de Testes

- **Backend**: Testes unitários para `services` e integração (Supertest) para rotas críticas.
- **Frontend**: Smoke tests para fluxos de login e navegação.
- **Gate**: Build falha se qualquer teste falhar.

## 7. Observabilidade

- Use `pino` para logs estruturados.
- Em desenvolvimento, use `pino-pretty` (já disponível no backend).
- Verifique o arquivo `backend/server.log` (se existir) apenas para debug local.

## 8. Playbooks

### Refatorar Controller Gigante

1. Identifique a lógica de banco no Controller.
2. Crie um arquivo em `backend/src/services/[Feature]Service.ts`.
3. Mova a lógica para funções puras ou de negócio.
4. Substitua no Controller chamando o Service.

### Corrigir Espaço Fantasma (Mobile)

1. Inspecione elementos com `overflow-x: hidden` no `App.tsx`.
2. Verifique margens negativas em componentes Tailwind.
3. Garanta que `min-w-0` está sendo usado em flex-items que contêm texto longo.

## 9. Evidence Pack Verifier

Sempre que usar esta skill, anexe os seguintes resultados:

1. Output do `npm run lint`.
2. Output do `npm run build`.
3. Diff comparativo de performance (se aplicável).
4. Print da página em resolução mobile (375px width).
