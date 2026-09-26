CREATE TYPE "ShipmentStatus" AS ENUM ('CREATED','AWB_ASSIGNED','SHIPPED','OUT_FOR_DELIVERY','DELIVERED','CANCELLED');
CREATE TYPE "ReturnStatus" AS ENUM ('REQUESTED','APPROVED','PICKED_UP','RECEIVED','INSPECTED','REFUND_ELIGIBLE','COMPLETED','REJECTED','CANCELLED');
CREATE TYPE "ReturnReason" AS ENUM ('DAMAGED','WRONG_ITEM','QUALITY_ISSUE','OTHER');
CREATE TYPE "RefundStatus" AS ENUM ('PENDING','PROCESSED','FAILED');
CREATE TYPE "RefundReason" AS ENUM ('RETURN','REFUND_REQUIRED_OTHER');
CREATE SEQUENCE IF NOT EXISTS return_number_seq START 1;

CREATE TABLE "shipments" (
"id" TEXT NOT NULL PRIMARY KEY,"order_id" TEXT NOT NULL UNIQUE,"carrier" TEXT NOT NULL,
"tracking_number" TEXT UNIQUE,"tracking_url" TEXT,"status" "ShipmentStatus" NOT NULL DEFAULT 'CREATED',
"shipping_cents" INTEGER NOT NULL DEFAULT 0,"estimated_days" INTEGER,"dispatched_at" TIMESTAMP(3),
"delivered_at" TIMESTAMP(3),"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updated_at" TIMESTAMP(3) NOT NULL,
CONSTRAINT "shipments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE);

CREATE TABLE "shipment_tracking_events" (
"id" TEXT NOT NULL PRIMARY KEY,"shipment_id" TEXT NOT NULL,"status" "ShipmentStatus" NOT NULL,
"location" TEXT,"description" TEXT,"occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT "shipment_tracking_events_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE);

CREATE TABLE "returns" (
"id" TEXT NOT NULL PRIMARY KEY,"return_number" TEXT NOT NULL UNIQUE,"order_id" TEXT NOT NULL,"user_id" TEXT NOT NULL,
"status" "ReturnStatus" NOT NULL DEFAULT 'REQUESTED',"reason" "ReturnReason" NOT NULL,"notes" TEXT,"evidence_url" TEXT,
"staff_notes" TEXT,"requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"resolved_at" TIMESTAMP(3),
"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updated_at" TIMESTAMP(3) NOT NULL,
CONSTRAINT "returns_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE,
CONSTRAINT "returns_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE);

CREATE TABLE "return_items" (
"id" TEXT NOT NULL PRIMARY KEY,"return_id" TEXT NOT NULL,"order_item_id" TEXT NOT NULL,"quantity" INTEGER NOT NULL,
CONSTRAINT "return_items_return_id_fkey" FOREIGN KEY ("return_id") REFERENCES "returns"("id") ON DELETE CASCADE ON UPDATE CASCADE,
CONSTRAINT "return_items_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
CONSTRAINT "return_items_unique_item" UNIQUE ("return_id","order_item_id"),
CONSTRAINT "return_items_positive_quantity" CHECK ("quantity" > 0));

CREATE TABLE "refunds" (
"id" TEXT NOT NULL PRIMARY KEY,"order_id" TEXT NOT NULL,"payment_id" TEXT NOT NULL,"return_id" TEXT,
"gateway_refund_id" TEXT UNIQUE,"idempotency_key" TEXT NOT NULL UNIQUE,"amount_cents" INTEGER NOT NULL,"currency" TEXT NOT NULL DEFAULT 'INR',
"status" "RefundStatus" NOT NULL DEFAULT 'PENDING',"reason" "RefundReason" NOT NULL,"notes" TEXT,"processed_at" TIMESTAMP(3),
"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updated_at" TIMESTAMP(3) NOT NULL,
CONSTRAINT "refunds_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE,
CONSTRAINT "refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
CONSTRAINT "refunds_return_id_fkey" FOREIGN KEY ("return_id") REFERENCES "returns"("id") ON DELETE SET NULL ON UPDATE CASCADE,
CONSTRAINT "refunds_positive_amount" CHECK ("amount_cents" > 0));

CREATE INDEX "shipments_status_idx" ON "shipments"("status");
CREATE INDEX "shipment_tracking_events_lookup_idx" ON "shipment_tracking_events"("shipment_id","occurred_at");
CREATE INDEX "returns_order_idx" ON "returns"("order_id");
CREATE INDEX "returns_user_status_idx" ON "returns"("user_id","status");
CREATE INDEX "return_items_order_item_idx" ON "return_items"("order_item_id");
CREATE INDEX "refunds_order_status_idx" ON "refunds"("order_id","status");
CREATE INDEX "refunds_payment_idx" ON "refunds"("payment_id");