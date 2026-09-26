ALTER TABLE "refunds" ADD COLUMN "processing_lease_until" TIMESTAMP(3);
ALTER TABLE "refunds" ADD COLUMN "processing_token" TEXT;
CREATE INDEX "refunds_status_processing_lease_until_idx" ON "refunds"("status", "processing_lease_until");
