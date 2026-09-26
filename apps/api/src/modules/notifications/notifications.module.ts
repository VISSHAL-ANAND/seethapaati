import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InvoicingModule } from '../invoicing/invoicing.module';
import { NotificationService } from './notification.service';
import { NotificationWorker } from './notification.worker';
import { EmailProvider } from './email.provider';
import { NotificationController } from './notification.controller';