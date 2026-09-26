import {BadRequestException,Injectable,NotFoundException} from '@nestjs/common';
import {OrderStatus,PaymentStatus,RefundReason,RefundStatus,ReturnStatus} from '@prisma/client';
import {PrismaService} from '../prisma/prisma.service';
import {RazorpayAdapter} from '../payments/razorpay.adapter';

@Injectable()
export class RefundService {
 constructor(private readonly prisma:PrismaService,private readonly razorpay:RazorpayAdapter){}
 async process(orderId:string,amountCents:number,reason:RefundReason,returnId:string|undefined,idempotencyKey:string){
  const existing=await this.prisma.refund.findUnique({where:{idempotencyKey}});
  if(existing&&existing.status==='PROCESSED')return existing;
  const record=existing??await this.prisma.$transaction(async tx=>{
   const order=await tx.order.findUnique({where:{id:orderId},include:{payments:{where:{status:PaymentStatus.CAPTURED},orderBy:{createdAt:'desc'}}}});
   if(!order)throw new NotFoundException({error:'ORDER_NOT_FOUND'});
   if(returnId){const ret=await tx.return.findUnique({where:{id:returnId}});if(!ret||ret.orderId!==orderId||ret.status!==ReturnStatus.REFUND_ELIGIBLE)throw new BadRequestException({error:'RETURN_NOT_REFUND_ELIGIBLE'});}
   const payment=order.payments[0];if(!payment?.gatewayPaymentId)throw new BadRequestException({error:'PAYMENT_NOT_REFUNDABLE'});
   if(amountCents<=0||amountCents>payment.amountCents)throw new BadRequestException({error:'INVALID_REFUND_AMOUNT'});
   return tx.refund.create({data:{orderId,paymentId:payment.id,returnId,amountCents,currency:payment.currency,reason,idempotencyKey,status:'PENDING'}});
  });
  if(record.status==='PROCESSED')return record;
  const payment=await this.prisma.payment.findUnique({where:{id:record.paymentId}});
  if(!payment?.gatewayPaymentId)throw new BadRequestException({error:'PAYMENT_NOT_REFUNDABLE'});
  const reconciled=await this.razorpay.findRefundByInternalId(payment.gatewayPaymentId,record.id);
  const gateway=reconciled??await this.razorpay.createRefund(payment.gatewayPaymentId,record.amountCents,record.id);
  const processed=await this.prisma.$transaction(async tx=>{
   const updated=await tx.refund.updateMany({where:{id:record.id,status:'PENDING'},data:{status:'PROCESSED',gatewayRefundId:gateway.id,processedAt:new Date()}});
   if(updated.count){if(record.returnId)await tx.return.updateMany({where:{id:record.returnId,status:'REFUND_ELIGIBLE'},data:{status:'COMPLETED',resolvedAt:new Date()}});await tx.order.updateMany({where:{id:orderId,status:{in:[OrderStatus.PAID,OrderStatus.PROCESSING,OrderStatus.PACKED,OrderStatus.SHIPPED,OrderStatus.OUT_FOR_DELIVERY,OrderStatus.DELIVERED]}},data:{status:OrderStatus.REFUNDED}});}
   return tx.refund.findUniqueOrThrow({where:{id:record.id}});
  });
  return processed;
 }
}