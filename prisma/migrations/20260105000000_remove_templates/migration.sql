-- Remove foreign key and index to Template
ALTER TABLE "Quote" DROP CONSTRAINT IF EXISTS "Quote_templateId_fkey";
DROP INDEX IF EXISTS "Quote_templateId_idx";

-- Make trade/jobType optional
ALTER TABLE "Quote"
  ALTER COLUMN "trade" DROP NOT NULL,
  ALTER COLUMN "jobType" DROP NOT NULL;

-- Drop template/measurements columns
ALTER TABLE "Quote"
  DROP COLUMN IF EXISTS "templateId",
  DROP COLUMN IF EXISTS "measurements";

-- Drop Template table
DROP TABLE IF EXISTS "Template";
