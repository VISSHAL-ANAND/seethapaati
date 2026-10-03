'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { fetchApi, ApiClientError } from '../../../../lib/api-client';

type OrderItem = { id: string; productNameSnapshot: string; quantity: number; unitPriceCents: number; lineTotalCents: number };
type Payment = { id: string; gateway: string; gatewayOrderId: string; gatewayPaymentId?: string | null; amountCents: number; currency: string; status: string; createdAt: string };
type StatusHistory = { id: string; oldStatus?: string | null; newStatus: string; reason?: string | null; changedBy?: string | null; createdAt: string };
type Order = {
  id: string; orderNumber: string; status: string; createdAt: string; items: OrderItem[];
  currency: string; subtotalCents: number; discountCents: number; taxCents: number; shippingCents: number; grandTotalCents: number;
  shippingAddressSnapshot: Record<string, unknown>; billingAddressSnapshot?: Record<string, unknown> | null;
  payments: Payment[]; statusHistory: StatusHistory[];
};
