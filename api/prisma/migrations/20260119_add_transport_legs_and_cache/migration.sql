-- CreateTable: TransportLeg
CREATE TABLE "TransportLeg" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "originAddress" TEXT NOT NULL,
    "destinationAddress" TEXT NOT NULL,
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "chargeKm" DOUBLE PRECISION NOT NULL,
    "chargeMin" INTEGER NOT NULL,
    "kmRate" DOUBLE PRECISION NOT NULL,
    "minRate" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "assignedProviderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransportLeg_pkey" PRIMARY KEY ("id")
);

-- CreateTable: RouteCache
CREATE TABLE "RouteCache" (
    "id" TEXT NOT NULL,
    "routeKey" TEXT NOT NULL,
    "originAddress" TEXT NOT NULL,
    "destinationAddress" TEXT NOT NULL,
    "stopAddress" TEXT,
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RouteCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TransportLeg_quoteId_idx" ON "TransportLeg"("quoteId");
CREATE INDEX "TransportLeg_assignedProviderId_idx" ON "TransportLeg"("assignedProviderId");
CREATE INDEX "TransportLeg_kind_idx" ON "TransportLeg"("kind");

-- CreateIndex
CREATE UNIQUE INDEX "RouteCache_routeKey_key" ON "RouteCache"("routeKey");
CREATE INDEX "RouteCache_routeKey_idx" ON "RouteCache"("routeKey");
CREATE INDEX "RouteCache_expiresAt_idx" ON "RouteCache"("expiresAt");

-- AddForeignKey
ALTER TABLE "TransportLeg" ADD CONSTRAINT "TransportLeg_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TransportLeg" ADD CONSTRAINT "TransportLeg_assignedProviderId_fkey" FOREIGN KEY ("assignedProviderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: Quote - Add new transport calculation fields
ALTER TABLE "Quote" ADD COLUMN "transportPlan" TEXT;
ALTER TABLE "Quote" ADD COLUMN "transportMode" TEXT;
ALTER TABLE "Quote" ADD COLUMN "transportStopAddress" TEXT;
ALTER TABLE "Quote" ADD COLUMN "transportDiscountPercent" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "Quote" ADD COLUMN "transportTotalBefore" DOUBLE PRECISION;
ALTER TABLE "Quote" ADD COLUMN "transportTotalAfter" DOUBLE PRECISION;
ALTER TABLE "Quote" ADD COLUMN "transportLevaTotalBefore" DOUBLE PRECISION;
ALTER TABLE "Quote" ADD COLUMN "transportLevaTotalAfter" DOUBLE PRECISION;
ALTER TABLE "Quote" ADD COLUMN "transportTrazTotalBefore" DOUBLE PRECISION;
ALTER TABLE "Quote" ADD COLUMN "transportTrazTotalAfter" DOUBLE PRECISION;

-- AlterTable: TransportSettings - Add new unified configuration fields
ALTER TABLE "TransportSettings" ADD COLUMN "kmRate" DOUBLE PRECISION NOT NULL DEFAULT 2.0;
ALTER TABLE "TransportSettings" ADD COLUMN "minRate" DOUBLE PRECISION NOT NULL DEFAULT 1.5;
ALTER TABLE "TransportSettings" ADD COLUMN "taxPercent" DOUBLE PRECISION NOT NULL DEFAULT 5.0;
ALTER TABLE "TransportSettings" ADD COLUMN "providerSharePercent" DOUBLE PRECISION NOT NULL DEFAULT 60.0;
