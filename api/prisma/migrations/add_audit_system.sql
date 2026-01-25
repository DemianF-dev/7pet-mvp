
-- Create enums if they don't exist
DO $$ BEGIN
    CREATE TYPE "AuditSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AuditSource" AS ENUM ('WEB', 'MOBILE', 'API', 'SYSTEM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AuditTargetType" AS ENUM ('CLIENT', 'PET', 'QUOTE', 'APPOINTMENT', 'PAYMENT', 'USER', 'PERMISSION', 'BULK_ACTION', 'CONFIG', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AuditAction" AS ENUM (
        'AUTH_LOGIN_SUCCESS', 'AUTH_LOGIN_FAILED', 'AUTH_LOGOUT',
        'CLIENT_CREATED', 'CLIENT_UPDATED', 'CLIENT_BLOCKED_AUTO', 'CLIENT_UNBLOCKED',
        'PET_CREATED', 'PET_UPDATED', 'PET_DELETED_SOFT',
        'QUOTE_REQUESTED', 'QUOTE_CREATED', 'QUOTE_UPDATED', 'QUOTE_STATUS_CHANGED', 'QUOTE_SENT', 'QUOTE_RECALCULATED', 'QUOTE_APPROVED', 'QUOTE_REJECTED',
        'APPOINTMENT_CREATED', 'APPOINTMENT_RESCHEDULED', 'APPOINTMENT_CANCELLED', 'APPOINTMENT_NO_SHOW', 'APPOINTMENT_STATUS_CHANGED',
        'USER_CREATED', 'USER_UPDATED', 'USER_DELETED_SOFT', 'PERMISSION_CHANGED', 'BULK_DELETE', 'BULK_UPDATE', 'CONFIG_CHANGED',
        'EVENT_REVERTED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create AuditEvent table
CREATE TABLE IF NOT EXISTS "AuditEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorUserId" TEXT,
    "actorNameSnapshot" TEXT,
    "actorRoleSnapshot" TEXT,
    "source" "AuditSource" NOT NULL DEFAULT 'API',
    "ip" TEXT,
    "userAgent" TEXT,
    "requestId" TEXT,
    "targetType" "AuditTargetType" NOT NULL,
    "targetId" TEXT,
    "clientId" TEXT,
    "appointmentId" TEXT,
    "quoteId" TEXT,
    "petId" TEXT,
    "action" "AuditAction" NOT NULL,
    "severity" "AuditSeverity" NOT NULL DEFAULT 'INFO',
    "summary" TEXT NOT NULL,
    "meta" JSONB,
    "before" JSONB,
    "after" JSONB,
    "diff" JSONB,
    "revertible" BOOLEAN NOT NULL DEFAULT false,
    "revertStrategy" TEXT,
    "revertedAt" TIMESTAMP(3),
    "revertedByUserId" TEXT,
    "revertReason" TEXT,
    "revertOfEventId" TEXT,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- Add foreign key for self-relation
DO $$ BEGIN
    ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_revertOfEventId_fkey" FOREIGN KEY ("revertOfEventId") REFERENCES "AuditEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS "AuditEvent_clientId_createdAt_idx" ON "AuditEvent" ("clientId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "AuditEvent_targetType_targetId_createdAt_idx" ON "AuditEvent" ("targetType", "targetId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "AuditEvent_actorUserId_createdAt_idx" ON "AuditEvent" ("actorUserId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "AuditEvent_severity_createdAt_idx" ON "AuditEvent" ("severity", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "AuditEvent_requestId_createdAt_idx" ON "AuditEvent" ("requestId", "createdAt" DESC);
