-- Script para migrar dados existentes de ROLE para DIVISION
-- Execute este SQL no Supabase SQL Editor

-- 1. Copiar valores de role para division para usuários que não têm division
UPDATE "User" 
SET "division" = "role" 
WHERE "division" IS NULL OR "division" = 'CLIENTE';

-- 2. Limpar o campo role (agora será usado só para cargo livre)
UPDATE "User" 
SET "role" = NULL 
WHERE "role" IN ('OPERACIONAL', 'GESTAO', 'ADMIN', 'SPA', 'MASTER', 'GERENTE', 'LOGISTICA', 'COMERCIAL', 'DIRETORIA');

-- 3. Verificar os resultados
SELECT 
    email, 
    division, 
    role,
    "createdAt"
FROM "User" 
WHERE division != 'CLIENTE'
ORDER BY "createdAt" DESC
LIMIT 20;

-- Resultado esperado:
-- division = divisão do usuário (SPA, COMERCIAL, etc)
-- role = cargo específico (Tosador, Atendente, etc) ou NULL
