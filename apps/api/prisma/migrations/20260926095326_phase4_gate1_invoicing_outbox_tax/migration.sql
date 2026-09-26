-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'GENERATED', 'VOID');

-- CreateEnum
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "product_variants" ADD COLUMN     "hsn_code" TEXT;

-- CreateTable
CREATE TABLE "tax_rates" (
    "id" TEXT NOT NULL,
    "hsn_code" TEXT NOT NULL,
    "description" TEXT,
    "tax_rate_percent" DOUBLE PRECISION NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'GENERATED',
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "seller_snapshot" JSONB NOT NULL,
    "buyer_snapshot" JSONB NOT NULL,
    "taxable_subtotal_cents" INTEGER NOT NULL,
    "cgst_cents" INTEGER NOT NULL DEFAULT 0,
    "sgst_cents" INTEGER NOT NULL DEFAULT 0,
    "igst_cents" INTEGER NOT NULL DEFAULT 0,
    "total_tax_cents" INTEGER NOT NULL,
    "shipping_net_cents" INTEGER NOT NULL DEFAULT 0,
    "shipping_tax_cents" INTEGER NOT NULL DEFAULT 0,
    "discount_cents" INTEGER NOT NULL DEFAULT 0,
    "round_off_cents" INTEGER NOT NULL DEFAULT 0,
    "grand_total_cents" INTEGER NOT NULL,
    "tax_snapshot" JSONB NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "hsn_code" TEXT NOT NULL,
    "uom" TEXT NOT NULL DEFAULT 'NOS',
    "quantity" INTEGER NOT NULL,
    "unit_price_cents" INTEGER NOT NULL,
    "taxable_value_cents" INTEGER NOT NULL,
    "tax_rate_percent" DOUBLE PRECISION NOT NULL,
    "cgst_cents" INTEGER NOT NULL DEFAULT 0,
    "sgst_cents" INTEGER NOT NULL DEFAULT 0,
    "igst_cents" INTEGER NOT NULL DEFAULT 0,
    "line_total_cents" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "aggregate_type" TEXT NOT NULL,
    "aggregate_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "max_retries" INTEGER NOT NULL DEFAULT 5,
    "next_retry_at" TIMESTAMP(3),
    "leased_until" TIMESTAMP(3),
    "leased_by" TEXT,
    "last_error" TEXT,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_variants_hsn_code_idx" ON "product_variants"("hsn_code");

-- CreateIndex
CREATE UNIQUE INDEX "tax_rates_hsn_code_key" ON "tax_rates"("hsn_code");

-- CreateIndex
CREATE INDEX "tax_rates_hsn_code_idx" ON "tax_rates"("hsn_code");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_order_id_key" ON "invoices"("order_id");

-- CreateIndex
CREATE INDEX "invoices_invoice_number_idx" ON "invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "invoices_order_id_idx" ON "invoices"("order_id");

-- CreateIndex
CREATE INDEX "invoice_items_invoice_id_idx" ON "invoice_items"("invoice_id");

-- CreateIndex
CREATE UNIQUE INDEX "outbox_events_idempotency_key_key" ON "outbox_events"("idempotency_key");

-- CreateIndex
CREATE INDEX "outbox_events_status_next_retry_at_idx" ON "outbox_events"("status", "next_retry_at");

-- CreateIndex
CREATE INDEX "outbox_events_status_leased_until_idx" ON "outbox_events"("status", "leased_until");

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create Sequence for Sequential Invoice Numbering
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

-- Check Constraints for Financial & Quantity Safety
ALTER TABLE "invoice_items" ADD CONSTRAINT "check_invoice_item_positive_quantity" CHECK (quantity > 0);
ALTER TABLE "invoices" ADD CONSTRAINT "check_invoice_positive_grand_total" CHECK (grand_total_cents >= 0);


