-- ============================================================================
-- RLS POLICIES FOR 7PET MVP - Complete Configuration
-- ============================================================================
-- This script enables Row Level Security and creates appropriate policies
-- for all public tables in the 7Pet system.
-- ============================================================================

-- ============================================================================
-- 1. TRANSPORT SETTINGS (Global Configuration - Admin/Manager Only)
-- ============================================================================

ALTER TABLE "TransportSettings" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transport_settings_read_staff" ON "TransportSettings";
CREATE POLICY "transport_settings_read_staff"
ON "TransportSettings" FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = auth.uid()::text
    AND "User".role IN ('OPERADOR', 'OPERACIONAL', 'FINANCEIRO', 'GERENCIAL', 'ADMIN')
  )
);

DROP POLICY IF EXISTS "transport_settings_update_admin" ON "TransportSettings";
CREATE POLICY "transport_settings_update_admin"
ON "TransportSettings" FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = auth.uid()::text
    AND "User".role IN ('ADMIN', 'GERENCIAL')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = auth.uid()::text
    AND "User".role IN ('ADMIN', 'GERENCIAL')
  )
);

DROP POLICY IF EXISTS "transport_settings_insert_admin" ON "TransportSettings";
CREATE POLICY "transport_settings_insert_admin"
ON "TransportSettings" FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = auth.uid()::text
    AND "User".role = 'ADMIN'
  )
);

DROP POLICY IF EXISTS "transport_settings_delete_admin" ON "TransportSettings";
CREATE POLICY "transport_settings_delete_admin"
ON "TransportSettings" FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = auth.uid()::text
    AND "User".role = 'ADMIN'
  )
);

-- ============================================================================
-- 2. BUG REPORT (User-owned + Staff can see all)
-- ============================================================================

ALTER TABLE "BugReport" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bug_report_read_own_or_staff" ON "BugReport";
CREATE POLICY "bug_report_read_own_or_staff"
ON "BugReport" FOR SELECT TO authenticated
USING (
  "BugReport"."userId" = auth.uid()::text
  OR EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = auth.uid()::text
    AND "User".role IN ('OPERADOR', 'OPERACIONAL', 'FINANCEIRO', 'GERENCIAL', 'ADMIN')
  )
);

DROP POLICY IF EXISTS "bug_report_insert_own" ON "BugReport";
CREATE POLICY "bug_report_insert_own"
ON "BugReport" FOR INSERT TO authenticated
WITH CHECK ("BugReport"."userId" = auth.uid()::text);

DROP POLICY IF EXISTS "bug_report_update_own_or_admin" ON "BugReport";
CREATE POLICY "bug_report_update_own_or_admin"
ON "BugReport" FOR UPDATE TO authenticated
USING (
  "BugReport"."userId" = auth.uid()::text
  OR EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = auth.uid()::text
    AND "User".role = 'ADMIN'
  )
)
WITH CHECK (
  "BugReport"."userId" = auth.uid()::text
  OR EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = auth.uid()::text
    AND "User".role = 'ADMIN'
  )
);

DROP POLICY IF EXISTS "bug_report_delete_admin" ON "BugReport";
CREATE POLICY "bug_report_delete_admin"
ON "BugReport" FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = auth.uid()::text
    AND "User".role = 'ADMIN'
  )
);

-- ============================================================================
-- 3. AUTHENTICATOR (User-owned WebAuthn credentials)
-- ============================================================================

ALTER TABLE "Authenticator" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticator_read_own" ON "Authenticator";
CREATE POLICY "authenticator_read_own"
ON "Authenticator" FOR SELECT TO authenticated
USING ("Authenticator"."userId" = auth.uid()::text);

DROP POLICY IF EXISTS "authenticator_insert_own" ON "Authenticator";
CREATE POLICY "authenticator_insert_own"
ON "Authenticator" FOR INSERT TO authenticated
WITH CHECK ("Authenticator"."userId" = auth.uid()::text);

DROP POLICY IF EXISTS "authenticator_update_own" ON "Authenticator";
CREATE POLICY "authenticator_update_own"
ON "Authenticator" FOR UPDATE TO authenticated
USING ("Authenticator"."userId" = auth.uid()::text)
WITH CHECK ("Authenticator"."userId" = auth.uid()::text);

