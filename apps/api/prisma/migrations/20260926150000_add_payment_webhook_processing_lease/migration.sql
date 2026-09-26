-- Add crash-recovery lease columns required by the Prisma webhook event model.
ALTER TABLE "payment_webhook_events"
  ADD COLUMN "processing_lease_until" TIMESTAMP(3),
  ADD COLUMN "processing_token" TEXT;

CREATE INDEX "payment_webhook_events_processing_lease_until_idx"
  ON "payment_webhook_events"("processing_lease_until");
