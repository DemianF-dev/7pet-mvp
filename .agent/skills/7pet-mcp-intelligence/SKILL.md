---
name: 7pet-mcp-intelligence
description: Habilita inteligência de dados em tempo real conectando o assistente ao banco de dados e logs do sistema, permitindo diagnósticos precisos e insights de negócio.
---

# 7Pet MCP Intelligence Skill

Esta skill transforma o Antigravidade em um analista de dados e infraestrutura em tempo real para o ecossistema 7Pet. Ela utiliza o **Model Context Protocol (MCP)** e integrações diretas com o Prisma para fornecer insights baseados em fatos, não apenas em código estático.

## 1. Capacidades Ativadas

- **Data-Driven Diagnostics**: Capacidade de consultar o banco de dados (via scripts seguros) para validar estados de recursos, usuários e transações.
- **Log Correlation**: Analisa logs do backend e do Codex para identificar padrões de erro ou gargalos de performance.
- **Resource Analytics**: Identifica rapidamente itens críticos (ex: baixo estoque, agendamentos pendentes) para apoiar decisões de desenvolvimento.

## 2. Ferramentas Integradas

- **Prisma Client**: Interface primária para leitura de dados.
- **Codex CLI**: Usado para gerar consultas SQL complexas e interpretar logs de sistema.
- **Scripts de Saúde**: Localizados em `scripts/`, permitem scans rápidos de integridade.

## 3. Comandos e Workflows Digitais

Ao operar com esta skill, o assistente pode:

- `Consultar Schema`: Analisar o `schema.prisma` para entender relações antes de qualquer mudança.
- `Scan de Dados`: Executar scripts que verificam inconsistências no banco (ex: órfãos em faturamento).
- `Contexto Real`: Usar dados reais do banco para sugerir correções de bugs relatados pelo usuário.

## 4. Segurança e Privacidade (Data Guard)

1. **ReadOnly Mode**: Por padrão, consultas de inteligência de dados devem ser de leitura. Mudanças via MCP exigem confirmação explícita.
2. **PII Masking**: Nunca exibir senhas, tokens ou documentos completos (CPF/RG) nos logs da conversa.
3. **Audit Log**: Toda consulta estruturada deve ser registrada internamente para fins de auditoria.

## 5. Como usar

Peça ao Antigravidade:

- "Analise o estado atual dos agendamentos no banco."
- "Verifique se há inconsistências entre o modelo de User e Staff."
- "Quais são os endpoints com mais erros nos últimos logs?"
