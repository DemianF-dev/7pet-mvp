---
description: PROTEÇÃO OBRIGATÓRIA - Operações de banco de dados
---

# ⚠️ REGRAS DE SEGURANÇA PARA BANCO DE DADOS

## 🚫 COMANDOS PROIBIDOS (NUNCA EXECUTAR SEM BACKUP)

1. `prisma db push` - PODE APAGAR DADOS se houver mudanças destrutivas
2. `prisma migrate reset` - APAGA TODOS OS DADOS
3. `prisma migrate dev` com shadow database - Pode causar perda de dados
4. Qualquer comando com `--force-reset` ou `--force`

## ✅ PROCEDIMENTO SEGURO PARA ALTERAÇÕES NO SCHEMA

### ANTES de qualquer mudança no schema.prisma

```bash
// turbo
# 1. SEMPRE fazer backup primeiro
npx ts-node scripts/backup-database.ts

# 2. Verificar quantidade de registros
npx ts-node scripts/check-db-counts.ts
```

### Para ADICIONAR novos modelos/campos

```bash
# Use migrate dev com nome descritivo (CRIA migration sem apagar dados)
npx prisma migrate dev --name add_nome_do_campo --create-only

# Revise o SQL gerado em prisma/migrations/
# Depois aplique:
npx prisma migrate deploy
```

### Para ALTERAR campos existentes

1. Crie a migration manualmente em prisma/migrations/
2. NUNCA use --force ou --force-reset
3. Teste em ambiente de desenvolvimento primeiro

## 🔐 BACKUP AUTOMÁTICO

O script `scripts/backup-database.ts` deve ser executado:

- Antes de qualquer alteração no schema
- Diariamente via cron job
- Antes de deploys em produção

## 📊 VERIFICAÇÃO PÓS-OPERAÇÃO

Sempre execute após qualquer operação de banco:

```bash
npx ts-node scripts/check-db-counts.ts
```

Se houver perda de dados, restaure imediatamente do último backup.
