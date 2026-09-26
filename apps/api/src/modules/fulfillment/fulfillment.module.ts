import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ShippingService } from './shipping.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { FulfillmentController } from './fulfillment.controller';
@Module({imports:[PrismaModule,NotificationsModule],controllers:[FulfillmentController],providers:[ShippingService],exports:[ShippingService]})
export class FulfillmentModule {}