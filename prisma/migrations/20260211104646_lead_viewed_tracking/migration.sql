-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "viewedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Lead_tradieId_viewedAt_createdAt_idx" ON "Lead"("tradieId", "viewedAt", "createdAt");
