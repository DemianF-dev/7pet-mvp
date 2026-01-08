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
-- 7. PUSH SUBSCRIPTION (User-owned)
-- ============================================================================

ALTER TABLE "PushSubscription" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_subscription_all_own" ON "PushSubscription";
CREATE POLICY "push_subscription_all_own"
ON "PushSubscription" FOR ALL TO authenticated
USING ("PushSubscription"."userId" = auth.uid()::text)
WITH CHECK ("PushSubscription"."userId" = auth.uid()::text);

-- ============================================================================
-- 8. METRIC (Staff read-only, system writes via service role)
-- ============================================================================

ALTER TABLE "Metric" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "metric_read_staff" ON "Metric";
CREATE POLICY "metric_read_staff"
ON "Metric" FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = auth.uid()::text
    AND "User".role IN ('ADMIN', 'GERENCIAL')
  )
);

-- ============================================================================
-- 9. FEED - POST (Staff can see, author can manage)
-- ============================================================================

ALTER TABLE "Post" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "post_read_staff" ON "Post";
CREATE POLICY "post_read_staff"
ON "Post" FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "post_manage_own" ON "Post";
CREATE POLICY "post_manage_own"
ON "Post" FOR ALL TO authenticated
USING ("Post"."authorId" = auth.uid()::text)
WITH CHECK ("Post"."authorId" = auth.uid()::text);

-- ============================================================================
-- 10. FEED - COMMENT
-- ============================================================================

ALTER TABLE "Comment" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comment_read_staff" ON "Comment";
CREATE POLICY "comment_read_staff"
ON "Comment" FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "comment_manage_own" ON "Comment";
CREATE POLICY "comment_manage_own"
ON "Comment" FOR ALL TO authenticated
USING ("Comment"."authorId" = auth.uid()::text)
WITH CHECK ("Comment"."authorId" = auth.uid()::text);

-- ============================================================================
-- 11. FEED - REACTION
-- ============================================================================

ALTER TABLE "Reaction" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reaction_read_staff" ON "Reaction";
CREATE POLICY "reaction_read_staff"
ON "Reaction" FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "reaction_manage_own" ON "Reaction";
CREATE POLICY "reaction_manage_own"
ON "Reaction" FOR ALL TO authenticated
USING ("Reaction"."authorId" = auth.uid()::text)
WITH CHECK ("Reaction"."authorId" = auth.uid()::text);

-- ============================================================================
-- 12. CHAT - CONVERSATION (Participants only)
-- ============================================================================

ALTER TABLE "Conversation" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversation_select_participants" ON "Conversation";
CREATE POLICY "conversation_select_participants"
ON "Conversation" FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "Participant"
    WHERE "Participant"."conversationId" = "Conversation".id
    AND "Participant"."userId" = auth.uid()::text
  )
);

-- ============================================================================
-- 13. CHAT - PARTICIPANT
-- ============================================================================

ALTER TABLE "Participant" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "participant_select_related" ON "Participant";
CREATE POLICY "participant_select_related"
ON "Participant" FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "Participant" AS p
    WHERE p."conversationId" = "Participant"."conversationId"
    AND p."userId" = auth.uid()::text
  )
  OR EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = auth.uid()::text
    AND "User".role = 'ADMIN'
  )
);

-- ============================================================================
-- 14. CHAT - MESSAGE
-- ============================================================================

ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "message_select_participants" ON "Message";
CREATE POLICY "message_select_participants"
ON "Message" FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "Participant"
    WHERE "Participant"."conversationId" = "Message"."conversationId"
    AND "Participant"."userId" = auth.uid()::text
  )
);

DROP POLICY IF EXISTS "message_insert_participants" ON "Message";
CREATE POLICY "message_insert_participants"
ON "Message" FOR INSERT TO authenticated
WITH CHECK (
  "Message"."senderId" = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM "Participant"
    WHERE "Participant"."conversationId" = "Message"."conversationId"
    AND "Participant"."userId" = auth.uid()::text
  )
);

-- ============================================================================
-- GRANT STATEMENTS 
-- ============================================================================

REVOKE ALL ON "PushSubscription" FROM PUBLIC;
REVOKE ALL ON "Metric" FROM PUBLIC;
REVOKE ALL ON "Post" FROM PUBLIC;
REVOKE ALL ON "Comment" FROM PUBLIC;
REVOKE ALL ON "Reaction" FROM PUBLIC;
REVOKE ALL ON "Conversation" FROM PUBLIC;
REVOKE ALL ON "Participant" FROM PUBLIC;
REVOKE ALL ON "Message" FROM PUBLIC;

GRANT SELECT, INSERT, UPDATE, DELETE ON "PushSubscription" TO authenticated;
GRANT SELECT ON "Metric" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "Post" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "Comment" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "Reaction" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "Conversation" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "Participant" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "Message" TO authenticated;

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
