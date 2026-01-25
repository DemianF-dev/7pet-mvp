-- Enable RLS for Notification Tables to fix Supabase Issues
-- Run this in Supabase SQL Editor

ALTER TABLE "ScheduledNotification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NotificationExecution" ENABLE ROW LEVEL SECURITY;

-- OPTIONAL: Add standard policy for admins if you plan to access these via Supabase Client directly
-- (Your Node.js backend already has access via Prisma, so this is mostly to satisfy the linter and future-proof)

CREATE POLICY "Admins have full control on ScheduledNotification"
ON "ScheduledNotification"
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = auth.uid() 
    AND "User".role IN ('MASTER', 'ADMIN', 'GESTAO')
  )
);

CREATE POLICY "Admins have full control on NotificationExecution"
ON "NotificationExecution"
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = auth.uid() 
    AND "User".role IN ('MASTER', 'ADMIN', 'GESTAO')
  )
);
