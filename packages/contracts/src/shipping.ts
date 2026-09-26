import { z } from 'zod';

export const ShipmentStatusSchema = z.enum([
  'CREATED', 'AWB_ASSIGNED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED',
]);

export const CreateShipmentRequestSchema = z.object({
  carrier: z.string().trim().min(2).max(120),
  trackingNumber: z.string().trim().min(2).max(120).optional(),
  trackingUrl: z.string().url().max(2048).optional(),
});

export const ShipmentEventRequestSchema = z.object({
  status: ShipmentStatusSchema,
  location: z.string().trim().max(200).optional(),
  description: z.string().trim().max(1000).optional(),
});

export type CreateShipmentRequest = z.infer<typeof CreateShipmentRequestSchema>;
export type ShipmentEventRequest = z.infer<typeof ShipmentEventRequestSchema>;
