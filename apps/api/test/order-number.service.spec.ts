import { OrderNumberService } from '../src/modules/checkout/order-number.service';
import { PrismaService } from '../src/modules/prisma/prisma.service';

describe('OrderNumberService', () => {
  let service: OrderNumberService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      $queryRaw: jest.fn(),
    };
    service = new OrderNumberService(prisma as unknown as PrismaService);
  });

  it('formats order numbers with sequential SP-000001 pattern', async () => {
    prisma.$queryRaw.mockResolvedValueOnce([{ nextval: 1n }]);
    const num1 = await service.generateOrderNumber();
    expect(num1).toBe('SP-000001');

    prisma.$queryRaw.mockResolvedValueOnce([{ nextval: 42n }]);
    const num2 = await service.generateOrderNumber();
    expect(num2).toBe('SP-000042');

    prisma.$queryRaw.mockResolvedValueOnce([{ nextval: 10005n }]);
    const num3 = await service.generateOrderNumber();
    expect(num3).toBe('SP-010005');
  });

  it('uses transaction client when provided', async () => {
    const tx = {
      $queryRaw: jest.fn().mockResolvedValueOnce([{ nextval: 5n }]),
    };

    const num = await service.generateOrderNumber(tx);
    expect(num).toBe('SP-000005');
    expect(tx.$queryRaw).toHaveBeenCalled();
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it('throws error if sequence query returns empty result', async () => {
    prisma.$queryRaw.mockResolvedValueOnce([]);

    await expect(service.generateOrderNumber()).rejects.toThrow(
      'Failed to generate order number from sequence',
    );
  });
});
