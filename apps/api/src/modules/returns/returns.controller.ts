import {Body,Controller,Get,Param,ParseUUIDPipe,Patch,Post} from '@nestjs/common';
import {CurrentUser} from '../../common/decorators/current-user.decorator';
import {Permissions} from '../../common/decorators/permissions.decorator';
import {PermissionName} from '@seethapaati/contracts';
import {ReturnReason,ReturnStatus,RefundReason} from '@prisma/client';
import {ReturnService} from './return.service';
import {RefundService} from './refund.service';

@Controller()
export class ReturnsController {
 constructor(private readonly returns:ReturnService,private readonly refunds:RefundService){}
 @Post('orders/:id/returns') async request(@Param('id',ParseUUIDPipe) id:string,@CurrentUser() u:any,@Body() b:any){
  return {success:true,data:await this.returns.request(id,u.id,b.reason as ReturnReason,b.items,b.notes,b.evidenceUrl)}
 }
 @Get('returns') async mine(@CurrentUser() u:any){return {success:true,data:await this.returns.listForUser(u.id,u.permissions.includes(PermissionName.RETURNS_MANAGE))}}
 @Get('admin/returns') @Permissions(PermissionName.RETURNS_MANAGE) async admin(){return {success:true,data:await this.returns.listForUser('',true)}}
 @Patch('admin/returns/:id/status') @Permissions(PermissionName.RETURNS_MANAGE)
 async status(@Param('id',ParseUUIDPipe) id:string,@Body() b:{status:ReturnStatus;staffNotes?:string}){return {success:true,data:await this.returns.transition(id,b.status,b.staffNotes)}}
 @Post('admin/orders/:id/refunds') @Permissions(PermissionName.ORDERS_REFUND)
 async refund(@Param('id',ParseUUIDPipe) id:string,@Body() b:{amountCents:number;reason:RefundReason;returnId?:string;idempotencyKey:string}){return {success:true,data:await this.refunds.process(id,b.amountCents,b.reason,b.returnId,b.idempotencyKey)}}
}