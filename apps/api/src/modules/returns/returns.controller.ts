import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import {
  CreateRefundRequestSchema,
  CreateReturnRequestSchema,
  PermissionName,
  ReturnTransitionRequestSchema,
} from '@seethapaati/contracts';
import { ReturnReason, ReturnStatus, RefundReason } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ReturnService } from './return.service';
import { RefundService } from './refund.service';

@Controller()
export class ReturnsController {
  constructor(
    private readonly returns: ReturnService,
    private readonly refunds: RefundService,
  ) {}

  @Post('orders/:id/returns')
  async request(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() u: { id: string },
    @Body(new ZodValidationPipe(CreateReturnRequestSchema)) b: {
      reason: 'DAMAGED' | 'WRONG_ITEM' | 'QUALITY_ISSUE' | 'OTHER';
      items: Array<{ orderItemId: string; quantity: number }>;
      notes?: string;
      evidenceUrl?: string;
    },
  ) {
    return {
      success: true,
      data: await this.returns.request(
        id,
        u.id,
        b.reason as ReturnReason,
        b.items,
        b.notes,
        b.evidenceUrl,
      ),
    };
  }

  @Get('returns')
  async mine(@CurrentUser() u: { id: string; permissions: string[] }) {
    return {
      success: true,
      data: await this.returns.listForUser(
        u.id,
        u.permissions.includes(PermissionName.RETURNS_MANAGE),
      ),
    };
  }

  @Get('admin/returns')
  @Permissions(PermissionName.RETURNS_MANAGE)
  async admin() {
    return { success: true, data: await this.returns.listForUser('', true) };
  }

  @Patch('admin/returns/:id/status')
  @Permissions(PermissionName.RETURNS_MANAGE)
  async status(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(ReturnTransitionRequestSchema)) b: {
      status: ReturnStatus;
      staffNotes?: string;
      inspection?: Array<{ returnItemId: string; condition: 'SEALED_INTACT' | 'DAMAGED_OPENED' }>;
    },
  ) {
    return {
      success: true,
      data: await this.returns.transition(id, b.status, b.staffNotes, b.inspection),
    };
  }

  @Post('admin/orders/:id/refunds')
  @Permissions(PermissionName.ORDERS_REFUND)
  async refund(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(CreateRefundRequestSchema)) b: {
      amountCents: number;
      reason: 'RETURN' | 'REFUND_REQUIRED_OTHER';
      returnId?: string;
      idempotencyKey: string;
    },
  ) {
    return {
      success: true,
      data: await this.refunds.process(
        id,
        b.amountCents,
        b.reason as RefundReason,
        b.returnId,
        b.idempotencyKey,
      ),
    };
  }
}
