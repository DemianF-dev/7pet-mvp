# Engineering Hardening Report (my7pet)

Date: 2026-02-10

## PASSO 0 — Diagnóstico (curto e direto)

### Stack e Estrutura
- Monorepo com workspaces `frontend` e `backend` (npm, `package-lock.json` no root).
- Frontend: React + Vite + TypeScript + Tailwind (PWA via `vite-plugin-pwa`).
- Backend: Node.js + Express + TypeScript + Prisma + Postgres; Socket.io; Zod.
- Outras pastas: `api/`, `realtime/`, `shared/`, `scripts/`, `docs/`, `reports/`.

### Scripts Disponíveis (visão geral)
- Root: `dev:frontend`, `dev:backend`, `build:*`, `backup:db`, `restore:db`.
- Backend: `test`, `lint`, `build`, `vercel-build`, `security:*`, `rls:apply`.
- Frontend: `build`, `test` (tsc), `lint`.

### Padrões Atuais
- Backend organizado em `routes/`, `controllers/`, `services/`, `middlewares/`, `utils/`.
- Lógica de negócio crítica concentrada em serviços grandes (ex.: `quoteService.ts`).
- Frontend concentra muita regra em componentes/pages grandes (pouca extração de módulos puros).

### Pontos Críticos (tamanho/complexidade)
Top arquivos por tamanho (risco alto de bugs/efeitos colaterais):
1. `frontend/src/components/modals/ManualQuoteModal.tsx` (~262 KB)
2. `frontend/src/pages/staff/UserManager.backup.tsx` (~113 KB)
3. `frontend/src/pages/staff/CustomerDetail.tsx` (~112 KB)
4. `frontend/src/pages/staff/POS.tsx` (~94 KB)
5. `frontend/src/pages/staff/ServiceManager.tsx` (~87 KB)
6. `backend/src/controllers/quoteController.ts` (~83 KB)
7. `frontend/src/components/staff/AppointmentFormModal.tsx` (~67 KB)
8. `frontend/src/pages/staff/ServiceKanban.tsx` (~62 KB)
9. `frontend/src/pages/staff/QuoteEditor.tsx` (~62 KB)
10. `frontend/src/components/staff/AppointmentDetailsModal.tsx` (~58 KB)
11. `backend/src/services/quoteService.ts` (~54 KB)
12. `frontend/src/components/staff/quote-editor/TransportOnlyEditor.tsx` (~44 KB)
13. `frontend/src/pages/client/ClientProfile.tsx` (~40 KB)
14. `frontend/src/pages/staff/users/components/UserFormModal.tsx` (~40 KB)
15. `backend/src/controllers/customerController.ts` (~39 KB)
16. `backend/src/services/appointmentService.ts` (~38 KB)
17. `backend/src/controllers/managementController.ts` (~37 KB)
18. `frontend/src/pages/staff/hr/StaffProfiles.tsx` (~36 KB)
19. `frontend/src/pages/staff/StaffDashboard.tsx` (~36 KB)
20. `frontend/src/pages/staff/StaffProfile.tsx` (~36 KB)
21. `frontend/src/components/staff/CustomerFinancialSection.tsx` (~36 KB)
22. `frontend/src/pages/staff/CustomerManager.tsx` (~35 KB)
23. `frontend/src/components/staff/dev/TransportSimulator.tsx` (~35 KB)

### Áreas de Alto Risco (fluxos)
- **Orçamentos → Aprovar/Agendar → Wizard → Appointments/Legs**:
  - Lógica pesada em `quoteService.ts` com múltiplas ramificações e exclusões em massa.
- **Undo schedule**:
  - Reversão em lote sem idempotência explícita e validações reduzidas.
- **Transporte recorrente (geração até fim do mês)**:
  - Sinais de recorrência estão espalhados; dependem de snapshots/metadata e agendamentos em lote.
- **Financeiro (Invoices/Quote status)**:
  - `invoiceRoutes.ts` contém múltiplas mudanças de status e side-effects.

### Avaliação Crua (sem anestesia)
Pontos bons:
- Prisma + transações: base sólida para consistência.
- Rotas separadas e uso de services sugere intenção de organização.
- Zod presente (potencial para validação consistente).

Pontos ruins:
- Arquivos gigantes com regras misturadas (UI + regra + I/O) → difícil de testar e propenso a regressão.
- Regras críticas de agenda/transporte sem idempotência explícita.
- Erros em fluxos críticos são `throw new Error` genérico (pior para client e observabilidade).
- “Emergency routes” expostos no backend (risco de segurança e vazamento de dados).

## PASSO 1 — Guardrails de Qualidade (CI + padrões)
- Scripts padronizados adicionados no root: `lint`, `typecheck`, `test`, `check`.
- `frontend`/`backend` agora expõem `typecheck`.
- CI reforçado com lint + typecheck + test (backend) e lint + typecheck + build (frontend).
- Definition of Done criada em `docs/DEFINITION_OF_DONE.md`.

