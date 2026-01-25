-- Enable Row Level Security on all tables missing RLS

-- 1. NotificationSettings
ALTER TABLE "NotificationSettings" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "NotificationSettings: MASTER only" ON "NotificationSettings" FOR ALL USING (EXISTS (SELECT 1 FROM "User" WHERE "User".id = auth.uid()::text AND "User".role = 'MASTER'));

-- 2. UserNotificationPreference
ALTER TABLE "UserNotificationPreference" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "UserNotificationPreference: Own data" ON "UserNotificationPreference" FOR ALL USING ("userId" = auth.uid()::text);
CREATE POLICY "UserNotificationPreference: MASTER access" ON "UserNotificationPreference" FOR ALL USING (EXISTS (SELECT 1 FROM "User" WHERE "User".id = auth.uid()::text AND "User".role IN ('MASTER', 'ADMIN', 'GESTAO')));

-- 3. AttendanceRecord
ALTER TABLE "AttendanceRecord" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "AttendanceRecord: Own records or management" ON "AttendanceRecord" FOR ALL USING ("staffId" IN (SELECT id FROM "StaffProfile" WHERE "userId" = auth.uid()::text) OR EXISTS (SELECT 1 FROM "User" WHERE "User".id = auth.uid()::text AND "User".role IN ('MASTER', 'ADMIN', 'GESTAO')));

-- 4. TransportLegExecution
ALTER TABLE "TransportLegExecution" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "TransportLegExecution: Staff access" ON "TransportLegExecution" FOR ALL USING (EXISTS (SELECT 1 FROM "User" WHERE "User".id = auth.uid()::text AND "User".division != 'CLIENTE'));

-- 5. PayPeriod
ALTER TABLE "PayPeriod" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "PayPeriod: Management only" ON "PayPeriod" FOR ALL USING (EXISTS (SELECT 1 FROM "User" WHERE "User".id = auth.uid()::text AND "User".role IN ('MASTER', 'ADMIN', 'GESTAO')));

-- 6. PayAdjustment
ALTER TABLE "PayAdjustment" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "PayAdjustment: Management only" ON "PayAdjustment" FOR ALL USING (EXISTS (SELECT 1 FROM "User" WHERE "User".id = auth.uid()::text AND "User".role IN ('MASTER', 'ADMIN', 'GESTAO')));

-- 7. PayStatement (usa staffId, não userId direto)
ALTER TABLE "PayStatement" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "PayStatement: Own statement or management" ON "PayStatement" FOR ALL USING ("staffId" IN (SELECT id FROM "StaffProfile" WHERE "userId" = auth.uid()::text) OR EXISTS (SELECT 1 FROM "User" WHERE "User".id = auth.uid()::text AND "User".role IN ('MASTER', 'ADMIN', 'GESTAO')));

-- 8. HrAuditLog
ALTER TABLE "HrAuditLog" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "HrAuditLog: Management read-only" ON "HrAuditLog" FOR SELECT USING (EXISTS (SELECT 1 FROM "User" WHERE "User".id = auth.uid()::text AND "User".role IN ('MASTER', 'ADMIN', 'GESTAO')));

-- 9. FinancialTransaction
ALTER TABLE "FinancialTransaction" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "FinancialTransaction: Management only" ON "FinancialTransaction" FOR ALL USING (EXISTS (SELECT 1 FROM "User" WHERE "User".id = auth.uid()::text AND "User".role IN ('MASTER', 'ADMIN', 'GESTAO')));

-- 10. CustomerAlert
ALTER TABLE "CustomerAlert" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CustomerAlert: Staff access" ON "CustomerAlert" FOR ALL USING (EXISTS (SELECT 1 FROM "User" WHERE "User".id = auth.uid()::text AND "User".division != 'CLIENTE'));

-- 11. ServiceExecution
ALTER TABLE "ServiceExecution" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ServiceExecution: Staff access" ON "ServiceExecution" FOR ALL USING (EXISTS (SELECT 1 FROM "User" WHERE "User".id = auth.uid()::text AND "User".division != 'CLIENTE'));

-- 12. StaffProfile
ALTER TABLE "StaffProfile" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "StaffProfile: Own profile or management" ON "StaffProfile" FOR ALL USING ("userId" = auth.uid()::text OR EXISTS (SELECT 1 FROM "User" WHERE "User".id = auth.uid()::text AND "User".role IN ('MASTER', 'ADMIN', 'GESTAO')));
