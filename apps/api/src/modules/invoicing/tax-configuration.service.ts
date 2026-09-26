import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, TaxRate } from '@prisma/client';
import { SellerTaxConfigSchema } from '@seethapaati/contracts';
import { PrismaService } from '../prisma/prisma.service';

export type TaxClient = PrismaService | Prisma.TransactionClient;

@Injectable()
export class TaxConfigurationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  getSellerConfig() {
    const parsed = SellerTaxConfigSchema.safeParse({
      legalName: this.config.get<string>('SELLER_LEGAL_NAME'),
      tradeName: this.config.get<string>('SELLER_TRADE_NAME'),
      gstin: this.config.get<string>('SELLER_GSTIN'),
      address: {
        line1: this.config.get<string>('SELLER_ADDRESS_LINE1'),
        line2: this.config.get<string>('SELLER_ADDRESS_LINE2'),
        city: this.config.get<string>('SELLER_CITY'),
        state: this.config.get<string>('SELLER_STATE'),
        stateCode: this.config.get<string>('SELLER_STATE_CODE'),
        pincode: this.config.get<string>('SELLER_PINCODE'),
      },
      stateCode: this.config.get<string>('SELLER_STATE_CODE'),
      stateName: this.config.get<string>('SELLER_STATE'),
    });
    if (!parsed.success) {
      throw new UnprocessableEntityException({
        error: 'TAX_CONFIGURATION_MISSING',
        message: 'Seller tax configuration is incomplete or invalid.',
      });
    }
    return parsed.data;
  }

  async getRate(hsnCode: string, client: TaxClient = this.prisma): Promise<TaxRate> {
    const code = hsnCode.trim();
    if (!code) {
      throw new UnprocessableEntityException({
        error: 'TAX_CONFIGURATION_MISSING',
        message: 'HSN code is required for invoicing.',
      });
    }
    const rate = await client.taxRate.findFirst({
      where: { hsnCode: code, isActive: true },
    });
    if (!rate) {
      throw new UnprocessableEntityException({
        error: 'TAX_CONFIGURATION_MISSING',
        message: `No active tax configuration exists for HSN ${code}.`,
      });
    }
    return rate;
  }

  calculateTax(taxableValueCents: number, taxRatePercent: number, intraState: boolean) {
    if (!Number.isInteger(taxableValueCents) || taxableValueCents < 0) {
      throw new UnprocessableEntityException({ error: 'TAX_CALCULATION_INVALID', message: 'Invalid taxable value.' });
    }
    if (!Number.isFinite(taxRatePercent) || taxRatePercent < 0) {
      throw new UnprocessableEntityException({ error: 'TAX_CONFIGURATION_MISSING', message: 'Invalid tax rate.' });
    }
    const totalTaxCents = Math.round((taxableValueCents * taxRatePercent) / 100);
    if (intraState) {
      const cgstCents = Math.floor(totalTaxCents / 2);
      return {
        totalTaxCents,
        cgstCents,
        sgstCents: totalTaxCents - cgstCents,
        igstCents: 0,
        cgstRatePercent: taxRatePercent / 2,
        sgstRatePercent: taxRatePercent / 2,
        igstRatePercent: 0,
      };
    }
    return {
      totalTaxCents,
      cgstCents: 0,
      sgstCents: 0,
      igstCents: totalTaxCents,
      cgstRatePercent: 0,
      sgstRatePercent: 0,
      igstRatePercent: taxRatePercent,
    };
  }
}
