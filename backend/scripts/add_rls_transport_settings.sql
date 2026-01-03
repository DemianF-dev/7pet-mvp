-- Enable Row Level Security on TransportSettings
ALTER TABLE "TransportSettings" ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow authenticated STAFF users to read transport settings
-- (Staff includes: OPERADOR, OPERACIONAL, FINANCEIRO, GERENCIAL, ADMIN)
CREATE POLICY "transport_settings_read_staff"
ON "TransportSettings"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())
    AND "User".role IN ('OPERADOR', 'OPERACIONAL', 'FINANCEIRO', 'GERENCIAL', 'ADMIN')
  )
);

-- Policy 2: Allow only ADMIN and GERENCIAL users to update transport settings
CREATE POLICY "transport_settings_update_admin"
ON "TransportSettings"
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())
    AND "User".role IN ('ADMIN', 'GERENCIAL')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())
    AND "User".role IN ('ADMIN', 'GERENCIAL')
  )
);

-- Policy 3: Allow only ADMIN users to insert new transport settings
CREATE POLICY "transport_settings_insert_admin"
ON "TransportSettings"
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())
    AND "User".role = 'ADMIN'
  )
);

-- Policy 4: Allow only ADMIN users to delete transport settings
CREATE POLICY "transport_settings_delete_admin"
ON "TransportSettings"
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = (SELECT auth.uid())
    AND "User".role = 'ADMIN'
  )
);

-- Grant minimum necessary privileges
REVOKE ALL ON "TransportSettings" FROM PUBLIC;
GRANT SELECT ON "TransportSettings" TO authenticated;
GRANT INSERT, UPDATE, DELETE ON "TransportSettings" TO authenticated;
-- Note: RLS policies will still enforce the actual permissions

-- Create index for performance on User.id lookups
CREATE INDEX IF NOT EXISTS "idx_user_id_for_rls" ON "User"(id);
