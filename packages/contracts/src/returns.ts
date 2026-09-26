import { z } from 'zod';

export const ReturnReasonSchema = z.enum(['DAMAGED', 'WRONG_ITEM', 'QUALITY_ISSUE', 'OTHER']);
export const ReturnConditionSchema = z.enum(['SEALED_INTACT', 'DAMAGED_OPENED']);
export const ReturnStatusSchema = z.enum([
  'REQUESTED', 'APPROVED', 'PICKED_UP', 'RECEIVED', 'INSPECTED',
  'REFUND_ELIGIBLE', 'COMPLETED', 'REJECTED', 'CANCELLED',
]);

export const ReturnItemRequestSchema = z.object({
  orderItemId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export const CreateReturnRequestSchema = z.object({
  reason: ReturnReasonSchema,
  items: z.array(ReturnItemRequestSchema).min(1),
  notes: z.string().trim().max(2000).optional(),
  evidenceUrl: z.string().url().max(2048).optional(),
});

export const ReturnTransitionRequestSchema = z.object({
  status: ReturnStatusSchema,
  staffNotes: z.string().trim().max(2000).optional(),
  inspection: z.array(z.object({
    returnItemId: z.string().uuid(),
    condition: ReturnConditionSchema,
  })).min(1).optional(),
});

export const CreateRefundRequestSchema = z.object({
  amountCents: z.number().int().positive(),
  reason: z.enum(['RETURN', 'REFUND_REQUIRED_OTHER']),
  returnId: z.string().uuid().optional(),
  idempotencyKey: z.string().uuid(),
});

export type CreateReturnRequest = z.infer<typeof CreateReturnRequestSchema>;
export type ReturnTransitionRequest = z.infer<typeof ReturnTransitionRequestSchema>;
export type CreateRefundRequest = z.infer<typeof CreateRefundRequestSchema>;
