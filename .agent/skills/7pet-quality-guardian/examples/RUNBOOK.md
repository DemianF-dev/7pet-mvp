# RUNBOOK — 7pet-quality-guardian

## Rodar auditoria completa

1) No terminal, na raiz do repo:
   bash .agent/skills/7pet-quality-guardian/scripts/qa_run.sh

2) Abrir pasta gerada:
   reports/qa/YYYY-MM-DD__HHmm/

3) Ler:
   - commands.log
   - backend_console_hits.txt (se existir)
   - baseline/ vs after/
   - lighthouse.mobile.html (se existir)

## Como usar em sprints

- Antes de um sprint: rodar e salvar baseline.
- Depois do sprint: rodar e comparar “after”.
- Se cair em produção: rodar smoke + verifier e localizar regressão.

## Política de commits

- 1 commit por correção (pequeno).
- Re-rodar gate que falhou.
- Atualizar evidence pack no final.
