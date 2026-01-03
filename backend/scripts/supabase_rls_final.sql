-- ============================================================================
-- RLS FINAL FIX - 7PET MVP (Zero Warnings)
-- Execute este script diretamente no SQL Editor do Supabase
-- ============================================================================
-- Política ÚNICA por operação (SELECT, INSERT, UPDATE, DELETE)
-- ============================================================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "transport_select_policy" ON "TransportSettings";
DROP POLICY IF EXISTS "transport_modify_policy" ON "TransportSettings";
DROP POLICY IF EXISTS "product_select_policy" ON "Product";
DROP POLICY IF EXISTS "product_modify_policy" ON "Product";
DROP POLICY IF EXISTS "role_select_policy" ON "RolePermission";
DROP POLICY IF EXISTS "role_modify_policy" ON "RolePermission";

-- ============================================================================
-- 1. TRANSPORT SETTINGS - Políticas separadas por operação
-- ============================================================================

CREATE POLICY "transport_select" ON "TransportSettings"
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('OPERADOR', 'OPERACIONAL', 'FINANCEIRO', 'GERENCIAL', 'ADMIN')
  )
);

CREATE POLICY "transport_insert" ON "TransportSettings"
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL')
  )
);

CREATE POLICY "transport_update" ON "TransportSettings"
FOR UPDATE TO authenticated
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

CREATE POLICY "transport_delete" ON "TransportSettings"
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role = 'ADMIN'
  )
);

-- ============================================================================
-- 2. PRODUCT - Políticas separadas por operação
-- ============================================================================

CREATE POLICY "product_select" ON "Product"
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "product_insert" ON "Product"
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role IN ('ADMIN', 'GERENCIAL')
  )
);

CREATE POLICY "product_update" ON "Product"
FOR UPDATE TO authenticated
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

CREATE POLICY "product_delete" ON "Product"
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role = 'ADMIN'
  )
);

-- ============================================================================
-- 3. ROLE PERMISSION - Políticas separadas por operação
-- ============================================================================

CREATE POLICY "roleperm_select" ON "RolePermission"
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "roleperm_insert" ON "RolePermission"
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role = 'ADMIN'
  )
);

CREATE POLICY "roleperm_update" ON "RolePermission"
FOR UPDATE TO authenticated
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

CREATE POLICY "roleperm_delete" ON "RolePermission"
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())::text
    AND "User".role = 'ADMIN'
  )
);

-- ============================================================================
-- FIM - ZERO WARNINGS!
-- ============================================================================
-- Cada operação (SELECT, INSERT, UPDATE, DELETE) tem UMA política única
-- Todas usam (SELECT auth.uid()) para performance otimizada
-- ============================================================================
