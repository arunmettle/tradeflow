/*
  Warnings:

  - Added the required column `tradieId` to the `Quote` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Quote_status_createdAt_idx";

-- AlterTable: add nullable columns first to allow backfill
ALTER TABLE "Quote" ADD COLUMN     "leadId" TEXT,
ADD COLUMN     "tradieId" TEXT;

-- CreateTable
CREATE TABLE "TradieProfile" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "logoUrl" TEXT,
    "brandSettings" JSONB NOT NULL DEFAULT '{}',
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TradieProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "tradieId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT,
    "siteAddress" TEXT,
    "suburb" TEXT,
    "jobCategory" TEXT,
    "jobDescription" TEXT NOT NULL,
    "photos" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- Seed a default tradie for existing quotes
INSERT INTO "TradieProfile" ("id", "slug", "businessName", "email", "phone", "logoUrl", "brandSettings", "plan", "createdAt", "updatedAt")
VALUES ('default-tradie', 'default-tradie', 'Default Tradie', NULL, NULL, NULL, '{}'::jsonb, 'FREE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Backfill existing quotes with the default tradie
UPDATE "Quote" SET "tradieId" = 'default-tradie' WHERE "tradieId" IS NULL;

-- Enforce not-null on tradieId after backfill
ALTER TABLE "Quote" ALTER COLUMN "tradieId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "TradieProfile_slug_key" ON "TradieProfile"("slug");

-- CreateIndex
CREATE INDEX "Lead_tradieId_status_createdAt_idx" ON "Lead"("tradieId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Quote_tradieId_status_createdAt_idx" ON "Quote"("tradieId", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_tradieId_fkey" FOREIGN KEY ("tradieId") REFERENCES "TradieProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_tradieId_fkey" FOREIGN KEY ("tradieId") REFERENCES "TradieProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
