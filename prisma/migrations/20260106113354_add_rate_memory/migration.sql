-- AlterTable
ALTER TABLE "QuoteLine" ADD COLUMN     "needsReview" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rateConfidence" INTEGER,
ADD COLUMN     "rateSource" TEXT,
ADD COLUMN     "suggestedUnitRate" DECIMAL(12,2);

-- CreateTable
CREATE TABLE "RateMemory" (
    "id" TEXT NOT NULL,
    "tradieId" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "category" TEXT,
    "sampleCount" INTEGER NOT NULL DEFAULT 0,
    "lastRate" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "medianRate" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "minRate" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "maxRate" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateMemory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateSample" (
    "id" TEXT NOT NULL,
    "tradieId" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "rate" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateSample_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RateMemory_tradieId_normalizedName_idx" ON "RateMemory"("tradieId", "normalizedName");

-- CreateIndex
CREATE INDEX "RateMemory_tradieId_unit_idx" ON "RateMemory"("tradieId", "unit");

-- CreateIndex
CREATE UNIQUE INDEX "RateMemory_tradieId_normalizedName_unit_key" ON "RateMemory"("tradieId", "normalizedName", "unit");

-- CreateIndex
CREATE INDEX "RateSample_tradieId_normalizedName_unit_idx" ON "RateSample"("tradieId", "normalizedName", "unit");

-- AddForeignKey
ALTER TABLE "RateMemory" ADD CONSTRAINT "RateMemory_tradieId_fkey" FOREIGN KEY ("tradieId") REFERENCES "TradieProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateSample" ADD CONSTRAINT "RateSample_tradieId_fkey" FOREIGN KEY ("tradieId") REFERENCES "TradieProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
