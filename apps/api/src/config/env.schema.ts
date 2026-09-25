import { z } from 'zod';

export const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
    PORT: z.coerce.number().default(4000),
    DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/seethapaati_dev?schema=public'),
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.coerce.number().default(6379),
    REDIS_PASSWORD: z.string().optional(),
    JWT_SECRET: z.string().min(16).default('development_jwt_secret_must_be_changed_in_prod'),
    JWT_EXPIRES_IN: z.string().default('7d'),
    CORS_ORIGIN: z.string().default('http://localhost:3000'),
    RAZORPAY_KEY_ID: z.string().default('rzp_test_placeholder'),
    RAZORPAY_KEY_SECRET: z.string().default('rzp_secret_placeholder'),
    RAZORPAY_WEBHOOK_SECRET: z.string().default('rzp_webhook_placeholder'),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production') {
      if (
        data.JWT_SECRET === 'development_jwt_secret_must_be_changed_in_prod' ||
        data.JWT_SECRET.length < 32
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['JWT_SECRET'],
          message:
            'In production, JWT_SECRET must be at least 32 characters and cannot use default development secret',
        });
      }
    }
  });

export type EnvConfig = z.infer<typeof EnvSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const parsed = EnvSchema.safeParse(config);
  if (!parsed.success) {
    console.error('❌ Invalid environment configuration:', JSON.stringify(parsed.error.format(), null, 2));
    throw new Error('Environment variable validation failed');
  }
  return parsed.data;
}
