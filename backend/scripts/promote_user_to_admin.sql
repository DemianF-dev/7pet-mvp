-- ============================================================================
-- PROMOVER USUÁRIO A ADMIN - oidemianf@gmail.com
-- Execute no SQL Editor do Supabase
-- ============================================================================

-- 1. Verificar role atual
SELECT 
  id,
  email,
  name,
  role,
  "createdAt"
FROM "User"
WHERE email = 'oidemianf@gmail.com';

-- 2. Atualizar para ADMIN (acesso irrestrito)
UPDATE "User"
SET 
  role = 'ADMIN',
  "updatedAt" = NOW()
WHERE email = 'oidemianf@gmail.com';

-- 3. Confirmar a alteração
SELECT 
  id,
  email,
  name,
  role,
  "updatedAt"
FROM "User"
WHERE email = 'oidemianf@gmail.com';

-- ============================================================================
-- Roles disponíveis no sistema:
-- - ADMIN: Acesso total (recomendado para você)
-- - GERENCIAL: Gestão + Operação
-- - FINANCEIRO: Financeiro + Leitura
-- - OPERACIONAL: Agendamentos + Serviços
-- - OPERADOR: Apenas visualização staff
-- - CLIENTE: Área do cliente apenas
-- ============================================================================