DROP POLICY IF EXISTS "authenticator_delete_own" ON "Authenticator";
CREATE POLICY "authenticator_delete_own"
ON "Authenticator" FOR DELETE TO authenticated
USING ("Authenticator"."userId" = auth.uid()::text);

-- ============================================================================
-- 4. PRODUCT (Global data - Staff can manage)
-- ============================================================================

ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_read_all_authenticated" ON "Product";
CREATE POLICY "product_read_all_authenticated"
ON "Product" FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "product_insert_admin" ON "Product";
CREATE POLICY "product_insert_admin"
ON "Product" FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = auth.uid()::text
    AND "User".role IN ('ADMIN', 'GERENCIAL')
  )
);

DROP POLICY IF EXISTS "product_update_admin" ON "Product";
CREATE POLICY "product_update_admin"
ON "Product" FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = auth.uid()::text
    AND "User".role IN ('ADMIN', 'GERENCIAL')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = auth.uid()::text
    AND "User".role IN ('ADMIN', 'GERENCIAL')
  )
);

DROP POLICY IF EXISTS "product_delete_admin" ON "Product";
CREATE POLICY "product_delete_admin"
ON "Product" FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = auth.uid()::text
    AND "User".role = 'ADMIN'
  )
);

-- ============================================================================
-- 5. AUDIT LOG (Admin/Manager read-only, system writes via service role)
-- ============================================================================

ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_log_read_admin" ON "AuditLog";
CREATE POLICY "audit_log_read_admin"
ON "AuditLog" FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = auth.uid()::text
    AND "User".role IN ('ADMIN', 'GERENCIAL')
  )
);

-- Note: INSERT/UPDATE/DELETE should be done via service role (bypasses RLS)
-- No policies needed for writes - prevents accidental manipulation

-- ============================================================================
-- 6. ROLE PERMISSION (Global configuration - Admin only can modify)
-- ============================================================================

ALTER TABLE "RolePermission" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "role_permission_read_all_authenticated" ON "RolePermission";
CREATE POLICY "role_permission_read_all_authenticated"
ON "RolePermission" FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "role_permission_insert_admin" ON "RolePermission";
CREATE POLICY "role_permission_insert_admin"
ON "RolePermission" FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = auth.uid()::text
    AND "User".role = 'ADMIN'
  )
);

DROP POLICY IF EXISTS "role_permission_update_admin" ON "RolePermission";
CREATE POLICY "role_permission_update_admin"
ON "RolePermission" FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = auth.uid()::text
    AND "User".role = 'ADMIN'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = auth.uid()::text
    AND "User".role = 'ADMIN'
  )
);

DROP POLICY IF EXISTS "role_permission_delete_admin" ON "RolePermission";
CREATE POLICY "role_permission_delete_admin"
ON "RolePermission" FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = auth.uid()::text
    AND "User".role = 'ADMIN'
  )
);

-- ============================================================================
-- GRANT STATEMENTS (Minimum necessary privileges)
-- ============================================================================

REVOKE ALL ON "TransportSettings" FROM PUBLIC;
REVOKE ALL ON "BugReport" FROM PUBLIC;
REVOKE ALL ON "Authenticator" FROM PUBLIC;
REVOKE ALL ON "Product" FROM PUBLIC;
REVOKE ALL ON "AuditLog" FROM PUBLIC;
REVOKE ALL ON "RolePermission" FROM PUBLIC;

GRANT SELECT, INSERT, UPDATE, DELETE ON "TransportSettings" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "BugReport" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "Authenticator" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "Product" TO authenticated;
GRANT SELECT ON "AuditLog" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "RolePermission" TO authenticated;

-- Note: RLS policies will enforce the actual permissions above

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS "idx_user_id_rls" ON "User"(id);
CREATE INDEX IF NOT EXISTS "idx_user_role_rls" ON "User"(role);
CREATE INDEX IF NOT EXISTS "idx_bugreport_userid" ON "BugReport"("userId");
CREATE INDEX IF NOT EXISTS "idx_authenticator_userid" ON "Authenticator"("userId");

-- ============================================================================
-- END OF RLS CONFIGURATION
-- ============================================================================
