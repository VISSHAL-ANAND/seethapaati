import {Body,Controller,Get,Param,ParseUUIDPipe,Patch,Post} from '@nestjs/common';
import {PermissionName} from '@seethapaati/contracts';
import {CurrentUser} from '../../common/decorators/current-user.decorator';
import {Permissions} from '../../common/decorators/permissions.decorator';
import {ShippingService} from './shipping.service';
import {ShipmentStatus} from '@prisma/client';

@Controller()
export class FulfillmentController {
 constructor(private readonly shipping:ShippingService){}
 @Get('orders/:id/track') async track(@Param('id',ParseUUIDPipe) id:string,@CurrentUser() u:any){return {success:true,data:await this.shipping.track(id,u.id,u.permissions.includes(PermissionName.ORDERS_READ_ALL))}}
 @Post('admin/orders/:id/shipments') @Permissions(PermissionName.ORDERS_UPDATE)
 async create(@Param('id',ParseUUIDPipe) id:string,@Body() b:any){return {success:true,data:await this.shipping.create(id,b.carrier,b.trackingNumber,b.trackingUrl)}}
 @Post('admin/shipments/:id/events') @Permissions(PermissionName.ORDERS_UPDATE)
 async event(@Param('id',ParseUUIDPipe) id:string,@Body() b:{status:ShipmentStatus;location?:string;description?:string}){return {success:true,data:await this.shipping.addEvent(id,b.status,b.location,b.description)}}
}