# Skill: 7pet-quality-guardian

**Version:** 1.0.0  
**Scope:** 7Pet monorepo (frontend + backend)  
**Goal:** Executar auditoria profunda e testes completos com correção/otimização segura, gerando evidências e comparativos antes/depois.  
**Style:** Rigoroso, anti-alucinação, orientado a evidências.  
**Output:** Relatório + Evidence Pack + diffs/commits claros.

---

## 0) Filosofia da Skill (regras de ouro)

1. **Nunca “assumir” que está ok**. Sempre provar com logs/relatórios (evidence pack).
2. **O sistema nunca pode “ficar branco” no mobile**: sempre Loading/Error UI.
3. **Mudanças seguras primeiro** (lint/typecheck/build/test/e2e/perf/security) antes de refatoração grande.
4. **Nunca aplicar mudanças destrutivas em produção** (reset DB, migrations sem autorização, apagar dados).
5. **Tudo o que for feito precisa de evidência**: comando → saída → arquivo/linha → resultado.
6. **Isolar risco**: se uma correção for grande, fazer em commits pequenos e revalidar a cada etapa.
7. **PWA e Socket**: API e `/socket.io` nunca devem ser cacheados pelo Service Worker.

---

## 1) O que esta Skill cobre (escopo)

### 1.1 Gates automáticos (sempre rodar)

- **Lint + format** (auto-fix quando seguro)
- **Typecheck** (TS)
- **Build** (frontend e backend)
- **Unit tests** (backend e, se existir, frontend)
- **Integration tests** (API com DB de teste quando possível)
- **E2E tests** (Playwright — se ainda não existir, criar base e 2 fluxos críticos)
- **Security checks** (audit deps + logs sensíveis + JWT hardening checks)
- **Performance checks**:
  - Bundle size (tamanho do build)
  - Lighthouse Mobile (score e regressões)
  - PWA sanity (no-cache para API/socket)
- **Runtime sanity**:
  - `/health`, `/diag`
  - Socket handshake ok
  - Rotas principais não quebram no mobile

### 1.2 Pontos sensíveis do 7Pet (prioridade máxima)

- Estabilidade mobile: telas em branco, travamentos, chunk errors.
- PWA cache: não cachear API/socket.
- Socket.IO: loops de reconexão, CORS, handshake JWT, consumo de bateria.
- Calendários mobile: render compacto e scroll, sem “cascata”.
- Orçamentos/Agendamentos: status e transições corretas.
- Transporte: cálculo e fallbacks quando maps falha.
- Permissões: MASTER/admin/staff/client.
- Segurança: remover logs sensíveis (backend), JWT sign/verify com algoritmo fixo.
- Banco: Prisma schema consistente; evitar drift.

---

## 2) Como executar (modo operacional)

### 2.1 Execução padrão

Rodar:

- `.agent/skills/7pet-quality-guardian/scripts/qa_run.sh`

Ele deve:

1) Criar um diretório de evidências: `reports/qa/YYYY-MM-DD__HHmm/`
2) Rodar baseline (antes): perf + bundle + health
3) Rodar gates: lint → typecheck → tests → build → e2e → perf
4) Se falhar, entrar em loop de correção:
   - aplicar correções seguras
   - re-rodar gate que falhou
   - repetir até PASS ou até 3 ciclos (para evitar loop infinito)
5) Gerar `EVIDENCE.md` final e `SUMMARY.md` com:
   - o que foi alterado
   - quais arquivos
   - quais comandos
   - comparativo antes/depois

### 2.2 Políticas de correção automática

Pode auto-corrigir:

- eslint/prettier (fix)
- imports óbvios, tipos triviais
- remover console.log sensível em backend (ou mover para logger dev-only)
- corrigir config de PWA cache denylist

Não pode auto-corrigir sem pedir autorização explícita:

- migrations em DB de produção
- alterações estruturais grandes no schema
- upgrades de dependências com breaking changes
- refatorações grandes (ex: dividir controller gigante em 10 arquivos) — isso vira sprint própria

---

## 3) Evidence Pack (anti-alucinação)

Sempre gerar:

- `reports/qa/.../commands.log` (comandos executados)
- `reports/qa/.../gates.json` (PASS/FAIL por gate)
- `reports/qa/.../baseline/` e `after/`:
  - lighthouse report
  - bundle stats
  - health/diag responses (sanitizadas)
- `reports/qa/.../diff_summary.md` (principais mudanças)
- `reports/qa/.../risks.md` (riscos e mitigação)

E sempre rodar:

- `scripts/qa_verify_evidence.sh` (verificador de evidências e checks críticos)

---

## 4) Test Matrix (o que testar sempre)

Ver `resources/TEST_MATRIX.md`.  
Fluxos críticos mínimos:

- Login (cliente e staff) via Google (mock/flag) e via credenciais
- Navegar 3 telas no mobile sem branco
- Criar orçamento → mudar status → agendar
- Socket conecta pós-login e pausa no background
- Offline: banner + recovery, sem quebrar UI

---

## 5) Benchmark antes/depois (performance e estabilidade)

Comparar:

- Lighthouse Mobile score
- Tempo de build
- Bundle size
- Contagem de erros capturados (errorStore)
- Taxa de falhas de request (axios retry/timeout logs sanitizados)

---

## 6) Saídas esperadas (definition of done)

✅ PASS em lint, typecheck, build  
✅ PASS em unit tests (mínimo existente)  
✅ PASS em 2 E2E flows (mínimo)  
✅ Lighthouse Mobile without regression (> -5 pontos vs baseline)  
✅ Sem cache de `/api` e `/socket.io` no SW  
✅ `/health` e `/diag` respondem em prod/stage  
✅ Evidence Pack completo gerado

---

## 7) Extensões recomendadas (próximas evoluções)

- Sentry (quando autorizado): wiring no ErrorBoundary + release tags.
- Playwright completo (8 fluxos críticos).
- CI: GitHub Actions rodando essa suite em PR.
- Load test leve (k6) em endpoints críticos.
