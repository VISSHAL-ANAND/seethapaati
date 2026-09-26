import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  Body,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  AuthUser,
  OrderListQuerySchema,
  OrderListQuery,
  UpdateOrderStatusRequestSchema,
  UpdateOrderStatusRequest,
  PermissionName,
} from '@seethapaati/contracts';

/**
 * ORDERS CONTROLLER
 *
 * Exposes customer order views and staff administrative order transitions.
 * Enforces RBAC and IDOR isolation.
 */
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  /**
   * GET /api/v1/orders
   * Customer views their own orders (paginated).
   */
  @Get()
  async getMyOrders(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(OrderListQuerySchema)) query: OrderListQuery,
  ) {
    const data = await this.ordersService.getOrdersForUser(user.id, query);
    return { success: true, data };
  }

  /**
   * GET /api/v1/orders/admin
   * Staff/Admin views all orders across the system.
   */
  @Get('admin')
  @Permissions(PermissionName.ORDERS_READ_ALL)
  async getAllOrders(
    @Query(new ZodValidationPipe(OrderListQuerySchema)) query: OrderListQuery,
  ) {
    const data = await this.ordersService.getAllOrders(query);
    return { success: true, data };
  }

  /**
   * GET /api/v1/orders/:id
   * Customer views their order or staff views any order.
   */
  @Get(':id')
  async getOrderById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    const hasReadAll = user.permissions.includes(PermissionName.ORDERS_READ_ALL);
    const data = await this.ordersService.getOrderById(id, user.id, hasReadAll);
    return { success: true, data };
  }

  /**
   * PATCH /api/v1/orders/:id/status
   * Staff/Admin transitions order status through the state machine.
   */
  @Patch(':id/status')
  @Permissions(PermissionName.ORDERS_UPDATE)
  async updateOrderStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdateOrderStatusRequestSchema)) dto: UpdateOrderStatusRequest,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.ordersService.updateOrderStatus(id, dto, user.id);
    return { success: true, data };
  }

  /**
   * POST /api/v1/orders/:id/cancel
   * Customer cancels an order before payment.
   */
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
    @Body('reason') reason?: string,
  ) {
    const data = await this.ordersService.cancelOrder(id, user.id, reason);
    return { success: true, data };
  }
}
