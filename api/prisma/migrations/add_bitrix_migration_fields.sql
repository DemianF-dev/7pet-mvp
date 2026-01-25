-- Migration: Add Bitrix24 Migration Fields
-- Run this SQL in Supabase SQL Editor

-- ==========================================
-- CUSTOMER TABLE - New Fields
-- ==========================================

ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "legacyBitrixId" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "cpf" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "billingPreference" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "billingOther" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "legacyCreatedAt" TIMESTAMP(3);
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "legacySource" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "negotiationDiscount" DOUBLE PRECISION;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "secondaryGuardianBirthday" TIMESTAMP(3);
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "discoverySourceDetail" TEXT;

-- Unique index on legacyBitrixId for fast lookups during import
CREATE UNIQUE INDEX IF NOT EXISTS "Customer_legacyBitrixId_key" ON "Customer"("legacyBitrixId");

-- ==========================================
-- PET TABLE - New Fields
-- ==========================================

ALTER TABLE "Pet" ADD COLUMN IF NOT EXISTS "sex" TEXT;
ALTER TABLE "Pet" ADD COLUMN IF NOT EXISTS "size" TEXT;
ALTER TABLE "Pet" ADD COLUMN IF NOT EXISTS "birthDate" TIMESTAMP(3);
ALTER TABLE "Pet" ADD COLUMN IF NOT EXISTS "hasSpecialNeeds" BOOLEAN DEFAULT false;
ALTER TABLE "Pet" ADD COLUMN IF NOT EXISTS "specialNeedsDescription" TEXT;
ALTER TABLE "Pet" ADD COLUMN IF NOT EXISTS "isCastrated" BOOLEAN;
ALTER TABLE "Pet" ADD COLUMN IF NOT EXISTS "hasOwnTrousseau" BOOLEAN DEFAULT false;
ALTER TABLE "Pet" ADD COLUMN IF NOT EXISTS "favoriteToy" TEXT;
ALTER TABLE "Pet" ADD COLUMN IF NOT EXISTS "habits" TEXT;
ALTER TABLE "Pet" ADD COLUMN IF NOT EXISTS "nightHabits" TEXT;
ALTER TABLE "Pet" ADD COLUMN IF NOT EXISTS "feedingType" TEXT;
ALTER TABLE "Pet" ADD COLUMN IF NOT EXISTS "allowsTreats" BOOLEAN DEFAULT true;
ALTER TABLE "Pet" ADD COLUMN IF NOT EXISTS "socialWithAnimals" BOOLEAN;
ALTER TABLE "Pet" ADD COLUMN IF NOT EXISTS "socialWithHumans" BOOLEAN;
ALTER TABLE "Pet" ADD COLUMN IF NOT EXISTS "walkingFrequency" TEXT;
ALTER TABLE "Pet" ADD COLUMN IF NOT EXISTS "authorityCommand" TEXT;
ALTER TABLE "Pet" ADD COLUMN IF NOT EXISTS "takesMedication" BOOLEAN DEFAULT false;
ALTER TABLE "Pet" ADD COLUMN IF NOT EXISTS "medicationDetails" TEXT;
ALTER TABLE "Pet" ADD COLUMN IF NOT EXISTS "medicationAllergies" TEXT;
ALTER TABLE "Pet" ADD COLUMN IF NOT EXISTS "parasiteControlUpToDate" BOOLEAN;
ALTER TABLE "Pet" ADD COLUMN IF NOT EXISTS "vaccinesUpToDate" BOOLEAN;
ALTER TABLE "Pet" ADD COLUMN IF NOT EXISTS "knowsHotelOrDaycare" BOOLEAN;
ALTER TABLE "Pet" ADD COLUMN IF NOT EXISTS "usedToBeingAway" BOOLEAN;
ALTER TABLE "Pet" ADD COLUMN IF NOT EXISTS "timeWithPet" TEXT;
ALTER TABLE "Pet" ADD COLUMN IF NOT EXISTS "relationshipOrigin" TEXT;
ALTER TABLE "Pet" ADD COLUMN IF NOT EXISTS "handlingPreference" TEXT;
ALTER TABLE "Pet" ADD COLUMN IF NOT EXISTS "photoUrl" TEXT;

-- ==========================================
-- SUCCESS MESSAGE
-- ==========================================
SELECT 'Migration completed successfully! Customer and Pet tables updated for Bitrix24 import.' as status;
