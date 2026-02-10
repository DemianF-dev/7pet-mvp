# Engineering Hardening Report (my7pet)

Date: 2026-02-10

## PASSO 0 — Diagnostico (curto e direto)

### Stack e Estrutura
- Monorepo com workspaces `frontend` e `backend` (npm, `package-lock.json` no root).
- Frontend: React + Vite + TypeScript + Tailwind (PWA via `vite-plugin-pwa`).
- Backend: Node.js + Express + TypeScript + Prisma + Postgres; Socket.io; Zod.
- Outras pastas: `api/`, `realtime/`, `shared/`, `scripts/`, `docs/`, `reports/`.

### Scripts Disponiveis (visao geral)
- Root: `dev:frontend`, `dev:backend`, `build:*`, `backup:db`, `restore:db`.
- Backend: `test`, `lint`, `build`, `vercel-build`, `security:*`, `rls:apply`.
- Frontend: `build`, `test` (tsc), `lint`.

### Padroes Atuais
- Backend organizado em `routes/`, `controllers/`, `services/`, `middlewares/`, `utils/`.
- Logica de negocio critica concentrada em servicos grandes (ex.: `quoteService.ts`).
- Frontend concentra muita regra em componentes/pages grandes (pouca extracao de modulos puros).

### Pontos Criticos (tamanho/complexidade)
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

### Areas de Alto Risco (fluxos)
- **Orcamentos -> Aprovar/Agendar -> Wizard -> Appointments/Legs**:
  - Logica pesada em `quoteService.ts` com multiplas ramificacoes e exclusoes em massa.
- **Undo schedule**:
  - Reversao em lote sem idempotencia explicita e validacoes reduzidas.
- **Transporte recorrente (geracao ate fim do mes)**:
  - Sinais de recorrencia estao espalhados; dependem de snapshots/metadata e agendamentos em lote.
- **Financeiro (Invoices/Quote status)**:
  - `invoiceRoutes.ts` contem multiplas mudancas de status e side-effects.

### Avaliacao Crua (sem anestesia)
Pontos bons:
- Prisma + transacoes: base solida para consistencia.
- Rotas separadas e uso de services sugere intencao de organizacao.
- Zod presente (potencial para validacao consistente).

Pontos ruins:
- Arquivos gigantes com regras misturadas (UI + regra + I/O) -> dificil de testar e propenso a regressao.
- Regras criticas de agenda/transporte sem idempotencia explicita.
- Erros em fluxos criticos sao `throw new Error` generico (pior para client e observabilidade).
- “Emergency routes” expostos no backend (risco de seguranca e vazamento de dados).

Nota (0-10):
- Estabilidade atual: 5.5
- Previsibilidade de fluxos criticos: 4.5
- Seguranca operacional (erro/observabilidade): 5.0
- Testabilidade: 4.0

## PASSO 1 — Guardrails de Qualidade (CI + padroes)
- Scripts padronizados adicionados no root: `lint`, `typecheck`, `test`, `check`.
- `frontend`/`backend` agora expoem `typecheck`.
- CI reforcado com lint + typecheck + test (backend) e lint + typecheck + build (frontend).
- Definition of Done criada em `docs/DEFINITION_OF_DONE.md`.

## PASSO 2 — Hardening de Fluxos Criticos
- Orcamentos -> Aprovar/Agendar -> Wizard:
  - Validacao backend centralizada de ocorrencias (SPA/Transporte).
  - Idempotencia por hash/metadata para agendamentos recorrentes.
  - Rejeicao de ocorrencias duplicadas no payload.
  - Respostas com status HTTP apropriado (400/404/409).
- Undo schedule:
  - Status invalido retorna 409 (conflito) com mensagem clara.
  - Justificativa obrigatoria retorna 400 com codigo padronizado.
- Transporte recorrente (pacotes):
  - Validacao de motorista e payload duplicado.
  - Idempotencia via deteccao de agendamentos existentes.

## PASSO 3 — Refatoracao Segura
- Regras/validacoes extraidas para modulos puros testaveis:
  - `backend/src/domain/scheduling/scheduleUtils.ts`
  - `backend/src/domain/recurrence/recurrenceUtils.ts`
- Testes unitarios adicionados cobrindo validacao, idempotencia, recorrencia e exigencia de motorista.
- Validacoes de agendamento e contrato centralizadas em modulos puros (appointmentValidation, contractValidation).
- Removida validacao duplicada no scheduleQuote (usa apenas scheduleUtils).

## Evidence

### Comandos executados (resumo)
- `npm run lint`
  Resultado: **0 erros**, **1168 warnings** (backend+frontend). Observacao: warning do Node sobre `MODULE_TYPELESS_PACKAGE_JSON` em `backend/eslint.config.js`.
- `npm run typecheck`
  Resultado: **passou** (backend + frontend usando `tsconfig.typecheck.json`).
- `npm run test`
  Resultado: **passou** (backend jest + frontend `tsc --project tsconfig.typecheck.json`).
  Observacao: Jest reportou *open handles* (warning). Nao falhou.
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

### Checklist Antes/Depois (seguranca e previsibilidade)
**Antes**
- Sem idempotencia explicita no agendamento de orcamentos/recorrencias.
- Erros genericos (`throw new Error`) sem status HTTP consistente.
- CI sem gate de lint/typecheck/test unificados.
- Testes unitarios de recorrencia/schedule inexistentes.

**Depois**
- Idempotencia e hashing de schedule no backend.
- Validacoes de ocorrencia e de motorista no backend (inclui duplicadas).
- Erros padronizados com `HttpError` e status 400/404/409.
- CI com lint + typecheck + test (backend) e lint + typecheck + build (frontend).
- Testes unitarios novos para recorrencia e idempotencia.

### Validacao manual (passo a passo curto)
1. **Quote -> Schedule**: agendar o mesmo orcamento duas vezes com mesmo `Idempotency-Key` e verificar que nao duplica.
2. **Undo schedule**: tentar desfazer agendamento ja cancelado e verificar erro 409.
3. **Recorrencia transporte**: gerar recorrencias ate fim do mes e confirmar que nao ha duplicacoes.




