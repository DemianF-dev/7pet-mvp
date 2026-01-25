-- Enable RLS for Recurring Package System Tables
-- Run this in the Supabase SQL Editor after running add_recurring_package_system.sql

DO $$ 
BEGIN

  ------------------------------------------------------------------------------------
  -- 1. RecurringPackage - Staff access (not clients)
  ------------------------------------------------------------------------------------
  ALTER TABLE "public"."RecurringPackage" ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "RecurringPackage: Staff access" ON "public"."RecurringPackage";
  CREATE POLICY "RecurringPackage: Staff access" ON "public"."RecurringPackage" 
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM "User" WHERE "User".id = (select auth.uid())::text AND "User".division != 'CLIENTE'));

  ------------------------------------------------------------------------------------
  -- 2. PackageItem - Staff access (not clients)
  ------------------------------------------------------------------------------------
  ALTER TABLE "public"."PackageItem" ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "PackageItem: Staff access" ON "public"."PackageItem";
  CREATE POLICY "PackageItem: Staff access" ON "public"."PackageItem" 
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM "User" WHERE "User".id = (select auth.uid())::text AND "User".division != 'CLIENTE'));

  ------------------------------------------------------------------------------------
  -- 3. DebitCreditNote - Staff access (not clients)
  ------------------------------------------------------------------------------------
  ALTER TABLE "public"."DebitCreditNote" ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "DebitCreditNote: Staff access" ON "public"."DebitCreditNote";
  CREATE POLICY "DebitCreditNote: Staff access" ON "public"."DebitCreditNote" 
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM "User" WHERE "User".id = (select auth.uid())::text AND "User".division != 'CLIENTE'));

  ------------------------------------------------------------------------------------
  -- 4. Goal - Management only (MASTER, ADMIN, GESTAO)
  ------------------------------------------------------------------------------------
  ALTER TABLE "public"."Goal" ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "Goal: Management only" ON "public"."Goal";
  CREATE POLICY "Goal: Management only" ON "public"."Goal" 
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM "User" WHERE "User".id = (select auth.uid())::text AND "User".role IN ('MASTER', 'ADMIN', 'GESTAO')));

  ------------------------------------------------------------------------------------
  -- 5. GoalAssignment - Own assignments or management
  ------------------------------------------------------------------------------------
  ALTER TABLE "public"."GoalAssignment" ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "GoalAssignment: Own or management" ON "public"."GoalAssignment";
  CREATE POLICY "GoalAssignment: Own or management" ON "public"."GoalAssignment" 
  FOR ALL TO authenticated 
  USING (
    "staffId" IN (SELECT id FROM "StaffProfile" WHERE "userId" = (select auth.uid())::text)
    OR EXISTS (SELECT 1 FROM "User" WHERE "User".id = (select auth.uid())::text AND "User".role IN ('MASTER', 'ADMIN', 'GESTAO'))
  );

END $$;
