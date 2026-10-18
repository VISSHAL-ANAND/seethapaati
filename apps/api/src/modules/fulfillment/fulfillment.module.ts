import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ShippingService } from './shipping.service';
import { FulfillmentController } from './fulfillment.controller';

@Module({
  imports: [PrismaModule, NotificationsModule, RedisModule, ConfigModule],
  controllers: [FulfillmentController],
  providers: [ShippingService],
  exports: [ShippingService],
})
export class FulfillmentModule {}