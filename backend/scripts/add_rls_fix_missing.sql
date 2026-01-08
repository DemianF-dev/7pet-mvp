-- ============================================================================
-- RLS FIX FOR MISSING AND NEW TABLES
-- Execute this in Supabase SQL Editor to resolve Linter Errors
-- ============================================================================

-- 1. PUSH SUBSCRIPTION
ALTER TABLE "PushSubscription" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "push_subscription_all_own" ON "PushSubscription";
CREATE POLICY "push_subscription_all_own" ON "PushSubscription" FOR ALL TO authenticated
USING ("PushSubscription"."userId" = auth.uid()::text)
WITH CHECK ("PushSubscription"."userId" = auth.uid()::text);

-- 2. METRIC
ALTER TABLE "Metric" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "metric_read_staff" ON "Metric";
CREATE POLICY "metric_read_staff" ON "Metric" FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM "User" WHERE "User".id = auth.uid()::text AND "User".role IN ('ADMIN', 'GERENCIAL')));

-- 3. FEED - POST
ALTER TABLE "Post" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "post_read_staff" ON "Post";
CREATE POLICY "post_read_staff" ON "Post" FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "post_manage_own" ON "Post";
CREATE POLICY "post_manage_own" ON "Post" FOR ALL TO authenticated
USING ("Post"."authorId" = auth.uid()::text)
WITH CHECK ("Post"."authorId" = auth.uid()::text);

-- 4. FEED - COMMENT
ALTER TABLE "Comment" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comment_read_staff" ON "Comment";
CREATE POLICY "comment_read_staff" ON "Comment" FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "comment_manage_own" ON "Comment";
CREATE POLICY "comment_manage_own" ON "Comment" FOR ALL TO authenticated
USING ("Comment"."authorId" = auth.uid()::text)
WITH CHECK ("Comment"."authorId" = auth.uid()::text);

-- 5. FEED - REACTION
ALTER TABLE "Reaction" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reaction_read_staff" ON "Reaction";
CREATE POLICY "reaction_read_staff" ON "Reaction" FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "reaction_manage_own" ON "Reaction";
CREATE POLICY "reaction_manage_own" ON "Reaction" FOR ALL TO authenticated
USING ("Reaction"."authorId" = auth.uid()::text)
WITH CHECK ("Reaction"."authorId" = auth.uid()::text);

-- 6. CHAT - CONVERSATION
ALTER TABLE "Conversation" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "conversation_select_participants" ON "Conversation";
CREATE POLICY "conversation_select_participants" ON "Conversation" FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM "Participant" WHERE "Participant"."conversationId" = "Conversation".id AND "Participant"."userId" = auth.uid()::text));

-- 7. CHAT - PARTICIPANT
ALTER TABLE "Participant" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "participant_select_related" ON "Participant";
CREATE POLICY "participant_select_related" ON "Participant" FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM "Participant" AS p WHERE p."conversationId" = "Participant"."conversationId" AND p."userId" = auth.uid()::text) OR EXISTS (SELECT 1 FROM "User" WHERE "User".id = auth.uid()::text AND "User".role = 'ADMIN'));

-- 8. CHAT - MESSAGE
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "message_select_participants" ON "Message";
CREATE POLICY "message_select_participants" ON "Message" FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM "Participant" WHERE "Participant"."conversationId" = "Message"."conversationId" AND "Participant"."userId" = auth.uid()::text));
DROP POLICY IF EXISTS "message_insert_participants" ON "Message";
CREATE POLICY "message_insert_participants" ON "Message" FOR INSERT TO authenticated
WITH CHECK ("Message"."senderId" = auth.uid()::text AND EXISTS (SELECT 1 FROM "Participant" WHERE "Participant"."conversationId" = "Message"."conversationId" AND "Participant"."userId" = auth.uid()::text));

-- GRANTS
GRANT SELECT, INSERT, UPDATE, DELETE ON "PushSubscription" TO authenticated;
GRANT SELECT ON "Metric" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "Post" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "Comment" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "Reaction" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "Conversation" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "Participant" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "Message" TO authenticated;
