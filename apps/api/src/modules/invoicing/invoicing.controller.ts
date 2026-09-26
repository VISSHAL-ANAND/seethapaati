import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { PermissionName } from '@seethapaati/contracts';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { InvoiceService } from './invoice.service';

@Controller('invoices')
export class InvoicingController {
  constructor(private readonly invoices: InvoiceService) {}

  @Get('order/:orderId')
  async getOrderInvoice(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @CurrentUser() user: { id: string; permissions: string[] },
  ) {
    const canReadAll = user.permissions.includes(PermissionName.ORDERS_READ_ALL);
    return { success: true, data: await this.invoices.getInvoiceForUser(orderId, user.id, canReadAll) };
  }

  @Get('admin/order/:orderId')
  @Permissions(PermissionName.ORDERS_READ_ALL)
  async getAdminOrderInvoice(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return { success: true, data: await this.invoices.getInvoiceForUser(orderId, '', true) };
  }
}
