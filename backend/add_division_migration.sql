-- Migration: Add Division System
-- This migration adds the division field to track departments/divisions
-- and makes role optional for flexible job titles

-- Step 1: Add division column
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "division" TEXT NOT NULL DEFAULT 'CLIENTE';

-- Step 2: Make role nullable (optional)
ALTER TABLE "User" ALTER COLUMN "role" DROP NOT NULL;
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;

-- Step 3: Migrate existing data - copy role to division for non-clients
UPDATE "User" SET "division" = "role" WHERE "role" IS NOT NULL AND "role" != 'CLIENTE';

-- Step 4: Update indexes
DROP INDEX IF EXISTS "User_role_idx";
CREATE INDEX IF NOT EXISTS "User_division_idx" ON "User"("division");

-- Step 5: Regenerate Prisma Client after running this
-- Run: npx prisma generate
