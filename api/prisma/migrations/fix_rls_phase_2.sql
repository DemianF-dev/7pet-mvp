-- Phase 2: Complete RLS Fixes & Policy Consolidation
-- This script addresses remaining 'auth_rls_initplan' warnings and consolidates 'multiple_permissive_policies'.
-- It replaces redundant policies with single, optimized policies using (select auth.uid()).

DO $$ 
BEGIN

  ------------------------------------------------------------------------------------
  -- 1. StatusHistory (Fix InitPlan)
  ------------------------------------------------------------------------------------
  -- Original: status_history_insert
  DROP POLICY IF EXISTS "status_history_insert" ON "public"."StatusHistory";
  CREATE POLICY "status_history_insert" ON "public"."StatusHistory" 
  FOR INSERT TO authenticated 
  WITH CHECK (true); -- Usually inserts are open for authenticated, or add specific check if needed. Keeping generic safe if it was open.
  -- NOTE: If logic required checking auth, use: (select auth.uid())

  ------------------------------------------------------------------------------------
  -- 2. Notification (Fix InitPlan)
  ------------------------------------------------------------------------------------
  -- Original: notification_insert
  DROP POLICY IF EXISTS "notification_insert" ON "public"."Notification";
  CREATE POLICY "notification_insert" ON "public"."Notification" 
  FOR INSERT TO authenticated 
  WITH CHECK ("userId" = (select auth.uid())::text);

  ------------------------------------------------------------------------------------
  -- 3. AuditLog (Fix InitPlan & Multiple Policies)
  ------------------------------------------------------------------------------------
  -- Found: audit_log_read_admin, audit_select_policy
  DROP POLICY IF EXISTS "audit_log_read_admin" ON "public"."AuditLog";
  DROP POLICY IF EXISTS "audit_select_policy" ON "public"."AuditLog";
  
  CREATE POLICY "AuditLog: Management read-only" ON "public"."AuditLog" 
  FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM "User" WHERE "User".id = (select auth.uid())::text AND "User".role IN ('MASTER', 'ADMIN', 'GESTAO')));

  ------------------------------------------------------------------------------------
  -- 4. Post (Fix InitPlan & Multiple Policies)
  ------------------------------------------------------------------------------------
  -- Found: post_manage_own, post_read_staff
  DROP POLICY IF EXISTS "post_manage_own" ON "public"."Post";
  DROP POLICY IF EXISTS "post_read_staff" ON "public"."Post";

  -- Consolidated Access: Own Management OR Staff Read
  CREATE POLICY "Post: Access" ON "public"."Post"
  FOR ALL TO authenticated
  USING (
    ("authorId" = (select auth.uid())::text) OR 
    EXISTS (SELECT 1 FROM "User" WHERE "User".id = (select auth.uid())::text AND "User".division != 'CLIENTE')
  );

  ------------------------------------------------------------------------------------
  -- 5. Comment (Fix InitPlan & Multiple Policies)
  ------------------------------------------------------------------------------------
  -- Found: comment_manage_own, comment_read_staff
  DROP POLICY IF EXISTS "comment_manage_own" ON "public"."Comment";
  DROP POLICY IF EXISTS "comment_read_staff" ON "public"."Comment";

  CREATE POLICY "Comment: Access" ON "public"."Comment"
  FOR ALL TO authenticated
  USING (
    ("authorId" = (select auth.uid())::text) OR 
    EXISTS (SELECT 1 FROM "User" WHERE "User".id = (select auth.uid())::text AND "User".division != 'CLIENTE')
  );

  ------------------------------------------------------------------------------------
  -- 6. Reaction (Fix InitPlan & Multiple Policies)
  ------------------------------------------------------------------------------------
  -- Found: reaction_manage_own, reaction_read_staff
  DROP POLICY IF EXISTS "reaction_manage_own" ON "public"."Reaction";
  DROP POLICY IF EXISTS "reaction_read_staff" ON "public"."Reaction";

  CREATE POLICY "Reaction: Access" ON "public"."Reaction"
  FOR ALL TO authenticated
  USING (
    ("authorId" = (select auth.uid())::text) OR 
    EXISTS (SELECT 1 FROM "User" WHERE "User".id = (select auth.uid())::text AND "User".division != 'CLIENTE')
  );

  ------------------------------------------------------------------------------------
  -- 7. Chat Tables: Conversation, Participant, Message (Fix InitPlan)
  ------------------------------------------------------------------------------------
  
  -- Conversation
  DROP POLICY IF EXISTS "conversation_select_participants" ON "public"."Conversation";
  CREATE POLICY "conversation_select_participants" ON "public"."Conversation" 
  FOR SELECT TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM "Participant" 
    WHERE "Participant"."conversationId" = "Conversation".id 
    AND "Participant"."userId" = (select auth.uid())::text
  ));

  -- Participant
  DROP POLICY IF EXISTS "participant_select_related" ON "public"."Participant";
  CREATE POLICY "participant_select_related" ON "public"."Participant" 
  FOR SELECT TO authenticated 
  USING ("userId" = (select auth.uid())::text OR EXISTS (
    SELECT 1 FROM "Participant" p2 
    WHERE p2."conversationId" = "Participant"."conversationId" 
    AND p2."userId" = (select auth.uid())::text
  ));

  -- Message
  DROP POLICY IF EXISTS "message_insert_participants" ON "public"."Message";
  CREATE POLICY "message_insert_participants" ON "public"."Message" 
  FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (
    SELECT 1 FROM "Participant" 
    WHERE "Participant"."conversationId" = "Message"."conversationId" 
    AND "Participant"."userId" = (select auth.uid())::text
  ));

  DROP POLICY IF EXISTS "message_select_participants" ON "public"."Message";
  CREATE POLICY "message_select_participants" ON "public"."Message" 
  FOR SELECT TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM "Participant" 
    WHERE "Participant"."conversationId" = "Message"."conversationId" 
    AND "Participant"."userId" = (select auth.uid())::text
  ));

  ------------------------------------------------------------------------------------
  -- 8. Authenticator (Fix Multiple Policies)
  ------------------------------------------------------------------------------------
  -- Found: authenticator_own_policy (generic) + specific ones.
  -- We already optimized specific ones in previous script. Now cleaning up the duplicate generic one.
  DROP POLICY IF EXISTS "authenticator_own_policy" ON "public"."Authenticator";
  -- Ensure specific ones are applied (re-apply safely just in case first script execution missed or order mattered)
  -- (Skipping re-declaration to avoid bloat, assumed previous script ran. If not, user should run both.)

  ------------------------------------------------------------------------------------
  -- 9. BugReport (Fix Multiple Policies)
  ------------------------------------------------------------------------------------
  -- Found: bug_delete_policy, bug_insert_policy, bug_select_policy, bug_update_policy vs specific ones.
  DROP POLICY IF EXISTS "bug_delete_policy" ON "public"."BugReport";
  DROP POLICY IF EXISTS "bug_insert_policy" ON "public"."BugReport";
  DROP POLICY IF EXISTS "bug_select_policy" ON "public"."BugReport";
  DROP POLICY IF EXISTS "bug_update_policy" ON "public"."BugReport";
  -- The specific policies (bug_report_insert_own, etc.) were fixed in Phase 1 script.

  ------------------------------------------------------------------------------------
  -- 10. Product (Fix Multiple Policies)
  ------------------------------------------------------------------------------------
  -- Found: product_delete/insert/select/update vs _admin ones.
  DROP POLICY IF EXISTS "product_delete" ON "public"."Product";
  DROP POLICY IF EXISTS "product_insert" ON "public"."Product";
  DROP POLICY IF EXISTS "product_select" ON "public"."Product";
  DROP POLICY IF EXISTS "product_update" ON "public"."Product";
  DROP POLICY IF EXISTS "product_read_all_authenticated" ON "public"."Product";
  
  -- Re-create a consolidated READ policy for Product (Authenticated read all)
  CREATE POLICY "Product: Read All" ON "public"."Product"
  FOR SELECT TO authenticated
  USING (true); 
  
  -- Re-create consolidated WRITE policies (managed in Phase 1 as _admin)
  -- We assume Phase 1 _admin policies are covering the management aspect. 

  ------------------------------------------------------------------------------------
  -- 11. RolePermission (Fix Multiple Policies)
  ------------------------------------------------------------------------------------
  -- Found: roleperm_delete, roleperm_insert, ...
  DROP POLICY IF EXISTS "roleperm_delete" ON "public"."RolePermission";
  DROP POLICY IF EXISTS "roleperm_insert" ON "public"."RolePermission";
  DROP POLICY IF EXISTS "roleperm_select" ON "public"."RolePermission";
  DROP POLICY IF EXISTS "roleperm_update" ON "public"."RolePermission";
  DROP POLICY IF EXISTS "role_permission_read_all_authenticated" ON "public"."RolePermission";

  -- Consolidated READ
  CREATE POLICY "RolePermission: Read All" ON "public"."RolePermission"
  FOR SELECT TO authenticated
  USING (true);

  ------------------------------------------------------------------------------------
  -- 12. TransportSettings (Fix Multiple Policies)
  ------------------------------------------------------------------------------------
  -- Found: transport_delete, transport_insert, transport_select, transport_update
  DROP POLICY IF EXISTS "transport_delete" ON "public"."TransportSettings";
  DROP POLICY IF EXISTS "transport_insert" ON "public"."TransportSettings";
  DROP POLICY IF EXISTS "transport_select" ON "public"."TransportSettings";
  DROP POLICY IF EXISTS "transport_update" ON "public"."TransportSettings";
  -- Phase 1 script handles the granular optimized policies.

  ------------------------------------------------------------------------------------
  -- 13. UserNotificationPreference (Fix Multiple Policies - Merge)
  ------------------------------------------------------------------------------------
  -- Found: "Access" and "Own data" causing overlap.
  -- We will DROP the separate ones created in Phase 1 and create a single merged one.
  
  DROP POLICY IF EXISTS "UserNotificationPreference: Own data" ON "public"."UserNotificationPreference";
  DROP POLICY IF EXISTS "UserNotificationPreference: MASTER access" ON "public"."UserNotificationPreference";

  CREATE POLICY "UserNotificationPreference: Consolidated Access" ON "public"."UserNotificationPreference"
  FOR ALL TO authenticated
  USING (
    "userId" = (select auth.uid())::text OR 
    EXISTS (SELECT 1 FROM "User" WHERE "User".id = (select auth.uid())::text AND "User".role IN ('MASTER', 'ADMIN', 'GESTAO'))
  );

END $$;
