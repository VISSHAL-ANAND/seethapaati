import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderStatus, Prisma, ShipmentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const transitions: Record<ShipmentStatus, ShipmentStatus[]> = {
  CREATED: ['AWB_ASSIGNED','CANCELLED'], AWB_ASSIGNED: ['SHIPPED','CANCELLED'],
  SHIPPED: ['OUT_FOR_DELIVERY'], OUT_FOR_DELIVERY: ['DELIVERED'], DELIVERED: [], CANCELLED: []
};

@Injectable()
export class ShippingService {
  constructor(private readonly prisma: PrismaService) {}

  async create(orderId:string, carrier:string, trackingNumber?:string, trackingUrl?:string) {
    return this.prisma.$transaction(async tx=>{
      const order=await tx.order.findUnique({where:{id:orderId}});
      if(!order) throw new NotFoundException({error:'ORDER_NOT_FOUND'});
      if(![OrderStatus.PAID,OrderStatus.PROCESSING,OrderStatus.PACKED].includes(order.status)) throw new BadRequestException({error:'ORDER_NOT_SHIPPABLE'});
      const existing=await tx.shipment.findUnique({where:{orderId}});
      if(existing) return existing;
      return tx.shipment.create({data:{orderId,carrier,trackingNumber,trackingUrl,status:trackingNumber?'AWB_ASSIGNED':'CREATED',
        trackingEvents:{create:{status:trackingNumber?'AWB_ASSIGNED':'CREATED',description:'Shipment created'}}},include:{trackingEvents:true}});
    });
  }

  async addEvent(shipmentId:string,status:ShipmentStatus,location?:string,description?:string) {
    return this.prisma.$transaction(async tx=>{
      const s=await tx.shipment.findUnique({where:{id:shipmentId}});
      if(!s) throw new NotFoundException({error:'SHIPMENT_NOT_FOUND'});
      if(!transitions[s.status].includes(status)) throw new BadRequestException({error:'INVALID_SHIPMENT_TRANSITION'});
      if(status===ShipmentStatus.SHIPPED && (!s.carrier || !s.trackingNumber)) throw new BadRequestException({error:'TRACKING_REQUIRED'});
      const now=new Date();
      const shipment=await tx.shipment.update({where:{id:shipmentId},data:{
        status, dispatchedAt:status===ShipmentStatus.SHIPPED?now:s.dispatchedAt,
        deliveredAt:status===ShipmentStatus.DELIVERED?now:s.deliveredAt
      }});
      await tx.shipmentTrackingEvent.create({data:{shipmentId,status,location,description}});
      const orderStatus = status===ShipmentStatus.SHIPPED?OrderStatus.SHIPPED:status===ShipmentStatus.OUT_FOR_DELIVERY?OrderStatus.OUT_FOR_DELIVERY:status===ShipmentStatus.DELIVERED?OrderStatus.DELIVERED:undefined;
      if(orderStatus) await tx.order.updateMany({where:{id:s.orderId,status:{in:[OrderStatus.PAID,OrderStatus.PROCESSING,OrderStatus.PACKED,OrderStatus.SHIPPED,OrderStatus.OUT_FOR_DELIVERY]}},data:{status:orderStatus}});
      return shipment;
    });
  }

  async track(orderId:string,userId:string,readAll=false) {
    const order=await this.prisma.order.findUnique({where:{id:orderId},select:{userId:true}});
    if(!order || (!readAll && order.userId!==userId)) throw new NotFoundException({error:'ORDER_NOT_FOUND'});
    const shipment=await this.prisma.shipment.findUnique({where:{orderId},include:{trackingEvents:{orderBy:{occurredAt:'asc'}}}});
    if(!shipment) throw new NotFoundException({error:'SHIPMENT_NOT_FOUND'});
    return shipment;
  }
}
