import {BadRequestException,ForbiddenException,Injectable,NotFoundException} from '@nestjs/common';
import {Prisma,ReturnReason,ReturnStatus} from '@prisma/client';
import {PrismaService} from '../prisma/prisma.service';

const transitions:Record<ReturnStatus,ReturnStatus[]>={REQUESTED:['APPROVED','REJECTED','CANCELLED'],APPROVED:['PICKED_UP','CANCELLED'],PICKED_UP:['RECEIVED'],RECEIVED:['INSPECTED'],INSPECTED:['REFUND_ELIGIBLE','REJECTED'],REFUND_ELIGIBLE:['COMPLETED'],COMPLETED:[],REJECTED:[],CANCELLED:[]};

@Injectable()
export class ReturnService {
 constructor(private readonly prisma:PrismaService){}
 async request(orderId:string,userId:string,reason:ReturnReason,items:Array<{orderItemId:string;quantity:number}>,notes?:string,evidenceUrl?:string){
  if (!items.length) throw new BadRequestException({error:'RETURN_ITEMS_REQUIRED'});
  return this.prisma.$transaction(async tx=>{
   const order=await tx.order.findUnique({where:{id:orderId},include:{items:true}});
   if(!order||order.userId!==userId) throw new NotFoundException({error:'ORDER_NOT_FOUND'});
   if(order.status!== 'DELIVERED') throw new BadRequestException({error:'RETURN_NOT_ELIGIBLE'});
   const existing=await tx.return.findFirst({where:{orderId,userId,status:{in:['REQUESTED','APPROVED','PICKED_UP','RECEIVED','INSPECTED','REFUND_ELIGIBLE']}}});
   if(existing) throw new BadRequestException({error:'RETURN_ALREADY_ACTIVE'});
   const locked=await tx.$queryRaw<Array<{id:string;quantity:number}>>`SELECT id, quantity FROM order_items WHERE order_id=${orderId} AND id IN (${Prisma.join(items.map(i=>i.orderItemId))}) FOR UPDATE`;
   if(locked.length!==items.length) throw new BadRequestException({error:'RETURN_ITEM_NOT_FOUND'});
   for(const i of items){if(i.quantity<=0)throw new BadRequestException({error:'INVALID_RETURN_QUANTITY'});const [row]=await tx.$queryRaw<Array<{purchased:number;returned:number}>>`SELECT oi.quantity AS purchased, COALESCE((SELECT SUM(ri.quantity) FROM return_items ri JOIN returns r ON r.id=ri.return_id WHERE ri.order_item_id=oi.id AND r.status NOT IN ('REJECTED','CANCELLED','COMPLETED')),0)::int AS returned FROM order_items oi WHERE oi.id=${i.orderItemId} FOR UPDATE`;if(!row||i.quantity>row.purchased-row.returned)throw new BadRequestException({error:'RETURN_QUANTITY_EXCEEDED'});}
   const [seq]=await tx.$queryRaw<Array<{value:bigint}>>`SELECT nextval('return_number_seq') value`;
   return tx.return.create({data:{returnNumber:`RET-${String(Number(seq.value)).padStart(6,'0')}`,orderId,userId,reason,notes,evidenceUrl,items:{create:items.map(i=>({orderItemId:i.orderItemId,quantity:i.quantity}))}} ,include:{items:true}});
  });
 }
 async listForUser(userId:string,readAll=false){return this.prisma.return.findMany({where:readAll?undefined:{userId},include:{items:true,refunds:true},orderBy:{createdAt:'desc'}})}
 async transition(id:string,status:ReturnStatus,staffNotes?:string){
  return this.prisma.$transaction(async tx=>{const r=await tx.return.findUnique({where:{id}});if(!r)throw new NotFoundException({error:'RETURN_NOT_FOUND'});if(!transitions[r.status].includes(status))throw new BadRequestException({error:'INVALID_RETURN_TRANSITION'});return tx.return.update({where:{id},data:{status,staffNotes:staffNotes??r.staffNotes,resolvedAt:['COMPLETED','REJECTED','CANCELLED'].includes(status)?new Date():r.resolvedAt},include:{items:true}})});
 }
}