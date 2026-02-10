ALTER TABLE "TradieProfile"
ADD COLUMN IF NOT EXISTS "authUserId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "TradieProfile_authUserId_key"
ON "TradieProfile" ("authUserId");
