import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus, ShipmentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { NotificationService } from '../notifications/notification.service';

const transitions: Record<ShipmentStatus, ShipmentStatus[]> = {
  CREATED: ['AWB_ASSIGNED', 'SHIPPED', 'CANCELLED'],
  AWB_ASSIGNED: ['SHIPPED', 'IN_TRANSIT', 'CANCELLED'],
  SHIPPED: ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'],
  IN_TRANSIT: ['OUT_FOR_DELIVERY', 'DELIVERED'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

export interface TrackingCheckpoint {
  key: 'ORDERED' | 'PAID' | 'PACKED' | 'SHIPPED' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED';
  label: string;
  completed: boolean;
  active: boolean;
  timestamp?: string | null;
  description?: string | null;
  location?: string | null;
}

@Injectable()
export class ShippingService {
  private readonly logger = new Logger(ShippingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  /**
   * 1. Manual Admin Tracking Entry
   * Updates an order directly with courier name, tracking number (AWB), and tracking URL,
   * transitioning the order and shipment status to SHIPPED immediately.
   */
  async updateManualTracking(
    orderId: string,
    courierName: string,
    trackingNumber: string,
    trackingUrl?: string,
    adminId = 'ADMIN',
  ) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order) {
        throw new NotFoundException({ error: 'ORDER_NOT_FOUND', message: 'Order not found' });
      }

      const now = new Date();
      const generatedTrackingUrl =
        trackingUrl || this.generateDefaultTrackingUrl(courierName, trackingNumber);

      // 1. Create or Update Shipment
      const existingShipment = await tx.shipment.findUnique({ where: { orderId } });
      let shipment;

      if (existingShipment) {
        shipment = await tx.shipment.update({
          where: { orderId },
          data: {
            carrier: courierName,
            trackingNumber,
            trackingUrl: generatedTrackingUrl,
            status: ShipmentStatus.SHIPPED,
            dispatchedAt: existingShipment.dispatchedAt || now,
          },
        });
      } else {
        shipment = await tx.shipment.create({
          data: {
            orderId,
            carrier: courierName,
            trackingNumber,
            trackingUrl: generatedTrackingUrl,
            status: ShipmentStatus.SHIPPED,
            dispatchedAt: now,
          },
        });
      }

      // 2. Add Tracking Event
      await tx.shipmentTrackingEvent.create({
        data: {
          shipmentId: shipment.id,
          status: ShipmentStatus.SHIPPED,
          location: 'Chennai Fulfillment Center',
          description: `Dispatched with ${courierName}. AWB: ${trackingNumber}`,
        },
      });

      // 3. Update Order status and tracking columns
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.SHIPPED,
          courierName,
          trackingNumber,
          trackingUrl: generatedTrackingUrl,
          shippedAt: order.shippedAt || now,
        },
      });

      // 4. Record in OrderStatusHistory
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          oldStatus: order.status,
          newStatus: OrderStatus.SHIPPED,
          reason: `Dispatched via ${courierName} (AWB: ${trackingNumber})`,
          changedBy: adminId,
        },
      });

      // 5. Notify Customer
      await this.notifications.enqueueShipmentStatus(orderId, shipment.id, ShipmentStatus.SHIPPED, tx);

      this.logger.log(`Order ${order.orderNumber} manually updated to SHIPPED via ${courierName} (${trackingNumber})`);
      return { order: updatedOrder, shipment };
    });
  }

  /**
   * Create standard shipment without immediately dispatching
   */
  async create(orderId: string, carrier: string, trackingNumber?: string, trackingUrl?: string) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) throw new NotFoundException({ error: 'ORDER_NOT_FOUND' });

      if (
        !([
          OrderStatus.PAID,
          OrderStatus.PROCESSING,
          OrderStatus.PACKED,
        ] as OrderStatus[]).includes(order.status)
      ) {
        throw new BadRequestException({ error: 'ORDER_NOT_SHIPPABLE', message: `Order in status ${order.status} cannot be shipped.` });
      }

      const existing = await tx.shipment.findUnique({ where: { orderId } });
      if (existing) return existing;

      const status = trackingNumber ? ShipmentStatus.AWB_ASSIGNED : ShipmentStatus.CREATED;
      return tx.shipment.create({
        data: {
          orderId,
          carrier,
          trackingNumber,
          trackingUrl: trackingUrl || (trackingNumber ? this.generateDefaultTrackingUrl(carrier, trackingNumber) : undefined),
          status,
          trackingEvents: {
            create: {
              status,
              description: trackingNumber ? `AWB ${trackingNumber} assigned via ${carrier}` : 'Shipment manifest created',
            },
          },
        },
        include: { trackingEvents: true },
      });
    });
  }

  /**
   * Transition shipment event
   */
  async addEvent(shipmentId: string, status: ShipmentStatus, location?: string, description?: string) {
    return this.prisma.$transaction(async (tx) => {
      const [s] = await tx.$queryRaw<
        Array<{
          id: string;
          orderId: string;
          status: ShipmentStatus;
          carrier: string;
          trackingNumber: string | null;
          trackingUrl: string | null;
          dispatchedAt: Date | null;
          deliveredAt: Date | null;
        }>
      >`
        SELECT id, order_id AS "orderId", status, carrier, tracking_number AS "trackingNumber", tracking_url AS "trackingUrl", dispatched_at AS "dispatchedAt", delivered_at AS "deliveredAt"
        FROM shipments WHERE id=${shipmentId} FOR UPDATE
      `;

      if (!s) throw new NotFoundException({ error: 'SHIPMENT_NOT_FOUND' });
      if (!transitions[s.status].includes(status)) {
        throw new BadRequestException({
          error: 'INVALID_SHIPMENT_TRANSITION',
          message: `Cannot transition shipment from ${s.status} to ${status}`,
        });
      }

      if (status === ShipmentStatus.SHIPPED && (!s.carrier || !s.trackingNumber)) {
        throw new BadRequestException({ error: 'TRACKING_REQUIRED', message: 'Carrier and tracking number are required to mark SHIPPED' });
      }

      const now = new Date();
      const shipment = await tx.shipment.update({
        where: { id: shipmentId },
        data: {
          status,
          dispatchedAt: status === ShipmentStatus.SHIPPED ? now : s.dispatchedAt,
          deliveredAt: status === ShipmentStatus.DELIVERED ? now : s.deliveredAt,
        },
      });

      await tx.shipmentTrackingEvent.create({
        data: { shipmentId, status, location, description },
      });

      await this.notifications.enqueueShipmentStatus(s.orderId, shipmentId, status, tx);

      // Synchronize Order status
      const mappedOrderStatus: OrderStatus | undefined =
        status === ShipmentStatus.SHIPPED
          ? OrderStatus.SHIPPED
          : status === ShipmentStatus.IN_TRANSIT
          ? OrderStatus.IN_TRANSIT
          : status === ShipmentStatus.OUT_FOR_DELIVERY
          ? OrderStatus.OUT_FOR_DELIVERY
          : status === ShipmentStatus.DELIVERED
          ? OrderStatus.DELIVERED
          : undefined;

      if (mappedOrderStatus) {
        await tx.order.updateMany({
          where: {
            id: s.orderId,
            status: {
              in: [
                OrderStatus.PAID,
                OrderStatus.PROCESSING,
                OrderStatus.PACKED,
                OrderStatus.SHIPPED,
                OrderStatus.IN_TRANSIT,
                OrderStatus.OUT_FOR_DELIVERY,
              ],
            },
          },
          data: {
            status: mappedOrderStatus,
            ...(mappedOrderStatus === OrderStatus.DELIVERED ? { deliveredAt: now } : {}),
            ...(mappedOrderStatus === OrderStatus.SHIPPED ? { shippedAt: now } : {}),
          },
        });
      }

      return shipment;
    });
  }

  /**
   * 2. Shiprocket Integration
   * Automatically pushes a paid order to Shiprocket when credentials exist.
   */
  async pushOrderToShiprocket(orderId: string): Promise<{ success: boolean; shiprocketOrderId?: number; message?: string }> {
    const email = this.config.get<string>('SHIPROCKET_EMAIL');
    const password = this.config.get<string>('SHIPROCKET_PASSWORD');

    if (!email || !password) {
      this.logger.debug('Shiprocket credentials not configured. Skipping automated API fulfillment.');
      return { success: false, message: 'Shiprocket credentials not configured' };
    }

    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true, user: true },
      });

      if (!order) return { success: false, message: 'Order not found' };

      const token = await this.getShiprocketToken(email, password);
      if (!token) return { success: false, message: 'Unable to authenticate with Shiprocket' };

      const address = (order.shippingAddressSnapshot as Record<string, any>) || {};
      const orderDate = order.createdAt.toISOString().slice(0, 19).replace('T', ' ');

      const payload = {
        order_id: order.orderNumber,
        order_date: orderDate,
        pickup_location: this.config.get<string>('SHIPROCKET_PICKUP_LOCATION', 'Primary'),
        billing_customer_name: address.fullName || 'Patron',
        billing_last_name: '',
        billing_address: address.addressLine1 || '',
        billing_address_2: address.addressLine2 || '',
        billing_city: address.city || 'Chennai',
        billing_pincode: address.postalCode || '600004',
        billing_state: address.state || 'Tamil Nadu',
        billing_country: 'India',
        billing_email: order.user?.email || 'orders@seethapaati.com',
        billing_phone: address.phone || '9876543210',
        shipping_is_billing: true,
        order_items: order.items.map((item) => ({
          name: item.productNameSnapshot,
          sku: item.skuSnapshot,
          units: item.quantity,
          selling_price: (item.unitPriceCents / 100).toFixed(2),
          discount: 0,
          tax: (item.taxCents / 100).toFixed(2),
          hsn: item.hsnCodeSnapshot || '0910',
        })),
        payment_method: 'Prepaid',
        sub_total: (order.subtotalCents / 100).toFixed(2),
        length: 12,
        breadth: 12,
        height: 10,
        weight: (
          order.items.reduce((sum, item) => sum + (item.weightGramsSnapshot || 250) * item.quantity, 0) / 1000
        ).toFixed(2),
      };

      const response = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data?.order_id) {
        this.logger.log(`Order ${order.orderNumber} successfully pushed to Shiprocket (ID: ${data.order_id})`);
        return { success: true, shiprocketOrderId: data.order_id };
      }

      this.logger.warn(`Shiprocket order creation returned unexpected payload: ${JSON.stringify(data)}`);
      return { success: false, message: data?.message || 'Shiprocket order creation failed' };
    } catch (err) {
      this.logger.error(`Failed to push order to Shiprocket: ${(err as Error).message}`);
      return { success: false, message: (err as Error).message };
    }
  }

  /**
   * Shiprocket Webhook Handler
   * Receives live tracking updates from Shiprocket tracking webhook.
   */
  async processShippingWebhook(payload: any): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log(`Received shipping webhook: ${JSON.stringify(payload)}`);

      // Shiprocket sends order_id (our orderNumber) or awb
      const orderNumber = payload.order_id || payload.order_no;
      const awb = payload.awb || payload.awb_code;
      const courierName = payload.courier_name || payload.carrier_name || 'Courier';
      const statusText = (payload.current_status || payload.status || '').toUpperCase();
      const location = payload.location || payload.current_city || 'In Transit';
      const description = payload.activity || payload.scans?.[0]?.activity || `Status: ${statusText}`;

      let order;
      if (orderNumber) {
        order = await this.prisma.order.findUnique({
          where: { orderNumber: String(orderNumber) },
          include: { shipment: true },
        });
      } else if (awb) {
        const shipment = await this.prisma.shipment.findUnique({
          where: { trackingNumber: String(awb) },
          include: { order: true },
        });
        order = shipment?.order;
      }

      if (!order) {
        this.logger.warn(`Shipping webhook received for unknown order: ${orderNumber || awb}`);
        return { success: false, message: 'Order not found' };
      }

      // Map courier status to our internal ShipmentStatus & OrderStatus
      let targetShipmentStatus: ShipmentStatus | null = null;

      if (['PICKED UP', 'IN TRANSIT', 'REACHED AT DESTINATION', 'DISPATCHED'].some((s) => statusText.includes(s))) {
        targetShipmentStatus = ShipmentStatus.IN_TRANSIT;
      } else if (['OUT FOR DELIVERY', 'OUT_FOR_DELIVERY'].some((s) => statusText.includes(s))) {
        targetShipmentStatus = ShipmentStatus.OUT_FOR_DELIVERY;
      } else if (['DELIVERED', 'COMPLETED'].some((s) => statusText.includes(s))) {
        targetShipmentStatus = ShipmentStatus.DELIVERED;
      } else if (['RTO', 'CANCELLED', 'RETURNED'].some((s) => statusText.includes(s))) {
        targetShipmentStatus = ShipmentStatus.CANCELLED;
      }

      const now = new Date();

      await this.prisma.$transaction(async (tx) => {
        let shipment = order.shipment;
        if (!shipment) {
          shipment = await tx.shipment.create({
            data: {
              orderId: order.id,
              carrier: courierName,
              trackingNumber: awb,
              trackingUrl: awb ? this.generateDefaultTrackingUrl(courierName, awb) : undefined,
              status: targetShipmentStatus || ShipmentStatus.SHIPPED,
              dispatchedAt: now,
            },
          });
        } else if (targetShipmentStatus) {
          shipment = await tx.shipment.update({
            where: { id: shipment.id },
            data: {
              status: targetShipmentStatus,
              carrier: courierName || shipment.carrier,
              trackingNumber: awb || shipment.trackingNumber,
              deliveredAt: targetShipmentStatus === ShipmentStatus.DELIVERED ? now : shipment.deliveredAt,
            },
          });
        }

        if (targetShipmentStatus) {
          await tx.shipmentTrackingEvent.create({
            data: {
              shipmentId: shipment.id,
              status: targetShipmentStatus,
              location,
              description,
            },
          });

          // Sync Order status
          const orderStatusMap: Record<ShipmentStatus, OrderStatus> = {
            CREATED: OrderStatus.PACKED,
            AWB_ASSIGNED: OrderStatus.PACKED,
            SHIPPED: OrderStatus.SHIPPED,
            IN_TRANSIT: OrderStatus.IN_TRANSIT,
            OUT_FOR_DELIVERY: OrderStatus.OUT_FOR_DELIVERY,
            DELIVERED: OrderStatus.DELIVERED,
            CANCELLED: OrderStatus.CANCELLED,
          };

          const newOrderStatus = orderStatusMap[targetShipmentStatus];
          if (newOrderStatus) {
            await tx.order.update({
              where: { id: order.id },
              data: {
                status: newOrderStatus,
                courierName: courierName || order.courierName,
                trackingNumber: awb || order.trackingNumber,
                trackingUrl: (awb ? this.generateDefaultTrackingUrl(courierName, awb) : undefined) || order.trackingUrl,
                ...(newOrderStatus === OrderStatus.DELIVERED ? { deliveredAt: now } : {}),
                ...(newOrderStatus === OrderStatus.SHIPPED ? { shippedAt: now } : {}),
              },
            });

            await tx.orderStatusHistory.create({
              data: {
                orderId: order.id,
                oldStatus: order.status,
                newStatus: newOrderStatus,
                reason: `Shipping update: ${description}`,
                changedBy: 'SHIPROCKET_WEBHOOK',
              },
            });

            await this.notifications.enqueueShipmentStatus(order.id, shipment.id, targetShipmentStatus, tx);
          }
        }
      });

      return { success: true, message: 'Tracking updated' };
    } catch (err) {
      this.logger.error(`Error processing shipping webhook: ${(err as Error).message}`);
      return { success: false, message: (err as Error).message };
    }
  }

  /**
   * 3. Enhanced Order Tracking Timeline
   * Generates step-by-step progress checkpoints with dates and descriptions.
   */
  async track(orderId: string, userId?: string, readAll = false) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        statusHistory: { orderBy: { createdAt: 'asc' } },
        items: true,
      },
    });

    if (!order) throw new NotFoundException({ error: 'ORDER_NOT_FOUND', message: 'Order not found' });
    if (userId && !readAll && order.userId !== userId) {
      throw new NotFoundException({ error: 'ORDER_NOT_FOUND', message: 'Order not found' });
    }

    const shipment = await this.prisma.shipment.findUnique({
      where: { orderId },
      include: { trackingEvents: { orderBy: { occurredAt: 'asc' } } },
    });

    const checkpoints = this.buildTrackingTimeline(order, shipment);

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      courierName: order.courierName || shipment?.carrier || null,
      trackingNumber: order.trackingNumber || shipment?.trackingNumber || null,
      trackingUrl: order.trackingUrl || shipment?.trackingUrl || null,
      createdAt: order.createdAt,
      shippedAt: order.shippedAt || shipment?.dispatchedAt || null,
      deliveredAt: order.deliveredAt || shipment?.deliveredAt || null,
      shipment: shipment || null,
      checkpoints,
    };
  }

  private buildTrackingTimeline(order: any, shipment: any): TrackingCheckpoint[] {
    const statusOrder: OrderStatus[] = [
      OrderStatus.PENDING_PAYMENT,
      OrderStatus.PAID,
      OrderStatus.PACKED,
      OrderStatus.SHIPPED,
      OrderStatus.IN_TRANSIT,
      OrderStatus.OUT_FOR_DELIVERY,
      OrderStatus.DELIVERED,
    ];

    const currentIdx = statusOrder.indexOf(order.status);

    const getStatusDate = (status: OrderStatus): string | undefined => {
      const history = order.statusHistory?.find((h: any) => h.newStatus === status);
      return history?.createdAt ? new Date(history.createdAt).toISOString() : undefined;
    };

    const latestEvent = shipment?.trackingEvents?.[shipment.trackingEvents.length - 1];

    return [
      {
        key: 'ORDERED',
        label: 'Order Placed',
        completed: true,
        active: order.status === OrderStatus.PENDING_PAYMENT,
        timestamp: order.createdAt.toISOString(),
        description: 'Order details confirmed',
      },
      {
        key: 'PAID',
        label: 'Payment Confirmed',
        completed: currentIdx >= statusOrder.indexOf(OrderStatus.PAID),
        active: order.status === OrderStatus.PAID,
        timestamp: getStatusDate(OrderStatus.PAID),
        description: 'Payment authorized & verified',
      },
      {
        key: 'PACKED',
        label: 'Packed & Sealed',
        completed: currentIdx >= statusOrder.indexOf(OrderStatus.PACKED),
        active: order.status === OrderStatus.PACKED || order.status === OrderStatus.PROCESSING,
        timestamp: getStatusDate(OrderStatus.PACKED) || getStatusDate(OrderStatus.PROCESSING),
        description: 'Handcrafted selections packed in Chennai',
      },
      {
        key: 'SHIPPED',
        label: 'Dispatched',
        completed: currentIdx >= statusOrder.indexOf(OrderStatus.SHIPPED),
        active: order.status === OrderStatus.SHIPPED,
        timestamp: order.shippedAt ? new Date(order.shippedAt).toISOString() : getStatusDate(OrderStatus.SHIPPED),
        description: order.courierName ? `Handed over to ${order.courierName}` : 'Handed over to courier partner',
        location: 'Chennai Hub',
      },
      {
        key: 'IN_TRANSIT',
        label: 'In Transit',
        completed: currentIdx >= statusOrder.indexOf(OrderStatus.IN_TRANSIT),
        active: order.status === OrderStatus.IN_TRANSIT,
        timestamp: getStatusDate(OrderStatus.IN_TRANSIT),
        description: latestEvent?.description || 'Package moving towards destination hub',
        location: latestEvent?.location || undefined,
      },
      {
        key: 'OUT_FOR_DELIVERY',
        label: 'Out for Delivery',
        completed: currentIdx >= statusOrder.indexOf(OrderStatus.OUT_FOR_DELIVERY),
        active: order.status === OrderStatus.OUT_FOR_DELIVERY,
        timestamp: getStatusDate(OrderStatus.OUT_FOR_DELIVERY),
        description: 'Courier agent on route to your doorstep',
      },
      {
        key: 'DELIVERED',
        label: 'Delivered',
        completed: currentIdx >= statusOrder.indexOf(OrderStatus.DELIVERED),
        active: order.status === OrderStatus.DELIVERED,
        timestamp: order.deliveredAt ? new Date(order.deliveredAt).toISOString() : getStatusDate(OrderStatus.DELIVERED),
        description: 'Delivered into your kitchen',
      },
    ];
  }

  private async getShiprocketToken(email: string, pass: string): Promise<string | null> {
    const cacheKey = 'shiprocket:jwt_token';
    const cached = await this.redis.get(cacheKey);
    if (cached) return cached;

    try {
      const res = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });

      const data = await res.json();
      if (data?.token) {
        // Cache token for 8 days (token is valid for 10)
        await this.redis.set(cacheKey, data.token, 8 * 24 * 60 * 60);
        return data.token;
      }
      return null;
    } catch {
      return null;
    }
  }

  private generateDefaultTrackingUrl(courierName: string, awb: string): string {
    const courier = courierName.toLowerCase();
    if (courier.includes('delhivery')) {
      return `https://www.delhivery.com/track/package/${awb}`;
    }
    if (courier.includes('bluedart')) {
      return `https://www.bluedart.com/tracking?handler=tnt&action=custTrack&numbers=${awb}`;
    }
    if (courier.includes('dtdc')) {
      return `https://www.dtdc.in/tracking/tracking_results.asp?TType=awb_no&strCnno=${awb}`;
    }
    if (courier.includes('ecom')) {
      return `https://ecomexpress.in/tracking/?awb_field=${awb}`;
    }
    if (courier.includes('shiprocket')) {
      return `https://shiprocket.co/tracking/${awb}`;
    }
    return `https://shiprocket.co/tracking/${awb}`;
  }
}
