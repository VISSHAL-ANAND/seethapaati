import { z } from 'zod';

export enum OutboxStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * Outbox Event DTO Schema
 */
export const OutboxEventDtoSchema = z.object({
  id: z.string().uuid(),
  idempotencyKey: z.string().min(1),
  eventType: z.string().min(1),
  aggregateType: z.string().min(1),
  aggregateId: z.string().min(1),
  payload: z.record(z.unknown()),
  status: z.nativeEnum(OutboxStatus),
  retryCount: z.number().int().nonnegative(),
  maxRetries: z.number().int().positive(),
  nextRetryAt: z.string().datetime().nullable().optional(),
  leasedUntil: z.string().datetime().nullable().optional(),
  leasedBy: z.string().nullable().optional(),
  lastError: z.string().nullable().optional(),
  completedAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type OutboxEventDto = z.infer<typeof OutboxEventDtoSchema>;

/**
 * Event creation payload
 */
export const CreateOutboxEventInputSchema = z.object({
  idempotencyKey: z.string().min(1).optional(),
  eventType: z.string().min(1),
  aggregateType: z.string().min(1),
  aggregateId: z.string().min(1),
  payload: z.record(z.unknown()),
  maxRetries: z.number().int().positive().default(5),
});

export type CreateOutboxEventInput = z.infer<typeof CreateOutboxEventInputSchema>;
