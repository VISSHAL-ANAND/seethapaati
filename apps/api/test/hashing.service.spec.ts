import { HashingService } from '../src/modules/auth/hashing.service';

describe('HashingService', () => {
  let service: HashingService;

  beforeEach(() => {
    service = new HashingService();
  });

  it('should hash a password and verify correctly', async () => {
    const raw = 'SecurePassword123!';
    const hash = await service.hash(raw);

    expect(hash).toBeDefined();
    expect(hash).not.toEqual(raw);

    const isValid = await service.compare(raw, hash);
    expect(isValid).toBe(true);

    const isInvalid = await service.compare('WrongPassword', hash);
    expect(isInvalid).toBe(false);
  });
});
