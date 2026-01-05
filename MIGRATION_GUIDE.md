# 🚀 Guia de Migration - Fases 3 e 4

**Data:** 04/01/2026  
**Status:** Pendente de aplicação manual  

---

## ⚠️ Importante

A migration não pôde ser aplicada automaticamente devido a um erro de conexão com o banco de dados Supabase. Isso é comum em ambientes que usam connection pooling.

**Erro encontrado:**

```
Error: P3006
Migration failed to apply cleanly to the shadow database.
Error: Can't reach database server at aws-0-us-west-2.pooler.supabase.com:5432
```

---

## 📋 Mudanças no Schema

### Model Adicionado

```prisma
model Metric {
  id        String   @id @default(uuid())
  type      String   // request, security, database, system
  data      Json
  timestamp DateTime @default(now())
  
  @@index([type, timestamp])
  @@index([timestamp])
}
```

**Propósito:** Armazenar métricas de performance e segurança persistentemente.

---

## 🔧 Como Aplicar a Migration

### Opção 1: Via Prisma Migrate (Recomendado)

```bash
cd backend

# 1. Tentar com migrate dev
npx prisma migrate dev --name add_metric_model

# Se erro P3006 persistir, usar migrate deploy:
npx prisma migrate deploy

# Verificar status
npx prisma migrate status
```

---

### Opção 2: Aplicação Manual via SQL

Se `prisma migrate` continuar falhando, você pode aplicar manualmente via Supabase SQL Editor:

```sql
-- Criar tabela Metric
CREATE TABLE "Metric" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Metric_pkey" PRIMARY KEY ("id")
);

-- Criar índices
CREATE INDEX "Metric_type_timestamp_idx" ON "Metric"("type", "timestamp");
CREATE INDEX "Metric_timestamp_idx" ON "Metric"("timestamp");

-- Registrar migration no Prisma
INSERT INTO "_prisma_migrations" (
    "id",
    "checksum",
    "finished_at",
    "migration_name",
    "logs",
    "rolled_back_at",
    "started_at",
    "applied_steps_count"
) VALUES (
    gen_random_uuid()::text,
    '0',
    now(),
    '20260104_add_metric_model',
    NULL,
    NULL,
    now(),
    1
);
```

**Passos:**

1. Acessar [Supabase Dashboard](https://app.supabase.com)
2. Ir em SQL Editor
3. Executar o SQL acima
4. Executar `npx prisma generate` localmente

---

### Opção 3: Alterar Configuração do Prisma

Se o erro for devido ao pooler, você pode tentar usar `directUrl`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")      // pooler
  directUrl = env("DIRECT_URL")       // conexão direta
}
```

**Em .env:**

```env
# Connection pooler (para app)
DATABASE_URL=postgresql://postgres.xxx:xxx@aws-0-us-west-2.pooler.supabase.com:5432/postgres

# Direct connection (para migrations)
DIRECT_URL=postgresql://postgres.xxx:xxx@aws-0-us-west-2.aws.supabase.co:5432/postgres
```

**Depois:**

```bash
npx prisma migrate dev --name add_metric_model
```

---

## ✅ Verificar Migration Aplicada

Após aplicar a migration por qualquer método:

```bash
# Verificar que a migration foi aplicada
npx prisma migrate status

# Deve retornar algo como:
# ✓ Database schema is in sync with migration files

# Regenerar Prisma Client
npx prisma generate
```

---

## 🧪 Testar Persistência de Métricas

```bash
# Executar aplicação em dev
npm run dev

# Fazer algumas requisições (>100) para trigger persistência

# Verificar no banco via Supabase Dashboard ou SQL:
SELECT COUNT(*) FROM "Metric";
SELECT * FROM "Metric" ORDER BY timestamp DESC LIMIT 10;
```

---

## 📊 O Que a Migration Faz

1. **Cria tabela `Metric`** com colunas:
   - `id`: UUID único
   - `type`: Tipo de métrica (request, security, database, system)
   - `data`: JSON com dados da métrica
   - `timestamp`: Data/hora da métrica

2. **Cria 2 índices** para otimizar queries:
   - `(type, timestamp)`: Buscar métricas por tipo em período
   - `(timestamp)`: Ordenar por data

3. **Permite persistência** das métricas coletadas pelo `metricsService`

---

## 🚨 Troubleshooting

### Erro: "Can't reach database server"

**Causa:** Connection pooler não permite shadow database

**Solução:** Use `directUrl` ou aplique manualmente via SQL

---

### Erro: "Migration already applied"

**Causa:** Migration já foi aplicada anteriormente

**Solução:**

```bash
npx prisma migrate resolve --applied 20260104_add_metric_model
```

---

### Erro: "Shadow database is not empty"

**Causa:** Banco shadow tem dados

**Solução:**

```bash
# Usar --skip-seed e --skip-generate
npx prisma migrate dev --name add_metric_model --skip-seed --skip-generate

# Ou resetar shadow database (cuidado!)
npx prisma migrate reset --force
```

---

## 📝 Checklist Pós-Migration

Após aplicar a migration com sucesso:

- [ ] Verificar tabela Metric existe no banco
- [ ] Verificar índices foram criados
- [ ] Executar `npx prisma generate`
- [ ] Reiniciar aplicação
- [ ] Fazer requisições e verificar métricas sendo salvas
- [ ] Verificar logs não mostram erros de persistência
- [ ] Testar `metricsService.cleanupOldMetrics()`
- [ ] Testar `metricsService.getPersistedMetricsCount()`

---

## 💡 Recomendação

**Para ambiente de produção:**

1. Teste a migration em **desenvolvimento** primeiro
2. Faça **backup do banco** antes de aplicar em produção
3. Use `npx prisma migrate deploy` em produção (não `migrate dev`)
4. Monitore logs após aplicação

**Comando para produção (Vercel):**

```bash
# No vercel-build script do package.json
"vercel-build": "prisma generate && prisma migrate deploy"
```

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique logs completos do erro
2. Teste conexão direta com banco
3. Verifique credenciais DATABASE_URL
4. Considere aplicação manual via SQL
5. Entre em contato com suporte Supabase se necessário

---

**Criado por:** Segurança Digital Specialist  
**Data:** 04/01/2026  
**Status:** Documentado e pronto para aplicação manual
