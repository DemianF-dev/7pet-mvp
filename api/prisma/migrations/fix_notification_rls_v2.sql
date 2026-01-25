-- Enable RLS for Notification Tables to fix Supabase Issues (v2 - Fixed Cast)
-- Run this in Supabase SQL Editor

ALTER TABLE "ScheduledNotification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NotificationExecution" ENABLE ROW LEVEL SECURITY;

-- Policy with correct casting: auth.uid() returns uuid, "User".id is text
CREATE POLICY "Admins have full control on ScheduledNotification"
ON "ScheduledNotification"
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = auth.uid()::text  -- CORRECTION: Cast UUID to TEXT
    AND "User".role IN ('MASTER', 'ADMIN', 'GESTAO')
  )
);

CREATE POLICY "Admins have full control on NotificationExecution"
ON "NotificationExecution"
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = auth.uid()::text  -- CORRECTION: Cast UUID to TEXT
    AND "User".role IN ('MASTER', 'ADMIN', 'GESTAO')
  )
);
