import { z } from 'zod';

export const AddressSchema = z.object({
  id: z.string().uuid().optional(),
  fullName: z.string().min(2).max(100),
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/, 'Invalid phone number'),
  addressLine1: z.string().min(5).max(255),
  addressLine2: z.string().max(255).optional(),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  postalCode: z.string().min(4).max(20),
  country: z.string().length(2).default('IN'),
  isDefault: z.boolean().default(false),
});

export type Address = z.infer<typeof AddressSchema>;

export const CreateAddressRequestSchema = AddressSchema.omit({ id: true });
export type CreateAddressRequest = z.infer<typeof CreateAddressRequestSchema>;

export const UpdateAddressRequestSchema = CreateAddressRequestSchema.partial();
export type UpdateAddressRequest = z.infer<typeof UpdateAddressRequestSchema>;

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string(),
  phone: z.string().nullable().optional(),
  isEmailVerified: z.boolean(),
  createdAt: z.string().datetime(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

export const UpdateProfileRequestSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/).optional(),
});

export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>;
