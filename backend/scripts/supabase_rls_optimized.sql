-- ============================================================================
-- RLS OPTIMIZATION - 7PET MVP (Performance Fixes)
-- Execute este script diretamente no SQL Editor do Supabase
-- ============================================================================
-- Este script corrige avisos de performance das políticas RLS
-- ============================================================================

-- Remover todas as políticas antigas primeiro
DROP POLICY IF EXISTS "transport_read_staff" ON "TransportSettings";
DROP POLICY IF EXISTS "transport_write_admin" ON "TransportSettings";
DROP POLICY IF EXISTS "bug_read" ON "BugReport";
DROP POLICY IF EXISTS "bug_insert" ON "BugReport";
DROP POLICY IF EXISTS "bug_update" ON "BugReport";
DROP POLICY IF EXISTS "bug_delete" ON "BugReport";
DROP POLICY IF EXISTS "auth_all_own" ON "Authenticator";
DROP POLICY IF EXISTS "product_read_all" ON "Product";
DROP POLICY IF EXISTS "product_write_admin" ON "Product";
DROP POLICY IF EXISTS "audit_read_admin" ON "AuditLog";
DROP POLICY IF EXISTS "role_read_all" ON "RolePermission";
DROP POLICY IF EXISTS "role_write_admin" ON "RolePermission";

-- ============================================================================
-- 1. TRANSPORT SETTINGS - OTIMIZADO (Política única combinada)
-- ============================================================================

-- Política única para SELECT (combina leitura staff + escrita admin)
CREATE POLICY "transport_select_policy" ON "TransportSettings"
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('OPERADOR', 'OPERACIONAL', 'FINANCEIRO', 'GERENCIAL', 'ADMIN')
  )
);

-- Política separada para INSERT/UPDATE/DELETE (apenas admin/gerencial)
CREATE POLICY "transport_modify_policy" ON "TransportSettings"
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL')
  )
);

-- ============================================================================
-- 2. BUG REPORT - OTIMIZADO
-- ============================================================================

CREATE POLICY "bug_select_policy" ON "BugReport"
FOR SELECT TO authenticated
USING (
  "BugReport"."userId" = (SELECT auth.uid())::text
  OR EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('OPERADOR', 'OPERACIONAL', 'FINANCEIRO', 'GERENCIAL', 'ADMIN')
  )
);

CREATE POLICY "bug_insert_policy" ON "BugReport"
FOR INSERT TO authenticated
WITH CHECK ("BugReport"."userId" = (SELECT auth.uid())::text);

CREATE POLICY "bug_update_policy" ON "BugReport"
FOR UPDATE TO authenticated
USING (
  "BugReport"."userId" = (SELECT auth.uid())::text
  OR EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role = 'ADMIN'
  )
)
WITH CHECK (
  "BugReport"."userId" = (SELECT auth.uid())::text
  OR EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role = 'ADMIN'
  )
);

CREATE POLICY "bug_delete_policy" ON "BugReport"
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role = 'ADMIN'
  )
);

-- ============================================================================
-- 3. AUTHENTICATOR - OTIMIZADO
-- ============================================================================

CREATE POLICY "authenticator_own_policy" ON "Authenticator"
FOR ALL TO authenticated
USING ("Authenticator"."userId" = (SELECT auth.uid())::text)
WITH CHECK ("Authenticator"."userId" = (SELECT auth.uid())::text);

-- ============================================================================
-- 4. PRODUCT - OTIMIZADO (Política única combinada)
-- ============================================================================

-- Política única para SELECT (permite todos autenticados)
CREATE POLICY "product_select_policy" ON "Product"
FOR SELECT TO authenticated
USING (true);

-- Política separada para INSERT/UPDATE/DELETE
CREATE POLICY "product_modify_policy" ON "Product"
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL')
  )
);

-- ============================================================================
-- 5. AUDIT LOG - OTIMIZADO
-- ============================================================================

CREATE POLICY "audit_select_policy" ON "AuditLog"
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL')
  )
);

-- ============================================================================
-- 6. ROLE PERMISSION - OTIMIZADO (Política única combinada)
-- ============================================================================

-- Política única para SELECT (permite todos autenticados)
CREATE POLICY "role_select_policy" ON "RolePermission"
FOR SELECT TO authenticated
USING (true);

-- Política separada para INSERT/UPDATE/DELETE
CREATE POLICY "role_modify_policy" ON "RolePermission"
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role = 'ADMIN'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role = 'ADMIN'
  )
);

-- ============================================================================
-- FIM - RLS Otimizado para Performance!
-- ============================================================================
-- Todas as políticas agora usam (SELECT auth.uid()) para melhor performance
-- Políticas duplicadas foram combinadas em políticas únicas
-- ============================================================================
