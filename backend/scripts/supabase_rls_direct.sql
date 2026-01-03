-- ============================================================================
-- RLS CONFIGURATION - 7PET MVP
-- Execute este script diretamente no SQL Editor do Supabase
-- ============================================================================

-- 1. TRANSPORT SETTINGS
ALTER TABLE "TransportSettings" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transport_read_staff" ON "TransportSettings" FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM "User" WHERE "User".id = auth.uid()::text AND "User".role IN ('OPERADOR', 'OPERACIONAL', 'FINANCEIRO', 'GERENCIAL', 'ADMIN')));

CREATE POLICY "transport_write_admin" ON "TransportSettings" FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM "User" WHERE "User".id = auth.uid()::text AND "User".role IN ('ADMIN', 'GERENCIAL')))
WITH CHECK (EXISTS (SELECT 1 FROM "User" WHERE "User".id = auth.uid()::text AND "User".role IN ('ADMIN', 'GERENCIAL')));

-- 2. BUG REPORT
ALTER TABLE "BugReport" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bug_read" ON "BugReport" FOR SELECT TO authenticated
USING ("BugReport"."userId" = auth.uid()::text OR EXISTS (SELECT 1 FROM "User" WHERE "User".id = auth.uid()::text AND "User".role IN ('OPERADOR', 'OPERACIONAL', 'FINANCEIRO', 'GERENCIAL', 'ADMIN')));

CREATE POLICY "bug_insert" ON "BugReport" FOR INSERT TO authenticated
WITH CHECK ("BugReport"."userId" = auth.uid()::text);

CREATE POLICY "bug_update" ON "BugReport" FOR UPDATE TO authenticated
USING ("BugReport"."userId" = auth.uid()::text OR EXISTS (SELECT 1 FROM "User" WHERE "User".id = auth.uid()::text AND "User".role = 'ADMIN'))
WITH CHECK ("BugReport"."userId" = auth.uid()::text OR EXISTS (SELECT 1 FROM "User" WHERE "User".id = auth.uid()::text AND "User".role = 'ADMIN'));

CREATE POLICY "bug_delete" ON "BugReport" FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM "User" WHERE "User".id = auth.uid()::text AND "User".role = 'ADMIN'));

-- 3. AUTHENTICATOR
ALTER TABLE "Authenticator" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all_own" ON "Authenticator" FOR ALL TO authenticated
USING ("Authenticator"."userId" = auth.uid()::text)
WITH CHECK ("Authenticator"."userId" = auth.uid()::text);

-- 4. PRODUCT
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_read_all" ON "Product" FOR SELECT TO authenticated USING (true);

CREATE POLICY "product_write_admin" ON "Product" FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM "User" WHERE "User".id = auth.uid()::text AND "User".role IN ('ADMIN', 'GERENCIAL')))
WITH CHECK (EXISTS (SELECT 1 FROM "User" WHERE "User".id = auth.uid()::text AND "User".role IN ('ADMIN', 'GERENCIAL')));

-- 5. AUDIT LOG
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_read_admin" ON "AuditLog" FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM "User" WHERE "User".id = auth.uid()::text AND "User".role IN ('ADMIN', 'GERENCIAL')));

-- 6. ROLE PERMISSION
ALTER TABLE "RolePermission" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "role_read_all" ON "RolePermission" FOR SELECT TO authenticated USING (true);

CREATE POLICY "role_write_admin" ON "RolePermission" FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM "User" WHERE "User".id = auth.uid()::text AND "User".role = 'ADMIN'))
WITH CHECK (EXISTS (SELECT 1 FROM "User" WHERE "User".id = auth.uid()::text AND "User".role = 'ADMIN'));

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS "idx_user_id_rls" ON "User"(id);
CREATE INDEX IF NOT EXISTS "idx_user_role_rls" ON "User"(role);

-- ============================================================================
-- FIM - RLS Configurado!
-- ============================================================================
