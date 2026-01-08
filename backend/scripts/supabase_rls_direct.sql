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

-- 7. PUSH SUBSCRIPTION
ALTER TABLE "PushSubscription" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "push_all_own" ON "PushSubscription" FOR ALL TO authenticated USING ("PushSubscription"."userId" = auth.uid()::text) WITH CHECK ("PushSubscription"."userId" = auth.uid()::text);

-- 8. METRIC
ALTER TABLE "Metric" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "metric_read_admin" ON "Metric" FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM "User" WHERE "User".id = auth.uid()::text AND "User".role IN ('ADMIN', 'GERENCIAL')));

-- 9. FEED
ALTER TABLE "Post" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "post_read" ON "Post" FOR SELECT TO authenticated USING (true);
CREATE POLICY "post_manage_own" ON "Post" FOR ALL TO authenticated USING ("Post"."authorId" = auth.uid()::text) WITH CHECK ("Post"."authorId" = auth.uid()::text);

ALTER TABLE "Comment" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comment_read" ON "Comment" FOR SELECT TO authenticated USING (true);
CREATE POLICY "comment_manage_own" ON "Comment" FOR ALL TO authenticated USING ("Comment"."authorId" = auth.uid()::text) WITH CHECK ("Comment"."authorId" = auth.uid()::text);

ALTER TABLE "Reaction" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reaction_read" ON "Reaction" FOR SELECT TO authenticated USING (true);
CREATE POLICY "reaction_manage_own" ON "Reaction" FOR ALL TO authenticated USING ("Reaction"."authorId" = auth.uid()::text) WITH CHECK ("Reaction"."authorId" = auth.uid()::text);

-- 10. CHAT
ALTER TABLE "Conversation" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conv_select" ON "Conversation" FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM "Participant" WHERE "Participant"."conversationId" = "Conversation".id AND "Participant"."userId" = auth.uid()::text));

ALTER TABLE "Participant" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "part_select" ON "Participant" FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM "Participant" AS p WHERE p."conversationId" = "Participant"."conversationId" AND p."userId" = auth.uid()::text) OR EXISTS (SELECT 1 FROM "User" WHERE "User".id = auth.uid()::text AND "User".role = 'ADMIN'));

ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msg_select" ON "Message" FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM "Participant" WHERE "Participant"."conversationId" = "Message"."conversationId" AND "Participant"."userId" = auth.uid()::text));
CREATE POLICY "msg_insert" ON "Message" FOR INSERT TO authenticated WITH CHECK ("Message"."senderId" = auth.uid()::text AND EXISTS (SELECT 1 FROM "Participant" WHERE "Participant"."conversationId" = "Message"."conversationId" AND "Participant"."userId" = auth.uid()::text));

-- 11. NOTIFICATION
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_select" ON "Notification" FOR SELECT TO authenticated USING ("userId" = auth.uid()::text);
CREATE POLICY "notif_insert" ON "Notification" FOR INSERT TO authenticated WITH CHECK ("userId" = auth.uid()::text OR EXISTS (SELECT 1 FROM "User" WHERE "User".id = auth.uid()::text AND "User".role IN ('ADMIN', 'GERENCIAL', 'OPERADOR', 'OPERACIONAL', 'FINANCEIRO', 'MASTER')));
CREATE POLICY "notif_update" ON "Notification" FOR UPDATE TO authenticated USING ("userId" = auth.uid()::text) WITH CHECK ("userId" = auth.uid()::text);
CREATE POLICY "notif_delete" ON "Notification" FOR DELETE TO authenticated USING ("userId" = auth.uid()::text);

-- 12. STATUS HISTORY
ALTER TABLE "StatusHistory" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "status_history_read" ON "StatusHistory" FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM "User" WHERE "User".id = auth.uid()::text AND "User".role IN ('ADMIN', 'GERENCIAL', 'OPERADOR', 'OPERACIONAL', 'FINANCEIRO', 'MASTER')));
CREATE POLICY "status_history_write" ON "StatusHistory" FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM "User" WHERE "User".id = auth.uid()::text AND "User".role IN ('ADMIN', 'GERENCIAL', 'OPERADOR', 'OPERACIONAL', 'FINANCEIRO', 'SPA', 'MASTER')));

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS "idx_user_id_rls" ON "User"(id);
CREATE INDEX IF NOT EXISTS "idx_user_role_rls" ON "User"(role);

-- ============================================================================
-- FIM - RLS Configurado!
-- ============================================================================
