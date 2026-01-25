-- Fix 'rls_policy_always_true' warning for StatusHistory
-- Replaces the permissive 'CHECK (true)' with a strict check ensuring the 'changedBy' field matches the current user.

BEGIN;

DROP POLICY IF EXISTS "status_history_insert" ON "public"."StatusHistory";

CREATE POLICY "status_history_insert" ON "public"."StatusHistory" 
FOR INSERT TO authenticated 
WITH CHECK ("changedBy" = (select auth.uid())::text);

COMMIT;
