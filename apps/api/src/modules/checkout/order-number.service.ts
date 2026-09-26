import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * ORDER NUMBER SERVICE
 *
 * Generates sequential, concurrency-safe, non-colliding order numbers.
 * Format: SP-000001, SP-000002, etc.
 *
 * Mechanism:
 * Uses PostgreSQL sequence `order_number_seq` (created via Prisma migration).
 * Sequences in PostgreSQL:
 * - Are atomic and lockless (never lock rows or tables)
 * - Safely increment across concurrent transactions
 * - Guaranteed unique, monotonic, and never duplicate
 * - Pure DML (SELECT nextval) — no runtime DDL required
 */
@Injectable()
export class OrderNumberService {
  private readonly logger = new Logger(OrderNumberService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Generate next sequential order number.
   * Can be invoked inside or outside an existing Prisma transaction.
   */
  async generateOrderNumber(tx?: any): Promise<string> {
    const client = tx ?? this.prisma;

    const rows = await client.$queryRaw<Array<{ nextval: bigint | number | string }>>`
      SELECT nextval('order_number_seq')
    `;

    if (rows && rows.length > 0) {
      const val = Number(rows[0].nextval);
      return `SP-${String(val).padStart(6, '0')}`;
    }

    throw new Error('Failed to generate order number from sequence');
  }
}
