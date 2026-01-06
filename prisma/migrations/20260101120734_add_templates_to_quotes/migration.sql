-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "measurements" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "templateId" TEXT;

-- CreateIndex
CREATE INDEX "Quote_templateId_idx" ON "Quote"("templateId");

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE SET NULL ON UPDATE CASCADE;
