import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { InventoryTtlWorker } from './inventory-ttl.worker';

@Module({
  controllers: [InventoryController],
  providers: [InventoryService, InventoryTtlWorker],
  exports: [InventoryService, InventoryTtlWorker],
})
export class InventoryModule {}
