import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { PricingModule } from '../pricing/pricing.module';
import { InvoicingModule } from '../invoicing/invoicing.module';

@Module({
  imports: [PricingModule, InvoicingModule],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
