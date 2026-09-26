import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InventoryModule } from '../inventory/inventory.module';
import { PaymentsService } from './payments.service';
import { RazorpayAdapter } from './razorpay.adapter';
import { WebhookService } from './webhook.service';
import { WebhookController } from './webhook.controller';

@Module({
  imports: [PrismaModule, InventoryModule],
  controllers: [WebhookController],
  providers: [PaymentsService, RazorpayAdapter, WebhookService],
  exports: [PaymentsService, RazorpayAdapter, WebhookService],
})
export class PaymentsModule {}
