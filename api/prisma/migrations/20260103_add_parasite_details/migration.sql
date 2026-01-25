-- AlterTable
ALTER TABLE "Quote" ADD  COLUMN "parasiteTypes" TEXT,
ADD COLUMN  "parasiteComments" TEXT,
ADD COLUMN "wantsMedicatedBath" BOOLEAN NOT NULL DEFAULT false;
