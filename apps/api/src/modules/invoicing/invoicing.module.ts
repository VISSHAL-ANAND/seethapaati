import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InvoiceService } from './invoice.service';
import { TaxConfigurationService } from './tax-configuration.service';
import { OutboxService } from './outbox.service';
import { InvoicingWorker } from './invoicing.worker';
import { InvoicingController } from './invoicing.controller';

@Module({
  imports: [PrismaModule],
  controllers: [InvoicingController],
  providers: [TaxConfigurationService, InvoiceService, OutboxService, InvoicingWorker],
  exports: [TaxConfigurationService, InvoiceService, OutboxService],
})
export class InvoicingModule {}
