---
name: qa-evidence-pack
description: Gera o pacote de evidências de QA estruturado para validação de tarefas e deploys no 7Pet.
---

# 🛡️ Evidence Pack — 7Pet QA Skill

Esta skill deve ser invocada ao final de cada tarefa significativa ou antes de um deploy para gerar um relatório de conformidade técnica e funcional.

## 📋 Regras de Ouro

1. **NÃO retire nenhuma seção** do template solicitado pelo usuário.
2. **Seja honesto:** Se um gate falhou, marque como FAIL e descreva a mitigação.
3. **Automatize:** Sempre que possível, use os scripts da skill para coletar dados reais.

## 📝 Template do Relatório (QA-REPORT.md)

Sempre gere o arquivo final `QA-REPORT.md` (ou anexe à conversa) seguindo rigorosamente este formato:

```markdown
# Evidence Pack — 7Pet QA

## Executive Summary
- Data: {{CURRENT_DATE}}
- Branch/Commit: {{GIT_BRANCH_OR_COMMIT}}
- Resultado final: {{PASS_OR_FAIL}}
- Principais mudanças: {{SUMMARY_OF_CHANGES}}

## Gates
- Lint: {{STATUS_LINT}}
- Typecheck: {{STATUS_TYPECHECK}}
- Tests: {{STATUS_TESTS}}
- Build: {{STATUS_BUILD}}
- E2E: {{STATUS_E2E}}
- Perf: {{STATUS_PERF}}

## Before vs After
- Lighthouse Mobile: {{METRIC_LIGHTHOUSE}}
- Bundle size: {{METRIC_BUNDLE}}
- Errors captured (últimas 20): {{METRIC_ERRORS}}
- Latência API (health): {{METRIC_LATENCY}}

## Mudanças com evidência
- Arquivo: {{FILE_PATH}}
- Linha: {{LINE_NUMBER}}
- Comando: {{COMMAND_USED}}
- Output: 
```text
{{COMMAND_OUTPUT}}
```

## Riscos e mitigação

- Risco: {{RISK_DESCRIPTION}}
- Mitigação: {{MITIGATION_STRATEGY}}

```

## 🛠️ Procedimento de Coleta
1. **Gates:** Rode `npm run build` e `npm run lint` no frontend/backend.
2. **Metrics:** 
   - Execute `.agent/skills/qa-evidence-pack/scripts/collect-metrics.js` para obter latência e tamanho de bundle.
   - Use `list_dir` para verificar o tamanho da pasta `dist`.
3. **Evidência:** Capture o output de comandos críticos (ex: `npx prisma db push`) para incluir no relatório.

> [!IMPORTANT]
> O "Resultado Final" deve ser **PASS** apenas se todos os Gates críticos estiverem verdes. Caso contrário, deve ser **FAIL** com uma justificativa clara em "Riscos e Mitigação".
