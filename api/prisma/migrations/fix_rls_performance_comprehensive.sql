-- Comprehensive RLS Performance Fix
-- This script optimizes Row Level Security policies by caching auth.uid() calls
-- Run this in the Supabase SQL Editor

DO $$ 
BEGIN

  ------------------------------------------------------------------------------------
  -- 1. NotificationSettings
  ------------------------------------------------------------------------------------
  DROP POLICY IF EXISTS "NotificationSettings: MASTER only" ON "public"."NotificationSettings";
  CREATE POLICY "NotificationSettings: MASTER only" ON "public"."NotificationSettings" 
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM "User" WHERE "User".id = (select auth.uid())::text AND "User".role = 'MASTER'));

  ------------------------------------------------------------------------------------
  -- 2. UserNotificationPreference
  ------------------------------------------------------------------------------------
  DROP POLICY IF EXISTS "UserNotificationPreference: Own data" ON "public"."UserNotificationPreference";
  CREATE POLICY "UserNotificationPreference: Own data" ON "public"."UserNotificationPreference" 
  FOR ALL TO authenticated 
  USING ("userId" = (select auth.uid())::text);

  DROP POLICY IF EXISTS "UserNotificationPreference: MASTER access" ON "public"."UserNotificationPreference";
  CREATE POLICY "UserNotificationPreference: MASTER access" ON "public"."UserNotificationPreference" 
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM "User" WHERE "User".id = (select auth.uid())::text AND "User".role IN ('MASTER', 'ADMIN', 'GESTAO')));

  ------------------------------------------------------------------------------------
  -- 3. AttendanceRecord (Re-applying for completeness)
  ------------------------------------------------------------------------------------
  DROP POLICY IF EXISTS "AttendanceRecord: Own records or management" ON "public"."AttendanceRecord";
  CREATE POLICY "AttendanceRecord: Own records or management" ON "public"."AttendanceRecord" 
  FOR ALL TO authenticated 
  USING ("staffId" IN (SELECT id FROM "StaffProfile" WHERE "userId" = (select auth.uid())::text) OR EXISTS (SELECT 1 FROM "User" WHERE "User".id = (select auth.uid())::text AND "User".role IN ('MASTER', 'ADMIN', 'GESTAO')));

  ------------------------------------------------------------------------------------
  -- 4. TransportLegExecution
  ------------------------------------------------------------------------------------
  DROP POLICY IF EXISTS "TransportLegExecution: Staff access" ON "public"."TransportLegExecution";
  CREATE POLICY "TransportLegExecution: Staff access" ON "public"."TransportLegExecution" 
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM "User" WHERE "User".id = (select auth.uid())::text AND "User".division != 'CLIENTE'));

  ------------------------------------------------------------------------------------
  -- 5. PayPeriod
  ------------------------------------------------------------------------------------
  DROP POLICY IF EXISTS "PayPeriod: Management only" ON "public"."PayPeriod";
  CREATE POLICY "PayPeriod: Management only" ON "public"."PayPeriod" 
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM "User" WHERE "User".id = (select auth.uid())::text AND "User".role IN ('MASTER', 'ADMIN', 'GESTAO')));

  ------------------------------------------------------------------------------------
  -- 6. PayAdjustment
  ------------------------------------------------------------------------------------
  DROP POLICY IF EXISTS "PayAdjustment: Management only" ON "public"."PayAdjustment";
  CREATE POLICY "PayAdjustment: Management only" ON "public"."PayAdjustment" 
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM "User" WHERE "User".id = (select auth.uid())::text AND "User".role IN ('MASTER', 'ADMIN', 'GESTAO')));

  ------------------------------------------------------------------------------------
  -- 7. PayStatement
  ------------------------------------------------------------------------------------
  DROP POLICY IF EXISTS "PayStatement: Own statement or management" ON "public"."PayStatement";
  CREATE POLICY "PayStatement: Own statement or management" ON "public"."PayStatement" 
  FOR ALL TO authenticated 
  USING ("staffId" IN (SELECT id FROM "StaffProfile" WHERE "userId" = (select auth.uid())::text) OR EXISTS (SELECT 1 FROM "User" WHERE "User".id = (select auth.uid())::text AND "User".role IN ('MASTER', 'ADMIN', 'GESTAO')));

  ------------------------------------------------------------------------------------
  -- 8. HrAuditLog
  ------------------------------------------------------------------------------------
  DROP POLICY IF EXISTS "HrAuditLog: Management read-only" ON "public"."HrAuditLog";
  CREATE POLICY "HrAuditLog: Management read-only" ON "public"."HrAuditLog" 
  FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM "User" WHERE "User".id = (select auth.uid())::text AND "User".role IN ('MASTER', 'ADMIN', 'GESTAO')));

  ------------------------------------------------------------------------------------
  -- 9. FinancialTransaction
  ------------------------------------------------------------------------------------
  DROP POLICY IF EXISTS "FinancialTransaction: Management only" ON "public"."FinancialTransaction";
  CREATE POLICY "FinancialTransaction: Management only" ON "public"."FinancialTransaction" 
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM "User" WHERE "User".id = (select auth.uid())::text AND "User".role IN ('MASTER', 'ADMIN', 'GESTAO')));

  ------------------------------------------------------------------------------------
  -- 10. CustomerAlert
  ------------------------------------------------------------------------------------
  DROP POLICY IF EXISTS "CustomerAlert: Staff access" ON "public"."CustomerAlert";
  CREATE POLICY "CustomerAlert: Staff access" ON "public"."CustomerAlert" 
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM "User" WHERE "User".id = (select auth.uid())::text AND "User".division != 'CLIENTE'));

  ------------------------------------------------------------------------------------
  -- 11. ServiceExecution
  ------------------------------------------------------------------------------------
  DROP POLICY IF EXISTS "ServiceExecution: Staff access" ON "public"."ServiceExecution";
  CREATE POLICY "ServiceExecution: Staff access" ON "public"."ServiceExecution" 
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM "User" WHERE "User".id = (select auth.uid())::text AND "User".division != 'CLIENTE'));

  ------------------------------------------------------------------------------------
  -- 12. StaffProfile
  ------------------------------------------------------------------------------------
  DROP POLICY IF EXISTS "StaffProfile: Own profile or management" ON "public"."StaffProfile";
  CREATE POLICY "StaffProfile: Own profile or management" ON "public"."StaffProfile" 
  FOR ALL TO authenticated 
  USING ("userId" = (select auth.uid())::text OR EXISTS (SELECT 1 FROM "User" WHERE "User".id = (select auth.uid())::text AND "User".role IN ('MASTER', 'ADMIN', 'GESTAO')));

  ------------------------------------------------------------------------------------
  -- 13. ScheduledNotification & NotificationExecution
  ------------------------------------------------------------------------------------
  DROP POLICY IF EXISTS "Admins have full control on ScheduledNotification" ON "public"."ScheduledNotification";
  CREATE POLICY "Admins have full control on ScheduledNotification" ON "public"."ScheduledNotification" 
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM "User" WHERE "User".id = (select auth.uid())::text AND "User".role IN ('MASTER', 'ADMIN', 'GESTAO')));

  DROP POLICY IF EXISTS "Admins have full control on NotificationExecution" ON "public"."NotificationExecution";
  CREATE POLICY "Admins have full control on NotificationExecution" ON "public"."NotificationExecution" 
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM "User" WHERE "User".id = (select auth.uid())::text AND "User".role IN ('MASTER', 'ADMIN', 'GESTAO')));

  ------------------------------------------------------------------------------------
  -- 14. PushSubscription
  ------------------------------------------------------------------------------------
  DROP POLICY IF EXISTS "push_subscription_all_own" ON "public"."PushSubscription";
  CREATE POLICY "push_subscription_all_own" ON "public"."PushSubscription" 
  FOR ALL TO authenticated 
  USING ("userId" = (select auth.uid())::text);

  ------------------------------------------------------------------------------------
  -- 15. Metric (Staff)
  ------------------------------------------------------------------------------------
  DROP POLICY IF EXISTS "metric_read_staff" ON "public"."Metric";
  CREATE POLICY "metric_read_staff" ON "public"."Metric" 
  FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM "User" WHERE "User".id = (select auth.uid())::text AND "User".division != 'CLIENTE'));

  ------------------------------------------------------------------------------------
  -- 16. RolePermission (Admin)
  ------------------------------------------------------------------------------------
  DROP POLICY IF EXISTS "role_permission_delete_admin" ON "public"."RolePermission";
  CREATE POLICY "role_permission_delete_admin" ON "public"."RolePermission" FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM "User" WHERE "User".id = (select auth.uid())::text AND "User".role IN ('MASTER', 'ADMIN', 'GESTAO')));

  DROP POLICY IF EXISTS "role_permission_insert_admin" ON "public"."RolePermission";
  CREATE POLICY "role_permission_insert_admin" ON "public"."RolePermission" FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM "User" WHERE "User".id = (select auth.uid())::text AND "User".role IN ('MASTER', 'ADMIN', 'GESTAO')));

  DROP POLICY IF EXISTS "role_permission_update_admin" ON "public"."RolePermission";
  CREATE POLICY "role_permission_update_admin" ON "public"."RolePermission" FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM "User" WHERE "User".id = (select auth.uid())::text AND "User".role IN ('MASTER', 'ADMIN', 'GESTAO')));

  ------------------------------------------------------------------------------------
  -- 17. TransportSettings (Mix)
  ------------------------------------------------------------------------------------
  DROP POLICY IF EXISTS "transport_settings_delete_admin" ON "public"."TransportSettings";
  CREATE POLICY "transport_settings_delete_admin" ON "public"."TransportSettings" FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM "User" WHERE "User".id = (select auth.uid())::text AND "User".role IN ('MASTER', 'ADMIN', 'GESTAO')));

  DROP POLICY IF EXISTS "transport_settings_insert_admin" ON "public"."TransportSettings";
  CREATE POLICY "transport_settings_insert_admin" ON "public"."TransportSettings" FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM "User" WHERE "User".id = (select auth.uid())::text AND "User".role IN ('MASTER', 'ADMIN', 'GESTAO')));

  DROP POLICY IF EXISTS "transport_settings_update_admin" ON "public"."TransportSettings";
  CREATE POLICY "transport_settings_update_admin" ON "public"."TransportSettings" FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM "User" WHERE "User".id = (select auth.uid())::text AND "User".role IN ('MASTER', 'ADMIN', 'GESTAO')));

  DROP POLICY IF EXISTS "transport_settings_read_staff" ON "public"."TransportSettings";
  CREATE POLICY "transport_settings_read_staff" ON "public"."TransportSettings" FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM "User" WHERE "User".id = (select auth.uid())::text AND "User".division != 'CLIENTE'));

  ------------------------------------------------------------------------------------
  -- 18. Authenticator (Own)
  ------------------------------------------------------------------------------------
  DROP POLICY IF EXISTS "authenticator_delete_own" ON "public"."Authenticator";
  CREATE POLICY "authenticator_delete_own" ON "public"."Authenticator" FOR DELETE TO authenticated USING ("userId" = (select auth.uid())::text);

  DROP POLICY IF EXISTS "authenticator_insert_own" ON "public"."Authenticator";
  CREATE POLICY "authenticator_insert_own" ON "public"."Authenticator" FOR INSERT TO authenticated WITH CHECK ("userId" = (select auth.uid())::text);

  DROP POLICY IF EXISTS "authenticator_read_own" ON "public"."Authenticator";
  CREATE POLICY "authenticator_read_own" ON "public"."Authenticator" FOR SELECT TO authenticated USING ("userId" = (select auth.uid())::text);

  DROP POLICY IF EXISTS "authenticator_update_own" ON "public"."Authenticator";
  CREATE POLICY "authenticator_update_own" ON "public"."Authenticator" FOR UPDATE TO authenticated USING ("userId" = (select auth.uid())::text);
  

  ------------------------------------------------------------------------------------
  -- 19. Product (Admin Management)
  ------------------------------------------------------------------------------------
  DROP POLICY IF EXISTS "product_delete_admin" ON "public"."Product";
  CREATE POLICY "product_delete_admin" ON "public"."Product" FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM "User" WHERE "User".id = (select auth.uid())::text AND "User".role IN ('MASTER', 'ADMIN', 'GESTAO')));

  DROP POLICY IF EXISTS "product_insert_admin" ON "public"."Product";
  CREATE POLICY "product_insert_admin" ON "public"."Product" FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM "User" WHERE "User".id = (select auth.uid())::text AND "User".role IN ('MASTER', 'ADMIN', 'GESTAO')));

  DROP POLICY IF EXISTS "product_update_admin" ON "public"."Product";
  CREATE POLICY "product_update_admin" ON "public"."Product" FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM "User" WHERE "User".id = (select auth.uid())::text AND "User".role IN ('MASTER', 'ADMIN', 'GESTAO')));

  ------------------------------------------------------------------------------------
  -- 20. BugReport (Mixed)
  ------------------------------------------------------------------------------------
  DROP POLICY IF EXISTS "bug_report_delete_admin" ON "public"."BugReport";
  CREATE POLICY "bug_report_delete_admin" ON "public"."BugReport" FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM "User" WHERE "User".id = (select auth.uid())::text AND "User".role IN ('MASTER', 'ADMIN', 'GESTAO')));

  DROP POLICY IF EXISTS "bug_report_insert_own" ON "public"."BugReport";
  CREATE POLICY "bug_report_insert_own" ON "public"."BugReport" FOR INSERT TO authenticated WITH CHECK ("userId" = (select auth.uid())::text);

  DROP POLICY IF EXISTS "bug_report_read_own_or_staff" ON "public"."BugReport";
  CREATE POLICY "bug_report_read_own_or_staff" ON "public"."BugReport" FOR SELECT TO authenticated USING ("userId" = (select auth.uid())::text OR EXISTS (SELECT 1 FROM "User" WHERE "User".id = (select auth.uid())::text AND "User".division != 'CLIENTE'));

  DROP POLICY IF EXISTS "bug_report_update_own_or_admin" ON "public"."BugReport";
  CREATE POLICY "bug_report_update_own_or_admin" ON "public"."BugReport" FOR UPDATE TO authenticated USING ("userId" = (select auth.uid())::text OR EXISTS (SELECT 1 FROM "User" WHERE "User".id = (select auth.uid())::text AND "User".role IN ('MASTER', 'ADMIN', 'GESTAO')));
  
END $$;
