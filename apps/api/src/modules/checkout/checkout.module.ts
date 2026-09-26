import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PricingModule } from '../pricing/pricing.module';
import { InventoryModule } from '../inventory/inventory.module';
import { PaymentsModule } from '../payments/payments.module';
import { InvoicingModule } from '../invoicing/invoicing.module';
import { CheckoutService } from './checkout.service';
import { OrderNumberService } from './order-number.service';
import { CheckoutController } from './checkout.controller';

@Module({
  imports: [PrismaModule, PricingModule, InventoryModule, PaymentsModule, InvoicingModule],
  controllers: [CheckoutController],
  providers: [CheckoutService, OrderNumberService],
  exports: [CheckoutService, OrderNumberService],
})
export class CheckoutModule {}
