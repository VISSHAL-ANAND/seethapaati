import {Module} from '@nestjs/common';
import {PrismaModule} from '../prisma/prisma.module';
import {PaymentsModule} from '../payments/payments.module';
import {ReturnService} from './return.service';
import {RefundService} from './refund.service';
import {RefundReconciliationWorker} from './refund-reconciliation.worker';
import {ReturnsController} from './returns.controller';
@Module({imports:[PrismaModule,PaymentsModule],controllers:[ReturnsController],providers:[ReturnService,RefundService,RefundReconciliationWorker],exports:[ReturnService,RefundService]})
export class ReturnsModule {}