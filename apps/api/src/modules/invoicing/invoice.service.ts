import { Injectable, Logger, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InvoiceDto } from '@seethapaati/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { TaxConfigurationService } from './tax-configuration.service';

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly taxConfig: TaxConfigurationService,
  ) {}

  async generateInvoice(orderId: string): Promise<InvoiceDto> {
    return this.prisma.$transaction((tx) => this.generateInvoiceInTransaction(orderId, tx));
  }

  async generateInvoiceInTransaction(orderId: string, tx: Prisma.TransactionClient): Promise<InvoiceDto> {
    const existing = await tx.invoice.findUnique({
      where: { orderId },
      include: { items: true },
    });
    if (existing) return this.toDto(existing);

    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException({ error: 'ORDER_NOT_FOUND', message: 'Order not found.' });

    if (order.status !== 'PAID' && order.status !== 'PROCESSING' && order.status !== 'PACKED' &&
        order.status !== 'SHIPPED' && order.status !== 'OUT_FOR_DELIVERY' && order.status !== 'DELIVERED') {
      throw new UnprocessableEntityException({
        error: 'INVOICE_NOT_ELIGIBLE',
        message: `Order ${order.orderNumber} is not eligible for invoicing in status ${order.status}.`,
      });
    }

    const seller = this.taxConfig.getSellerConfig();
    const buyer = this.normalizeBuyerSnapshot(order.shippingAddressSnapshot);
    const intraState = seller.stateCode === (buyer.stateCode ?? '');

    if (!order.items.length) {
      throw new UnprocessableEntityException({ error: 'INVOICE_INVALID', message: 'Order has no items.' });
    }

    const taxableSubtotalCents = order.subtotalCents - order.discountCents;
    if (taxableSubtotalCents < 0) {
      throw new UnprocessableEntityException({ error: 'INVOICE_INVALID', message: 'Order discount exceeds subtotal.' });
    }

    const itemDiscounts = this.allocateCents(order.discountCents, order.items.map((i) => i.unitPriceCents * i.quantity));
    const invoiceItems: Array<{
      productName: string; sku: string; hsnCode: string; uom: string; quantity: number;
      unitPriceCents: number; taxableValueCents: number; taxRatePercent: number;
      cgstCents: number; sgstCents: number; igstCents: number; lineTotalCents: number;
    }> = [];

    let totalTax = 0, cgst = 0, sgst = 0, igst = 0, allocatedTaxable = 0;

    for (let i = 0; i < order.items.length; i++) {
      const item = order.items[i];
      const hsnCode = item.hsnCodeSnapshot;
      if (!hsnCode) {
        throw new UnprocessableEntityException({
          error: 'TAX_CONFIGURATION_MISSING',
          message: `HSN code missing for order item ${item.skuSnapshot}.`,
        });
      }
      const rate = await this.taxConfig.getRate(hsnCode, tx);
      const taxableValueCents = (item.unitPriceCents * item.quantity) - itemDiscounts[i];
      const tax = this.taxConfig.calculateTax(taxableValueCents, rate.taxRatePercent, intraState);
      invoiceItems.push({
        productName: item.productNameSnapshot,
        sku: item.skuSnapshot,
        hsnCode,
        uom: 'NOS',
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        taxableValueCents,
        taxRatePercent: rate.taxRatePercent,
        cgstCents: tax.cgstCents,
        sgstCents: tax.sgstCents,
        igstCents: tax.igstCents,
        lineTotalCents: taxableValueCents + tax.totalTaxCents,
      });
      allocatedTaxable += taxableValueCents;
      totalTax += tax.totalTaxCents;
      cgst += tax.cgstCents;
      sgst += tax.sgstCents;
      igst += tax.igstCents;
    }

    if (allocatedTaxable !== taxableSubtotalCents || totalTax !== order.taxCents) {
      throw new UnprocessableEntityException({
        error: 'TAX_CONFIGURATION_MISMATCH',
        message: 'Configured tax does not reconcile with the tax captured on the paid order.',
      });
    }

    const shippingTaxCents = 0;
    const computedGrandTotal = taxableSubtotalCents + totalTax + order.shippingCents + shippingTaxCents;
    const roundOffCents = order.grandTotalCents - computedGrandTotal;
    if (Math.abs(roundOffCents) > 1) {
      throw new UnprocessableEntityException({
        error: 'INVOICE_TOTAL_MISMATCH',
        message: 'Invoice totals do not reconcile with the paid order.',
      });
    }

    const [seq] = await tx.$queryRaw<Array<{ value: bigint }>>`SELECT nextval('invoice_number_seq') AS value`;
    const invoiceNumber = `INV-${new Date().getUTCFullYear()}-${String(Number(seq.value)).padStart(6, '0')}`;

    const taxSnapshot = {
      invoiceNumber,
      orderNumber: order.orderNumber,
      issuedAt: new Date().toISOString(),
      seller,
      buyer,
      items: invoiceItems,
      pricing: {
        taxableSubtotalCents,
        cgstCents: cgst,
        sgstCents: sgst,
        igstCents: igst,
        totalTaxCents: totalTax,
        shippingNetCents: order.shippingCents,
        shippingTaxCents,
        discountCents: order.discountCents,
        roundOffCents,
        grandTotalCents: order.grandTotalCents,
        currency: order.currency,
      },
      clauses: {
        reverseCharge: false,
        declaration: 'Tax invoice generated from the immutable paid order snapshot.',
      },
    };

    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber,
        orderId,
        status: 'GENERATED',
        currency: order.currency,
        sellerSnapshot: seller,
        buyerSnapshot: buyer,
        taxableSubtotalCents,
        cgstCents: cgst,
        sgstCents: sgst,
        igstCents: igst,
        totalTaxCents: totalTax,
        shippingNetCents: order.shippingCents,
        shippingTaxCents,
        discountCents: order.discountCents,
        roundOffCents,
        grandTotalCents: order.grandTotalCents,
        taxSnapshot,
        items: { create: invoiceItems },
      },
      include: { items: true },
    });

    this.logger.log(`Invoice ${invoice.invoiceNumber} generated for order ${order.orderNumber}`);
    return this.toDto(invoice);
  }

  async getInvoiceForUser(orderId: string, userId: string, canReadAll: boolean) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { orderId },
      include: { order: { select: { userId: true } }, items: true },
    });
    if (!invoice) throw new NotFoundException({ error: 'INVOICE_NOT_FOUND', message: 'Invoice not found.' });
    if (!canReadAll && invoice.order.userId !== userId) {
      throw new NotFoundException({ error: 'INVOICE_NOT_FOUND', message: 'Invoice not found.' });
    }
    return this.toDto(invoice);
  }

  private allocateCents(total: number, bases: number[]) {
    const sum = bases.reduce((a, b) => a + b, 0);
    if (total === 0) return bases.map(() => 0);
    if (sum <= 0) throw new UnprocessableEntityException({ error: 'INVOICE_INVALID', message: 'Invalid invoice allocation basis.' });
    const values = bases.map((base) => Math.floor((total * base) / sum));
    let remainder = total - values.reduce((a, b) => a + b, 0);
    for (let i = 0; remainder > 0; i = (i + 1) % values.length) {
      values[i]++;
      remainder--;
    }
    return values;
  }

  private normalizeBuyerSnapshot(snapshot: unknown): Record<string, unknown> {
    if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
      throw new UnprocessableEntityException({ error: 'INVOICE_INVALID', message: 'Buyer address snapshot is invalid.' });
    }
    const source = snapshot as Record<string, unknown>;
    const stateCode = typeof source.stateCode === 'string' ? source.stateCode : undefined;
    return { ...source, stateCode };
  }

  private toDto(invoice: any): InvoiceDto {
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      orderId: invoice.orderId,
      status: invoice.status,
      currency: invoice.currency,
      sellerSnapshot: invoice.sellerSnapshot,
      buyerSnapshot: invoice.buyerSnapshot,
      taxableSubtotalCents: invoice.taxableSubtotalCents,
      cgstCents: invoice.cgstCents,
      sgstCents: invoice.sgstCents,
      igstCents: invoice.igstCents,
      totalTaxCents: invoice.totalTaxCents,
      shippingNetCents: invoice.shippingNetCents,
      shippingTaxCents: invoice.shippingTaxCents,
      discountCents: invoice.discountCents,
      roundOffCents: invoice.roundOffCents,
      grandTotalCents: invoice.grandTotalCents,
      taxSnapshot: invoice.taxSnapshot,
      issuedAt: invoice.issuedAt.toISOString(),
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString(),
      items: invoice.items?.map((item: any) => ({
        id: item.id,
        invoiceId: item.invoiceId,
        productName: item.productName,
        sku: item.sku,
        hsnCode: item.hsnCode,
        uom: item.uom,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        taxableValueCents: item.taxableValueCents,
        taxRatePercent: item.taxRatePercent,
        cgstCents: item.cgstCents,
        sgstCents: item.sgstCents,
        igstCents: item.igstCents,
        lineTotalCents: item.lineTotalCents,
        createdAt: item.createdAt.toISOString(),
      })),
    };
  }
}
