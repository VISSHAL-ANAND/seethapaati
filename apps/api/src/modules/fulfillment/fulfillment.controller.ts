import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import {
  CreateShipmentRequestSchema,
  PermissionName,
  ShipmentEventRequestSchema,
} from '@seethapaati/contracts';
import { ShipmentStatus } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ShippingService } from './shipping.service';

@Controller()
export class FulfillmentController {
  constructor(private readonly shipping: ShippingService) {}

  @Get('orders/:id/track')
  async track(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() u: { id: string; permissions: string[] },
  ) {
    return {
      success: true,
      data: await this.shipping.track(
        id,
        u.id,
        u.permissions.includes(PermissionName.ORDERS_READ_ALL),
      ),
    };
  }

  @Post('admin/orders/:id/shipments')
  @Permissions(PermissionName.SHIPMENTS_MANAGE)
  async create(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(CreateShipmentRequestSchema)) b: {
      carrier: string;
      trackingNumber?: string;
      trackingUrl?: string;
    },
  ) {
    return {
      success: true,
      data: await this.shipping.create(id, b.carrier, b.trackingNumber, b.trackingUrl),
    };
  }

  @Post('admin/shipments/:id/events')
  @Permissions(PermissionName.SHIPMENTS_MANAGE)
  async event(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(ShipmentEventRequestSchema)) b: {
      status: ShipmentStatus;
      location?: string;
      description?: string;
    },
  ) {
    return {
      success: true,
      data: await this.shipping.addEvent(id, b.status, b.location, b.description),
    };
  }
}