## PASSO 2 — Hardening de Fluxos Críticos
- Orçamentos → Aprovar/Agendar → Wizard:
  - Validação backend centralizada de ocorrências (SPA/Transporte).
  - Idempotência por hash/metadata para agendamentos recorrentes.
  - Respostas com status HTTP apropriado (400/404/409).
- Undo schedule:
  - Status inválido agora retorna 409 (conflito) com mensagem clara.
- Transporte recorrente (pacotes):
  - Validação de motorista e payload duplicado.
  - Idempotência via detecção de agendamentos existentes.

## PASSO 3 — Refatoração Segura
- Regras/validações extraídas para módulos puros testáveis:
  - `backend/src/domain/scheduling/scheduleUtils.ts`
  - `backend/src/domain/recurrence/recurrenceUtils.ts`
- Testes unitários adicionados cobrindo validação, idempotência, recorrência e exigência de motorista.

## Evidence

### Comandos executados (resumo)
- `npm run lint`  
  Resultado: **0 erros**, **1168 warnings** (backend+frontend). Observação: warning do Node sobre `MODULE_TYPELESS_PACKAGE_JSON` em `backend/eslint.config.js`.
- `npm run typecheck`  
  Resultado: **passou** (backend + frontend usando `tsconfig.typecheck.json`).
- `npm run test`  
  Resultado: **passou** (backend jest + frontend `tsc --project tsconfig.typecheck.json`).  
  Observação: Jest reportou *open handles* (warning). Não falhou.
- `npm run test:ci -w backend`  
  Resultado: **passou** com `--detectOpenHandles` (nenhum handle aberto detectado).

### Arquivos alterados (principais)
- `docs/ENGINEERING_HARDENING_REPORT.md`
- `docs/DEFINITION_OF_DONE.md`
- `package.json`
- `frontend/package.json`
- `frontend/tsconfig.typecheck.json`
- `backend/package.json`
- `.github/workflows/ci.yml`
- `backend/jest.config.ts`
- `backend/eslint.config.js`
- `frontend/eslint.config.js`
- `backend/src/utils/httpError.ts`
- `backend/src/domain/scheduling/scheduleUtils.ts`
- `backend/src/domain/recurrence/recurrenceUtils.ts`
- `backend/src/controllers/schedulingController.ts`
- `backend/src/services/quoteService.ts`
- `backend/src/controllers/quoteController.ts`
- `backend/src/services/packageService.ts`
- `backend/src/controllers/packageController.ts`
- `backend/src/services/transportCalculationUnifiedService.ts`
- `backend/src/__tests__/scheduleUtils.test.ts`
- `backend/src/__tests__/recurrenceUtils.test.ts`
- `backend/src/__tests__/auth.test.ts`
- `backend/src/__tests__/manualQuote.test.ts`
- `backend/__tests__/transport-refinements.test.ts`
- `frontend/src/pages/staff/ServiceKanban.tsx`
- `frontend/src/components/modals/ManualQuoteModal.tsx`
- `frontend/src/components/modals/QuoteTypeSelectorModal.tsx`
- `frontend/src/components/staff/AppointmentFormModal.tsx`
- `frontend/src/components/staff/quote-editor/QuoteTypeSelector.tsx`
- `frontend/src/components/staff/quote-editor/TransportOnlyEditor.tsx`
- `frontend/src/components/staff/RecurrenceDetailModal.tsx`
- `frontend/src/components/ui/AppImage.tsx`
- `frontend/src/games/paciencia-pet/components/Card.tsx`
- `frontend/src/pages/staff/FinancialReports.tsx`
- `frontend/src/pages/staff/MobileFinancial.tsx`
- `frontend/src/pages/staff/QuoteEditor.tsx`
- `frontend/src/pages/staff/ServiceManager.tsx`
- `frontend/src/pages/staff/StaffDashboard.tsx`
- `frontend/src/pages/staff/transport/MobileTransport.tsx`
- `frontend/src/pages/staff/users/index.tsx`
- `frontend/src/pages/staff/users/utils/userHelpers.ts`
- `frontend/src/pages/staff/users/components/MobileUsers.tsx`

### Checklist Antes/Depois (segurança e previsibilidade)
**Antes**
- Sem idempotência explícita no agendamento de orçamentos/recorrências.
- Erros genéricos (`throw new Error`) sem status HTTP consistente.
- CI sem gate de lint/typecheck/test unificados.
- Testes unitários de recorrência/schedule inexistentes.

**Depois**
- Idempotência e hashing de schedule no backend.
- Validações de ocorrência e de motorista no backend.
- Erros padronizados com `HttpError` e status 400/404/409.
- CI com lint + typecheck + test (backend) e lint + typecheck + build (frontend).
- Testes unitários novos para recorrência e idempotência.

### Validação manual (passo a passo curto)
1. **Quote → Schedule**: agendar o mesmo orçamento duas vezes com mesmo `Idempotency-Key` e verificar que não duplica.
2. **Undo schedule**: tentar desfazer agendamento já cancelado e verificar erro 409.
3. **Recorrência transporte**: gerar recorrências até fim do mês e confirmar que não há duplicações.
