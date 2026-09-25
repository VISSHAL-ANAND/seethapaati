import { validateEnv } from '../src/config/env.schema';

describe('EnvSchema - Production Configuration Validation', () => {
  it('should accept valid development configuration with defaults', () => {
    const validDev = validateEnv({
      NODE_ENV: 'development',
    });

    expect(validDev.NODE_ENV).toBe('development');
    expect(validDev.PORT).toBe(4000);
    expect(validDev.JWT_SECRET).toBe('development_jwt_secret_must_be_changed_in_prod');
  });

  it('should throw an error in production if JWT_SECRET uses the default dev secret', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'production',
        JWT_SECRET: 'development_jwt_secret_must_be_changed_in_prod',
      }),
    ).toThrow('Environment variable validation failed');
  });

  it('should throw an error in production if JWT_SECRET is shorter than 32 characters', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'production',
        JWT_SECRET: 'too_short_secret',
      }),
    ).toThrow('Environment variable validation failed');
  });

  it('should pass in production when a secure 32+ character secret is provided', () => {
    const validProd = validateEnv({
      NODE_ENV: 'production',
      JWT_SECRET: 'a_very_secure_production_jwt_secret_at_least_32_characters_long',
    });

    expect(validProd.NODE_ENV).toBe('production');
    expect(validProd.JWT_SECRET).toBe(
      'a_very_secure_production_jwt_secret_at_least_32_characters_long',
    );
  });
});
