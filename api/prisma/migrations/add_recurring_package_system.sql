-- Safely create types and apply schema changes
DO $$ 
BEGIN
    -- 1. Create Enums if they don't exist
    BEGIN
        CREATE TYPE "PackageFrequency" AS ENUM ('SEMANAL', 'QUINZENAL', 'MENSAL');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END;

    BEGIN
        CREATE TYPE "PackageStatus" AS ENUM ('ATIVO', 'PAUSADO', 'CANCELADO', 'ENCERRADO');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END;

    BEGIN
        CREATE TYPE "BillingType" AS ENUM ('MENSAL', 'BIMESTRAL');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END;

    BEGIN
        CREATE TYPE "DebitCreditType" AS ENUM ('DEBITO', 'CREDITO');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END;

    BEGIN
        CREATE TYPE "DebitCreditStatus" AS ENUM ('PENDENTE', 'QUITADO', 'ABATIDO');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END;

    BEGIN
        CREATE TYPE "BillingAction" AS ENUM ('COBRAR_AGORA', 'PROXIMO_FATURAMENTO');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END;
END $$;

-- 2. Add recurring fields to Quote table
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "isRecurring" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "frequency" "PackageFrequency";
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "packageDiscount" DOUBLE PRECISION;
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "cardFeePercent" DOUBLE PRECISION;
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "taxPercent" DOUBLE PRECISION;
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "recurringPackageId" TEXT;

-- 3. Create index on isRecurring
CREATE INDEX IF NOT EXISTS "Quote_isRecurring_idx" ON "Quote"("isRecurring");

-- 4. Create RecurringPackage table
CREATE TABLE IF NOT EXISTS "RecurringPackage" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "customerId" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "frequency" "PackageFrequency" NOT NULL,
    "discountPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "transportDiscount" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "monthlyTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "PackageStatus" NOT NULL DEFAULT 'ATIVO',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "billingType" "BillingType" NOT NULL DEFAULT 'MENSAL',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecurringPackage_pkey" PRIMARY KEY ("id")
);

-- 5. Create PackageItem table
CREATE TABLE IF NOT EXISTS "PackageItem" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "packageId" TEXT NOT NULL,
    "serviceId" TEXT,
    "description" TEXT NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "finalPrice" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "PackageItem_pkey" PRIMARY KEY ("id")
);

-- 6. Create DebitCreditNote table
CREATE TABLE IF NOT EXISTS "DebitCreditNote" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "customerId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "packageId" TEXT,
    "type" "DebitCreditType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "status" "DebitCreditStatus" NOT NULL DEFAULT 'PENDENTE',
    "billingAction" "BillingAction" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    CONSTRAINT "DebitCreditNote_pkey" PRIMARY KEY ("id")
);

-- 7. Add recurringPackageId to Appointment
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "recurringPackageId" TEXT;

-- 8. Create indexes
CREATE INDEX IF NOT EXISTS "RecurringPackage_customerId_idx" ON "RecurringPackage"("customerId");
CREATE INDEX IF NOT EXISTS "RecurringPackage_petId_idx" ON "RecurringPackage"("petId");
CREATE INDEX IF NOT EXISTS "RecurringPackage_status_idx" ON "RecurringPackage"("status");
CREATE INDEX IF NOT EXISTS "PackageItem_packageId_idx" ON "PackageItem"("packageId");
CREATE INDEX IF NOT EXISTS "PackageItem_serviceId_idx" ON "PackageItem"("serviceId");
CREATE INDEX IF NOT EXISTS "DebitCreditNote_customerId_idx" ON "DebitCreditNote"("customerId");
CREATE INDEX IF NOT EXISTS "DebitCreditNote_appointmentId_idx" ON "DebitCreditNote"("appointmentId");
CREATE INDEX IF NOT EXISTS "DebitCreditNote_packageId_idx" ON "DebitCreditNote"("packageId");
CREATE INDEX IF NOT EXISTS "DebitCreditNote_status_idx" ON "DebitCreditNote"("status");

-- 9. Add foreign keys safely
DO $$
BEGIN
    BEGIN
        ALTER TABLE "RecurringPackage" ADD CONSTRAINT "RecurringPackage_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    EXCEPTION
        WHEN duplicate_object THEN null;
    END;

    BEGIN
        ALTER TABLE "RecurringPackage" ADD CONSTRAINT "RecurringPackage_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    EXCEPTION
        WHEN duplicate_object THEN null;
    END;

    BEGIN
        ALTER TABLE "PackageItem" ADD CONSTRAINT "PackageItem_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "RecurringPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    EXCEPTION
        WHEN duplicate_object THEN null;
    END;

    BEGIN
        ALTER TABLE "PackageItem" ADD CONSTRAINT "PackageItem_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION
        WHEN duplicate_object THEN null;
    END;

    BEGIN
        ALTER TABLE "DebitCreditNote" ADD CONSTRAINT "DebitCreditNote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    EXCEPTION
        WHEN duplicate_object THEN null;
    END;

    BEGIN
        ALTER TABLE "DebitCreditNote" ADD CONSTRAINT "DebitCreditNote_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION
        WHEN duplicate_object THEN null;
    END;

    BEGIN
        ALTER TABLE "DebitCreditNote" ADD CONSTRAINT "DebitCreditNote_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "RecurringPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION
        WHEN duplicate_object THEN null;
    END;

    BEGIN
        ALTER TABLE "Quote" ADD CONSTRAINT "Quote_recurringPackageId_fkey" FOREIGN KEY ("recurringPackageId") REFERENCES "RecurringPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION
        WHEN duplicate_object THEN null;
    END;

    BEGIN
        ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_recurringPackageId_fkey" FOREIGN KEY ("recurringPackageId") REFERENCES "RecurringPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION
        WHEN duplicate_object THEN null;
    END;
END $$;
