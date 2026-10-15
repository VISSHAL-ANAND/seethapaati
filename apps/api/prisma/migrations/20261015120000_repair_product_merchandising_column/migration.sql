ALTER TABLE "products"
ADD COLUMN IF NOT EXISTS "merchandising" JSONB DEFAULT '{}'::jsonb;
