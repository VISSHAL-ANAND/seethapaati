import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { UpdateInventoryRequestSchema, UpdateInventoryRequest, PermissionName } from '@seethapaati/contracts';

@Controller('inventory')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get(':variantId')
  @Permissions(PermissionName.INVENTORY_READ)
  async getInventory(@Param('variantId', ParseUUIDPipe) variantId: string) {
    const data = await this.inventoryService.getInventory(variantId);
    return { success: true, data };
  }

  @Patch(':variantId')
  @Permissions(PermissionName.INVENTORY_UPDATE)
  async updateInventory(
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Body(new ZodValidationPipe(UpdateInventoryRequestSchema)) dto: UpdateInventoryRequest,
  ) {
    const data = await this.inventoryService.updateInventory(variantId, dto);
    return { success: true, data };
  }

  @Get(':variantId/reservations')
  @Permissions(PermissionName.INVENTORY_READ)
  async getActiveReservations(@Param('variantId', ParseUUIDPipe) variantId: string) {
    const data = await this.inventoryService.getActiveReservations(variantId);
    return { success: true, data };
  }
}
