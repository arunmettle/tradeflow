-- AlterTable
ALTER TABLE "Quote"
ADD COLUMN "lastCustomerReadAt" TIMESTAMP(3),
ADD COLUMN "lastTradieReadAt" TIMESTAMP(3);
