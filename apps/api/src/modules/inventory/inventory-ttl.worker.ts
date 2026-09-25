import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InventoryService } from './inventory.service';

/**
 * INVENTORY TTL WORKER
 *
 * Runs every 60 seconds via NestJS Scheduler (@Cron).
 * Expires all reservations past their TTL and releases stock back to the available pool.
 *
 * Architecture note: In Phase 2 we use the embedded NestJS scheduler.
 * Phase 5 can migrate to a standalone BullMQ worker process for distributed deployments
 * without changing InventoryService.expireStaleReservations() at all.
 */
@Injectable()
export class InventoryTtlWorker {
  private readonly logger = new Logger(InventoryTtlWorker.name);

  constructor(private inventoryService: InventoryService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async runExpiry(): Promise<void> {
    try {
      const count = await this.inventoryService.expireStaleReservations();
      if (count > 0) {
        this.logger.log(`TTL worker: expired ${count} reservation(s)`);
      }
    } catch (err) {
      this.logger.error(`TTL worker error: ${(err as Error).message}`, (err as Error).stack);
    }
  }
}
