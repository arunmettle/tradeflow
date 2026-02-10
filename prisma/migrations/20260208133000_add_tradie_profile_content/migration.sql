-- AlterTable
ALTER TABLE "TradieProfile"
ADD COLUMN "tagline" TEXT,
ADD COLUMN "about" TEXT,
ADD COLUMN "website" TEXT,
ADD COLUMN "addressLine1" TEXT,
ADD COLUMN "addressLine2" TEXT,
ADD COLUMN "suburb" TEXT,
ADD COLUMN "state" TEXT,
ADD COLUMN "postcode" TEXT,
ADD COLUMN "services" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "serviceAreas" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "testimonials" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "projects" JSONB NOT NULL DEFAULT '[]';
