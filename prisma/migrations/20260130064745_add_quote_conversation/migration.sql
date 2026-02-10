-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "currentRevision" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "isConversationLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastCustomerMessageAt" TIMESTAMP(3),
ADD COLUMN     "lastTradieMessageAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "QuoteMessage" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "authorType" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteRevision" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "summary" TEXT,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteRevision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuoteMessage_quoteId_createdAt_idx" ON "QuoteMessage"("quoteId", "createdAt");

-- CreateIndex
CREATE INDEX "QuoteRevision_quoteId_createdAt_idx" ON "QuoteRevision"("quoteId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteRevision_quoteId_revisionNumber_key" ON "QuoteRevision"("quoteId", "revisionNumber");

-- AddForeignKey
ALTER TABLE "QuoteMessage" ADD CONSTRAINT "QuoteMessage_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteRevision" ADD CONSTRAINT "QuoteRevision_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
