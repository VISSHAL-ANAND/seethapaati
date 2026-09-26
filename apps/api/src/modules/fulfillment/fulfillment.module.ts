import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ShippingService } from './shipping.service';
import { FulfillmentController } from './fulfillment.controller';
@Module({imports:[PrismaModule],controllers:[FulfillmentController],providers:[ShippingService],exports:[ShippingService]})
export class FulfillmentModule {}