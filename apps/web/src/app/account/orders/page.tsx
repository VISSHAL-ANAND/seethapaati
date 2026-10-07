'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Package, ArrowLeft } from 'lucide-react';
import { fetchApi } from '../../../lib/api-client';

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  grandTotalCents: number;
  currency: string;
};
type OrdersResponse = { items: Order[]; total: number; page: number; limit: number; totalPages: number };

const statusLabels: Record<string, { label: string; tone: string }> = {
  PENDING_PAYMENT: { label: 'Payment Pending', tone: 'border-amber-300 bg-amber-50 text-amber-800' },
  PAID: { label: 'Order Confirmed', tone: 'border-[#B8860B]/40 bg-[#B8860B]/10 text-[#B8860B]' },
  PROCESSING: { label: 'In Preparation', tone: 'border-blue-300 bg-blue-50 text-blue-800' },
  PACKED: { label: 'Packed & Ready', tone: 'border-indigo-300 bg-indigo-50 text-indigo-800' },
  SHIPPED: { label: 'Dispatched', tone: 'border-purple-300 bg-purple-50 text-purple-800' },
  DELIVERED: { label: 'Delivered', tone: 'border-green-300 bg-green-50 text-green-800' },
  CANCELLED: { label: 'Cancelled', tone: 'border-stone-300 bg-stone-100 text-stone-700' },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi<OrdersResponse>('/orders?page=1&limit=30')
      .then((x) => setOrders(x.items))
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load orders'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="editorial-page mx-auto max-w-[1280px] px-6 pb-24 pt-10 md:px-10 md:pb-32 md:pt-14">
      <header className="flex flex-wrap items-end justify-between gap-6 border-b border-[#E3DFD7] pb-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#B8860B]">
            Account Management
          </p>
          <h1 className="mt-3 font-serif text-5xl font-normal tracking-[-0.04em] text-[#181513] md:text-6xl">
            Your Orders
          </h1>
        </div>
        <span className="text-xs uppercase tracking-[0.16em] text-[#181513]/55">
          {orders.length} {orders.length === 1 ? 'order' : 'orders'} placed
        </span>
      </header>

      {error && (
        <p role="alert" className="mt-6 border-l-2 border-red-700 bg-red-50 p-3 text-xs text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <div className="mt-8 space-y-4" aria-label="Loading orders">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse bg-[#ECE8E0]" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="py-24 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#ECE8E0] text-[#181513]/40">
            <Package className="h-8 w-8" />
          </div>
          <p className="mt-6 font-serif text-3xl text-[#181513]">No orders placed yet</p>
          <p className="mt-2 text-xs text-[#181513]/60">
            Once you place an order, its fulfillment timeline and invoice will appear here.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-flex items-center gap-2 bg-[#181513] px-6 py-3 text-xs uppercase tracking-[0.18em] text-[#F7F5F0] transition hover:bg-[#2E2824]"
          >
            Explore the Collection
          </Link>
        </div>
      ) : (
        <div className="mt-8 divide-y divide-[#E3DFD7] border-y border-[#E3DFD7]">
          {orders.map((order) => {
            const statusConfig = statusLabels[order.status] ?? {
              label: order.status.replaceAll('_', ' '),
              tone: 'border-[#181513]/20 bg-white/40 text-[#181513]',
            };

            return (
              <div
                key={order.id}
                className="group flex flex-col justify-between gap-4 py-6 sm:flex-row sm:items-center transition-colors hover:bg-white/30 px-2"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-serif text-2xl text-[#181513]">{order.orderNumber}</span>
                    <span
                      className={`border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${statusConfig.tone}`}
                    >
                      {statusConfig.label}
                    </span>
                  </div>
                  <p className="text-xs text-[#181513]/55">
                    Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6">
                  <span className="text-base font-medium tabular-nums text-[#181513]">
                    ₹{(order.grandTotalCents / 100).toLocaleString('en-IN')}
                  </span>

                  <Link
                    href={'/orders/' + order.id + '/confirmation'}
                    className="flex items-center gap-1 border border-[#181513]/30 px-4 py-2 text-xs uppercase tracking-[0.16em] text-[#181513] transition hover:border-[#181513] hover:bg-[#181513] hover:text-[#F7F5F0]"
                  >
                    View Details
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}