import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InventoryModule } from '../inventory/inventory.module';
import { InvoicingModule } from '../invoicing/invoicing.module';
import { PaymentsService } from './payments.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { RazorpayAdapter } from './razorpay.adapter';
import { WebhookService } from './webhook.service';
import { WebhookController } from './webhook.controller';

@Module({
  imports: [
    PrismaModule,
    InventoryModule,
    InvoicingModule,
    NotificationsModule,
  ],
  controllers: [WebhookController],
  providers: [PaymentsService, RazorpayAdapter, WebhookService],
  exports: [PaymentsService, RazorpayAdapter, WebhookService],
})
export class PaymentsModule {}
