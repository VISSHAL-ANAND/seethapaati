'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchApi } from '../../../lib/api-client';

type Order = { id: string; orderNumber: string; status: string; createdAt: string; pricing: { grandTotalCents: number; currency: string } };
type OrdersResponse = { items: Order[]; total: number; page: number; limit: number; totalPages: number };

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi<OrdersResponse>('/orders?page=1&limit=20')
      .then((x) => setOrders(x.items))
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load orders'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-6 py-14 md:px-10 md:py-20">
      <div className="flex items-end justify-between gap-6 border-b border-[#E3DFD7] pb-8">
        <div><p className="text-[10px] uppercase tracking-[0.24em] text-[#B8860B]">Account</p><h1 className="mt-3 font-serif text-5xl">Your orders</h1></div>
        <span className="text-xs text-[#181513]/50">{orders.length} shown</span>
      </div>
      {error && <p className="mt-10 text-sm text-red-700">{error}</p>}
      {loading ? <p className="py-24 text-center text-[10px] uppercase tracking-[0.2em] text-[#181513]/45">Loading orders</p> :
        orders.length === 0 ? <div className="py-24 text-center"><p className="font-serif text-4xl">No orders yet.</p><Link href="/shop" className="mt-6 inline-block text-xs underline underline-offset-4">Explore the collection</Link></div> :
        <div className="mt-10 divide-y divide-[#E3DFD7] border-y border-[#E3DFD7]">
          {orders.map((order) => <Link key={order.id} href={'/orders/' + order.id + '/confirmation'} className="grid gap-3 py-7 transition-opacity hover:opacity-65 md:grid-cols-[1fr_auto_auto] md:items-center md:gap-10">
            <div><p className="font-serif text-2xl">{order.orderNumber}</p><p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-[#181513]/45">{order.status.replaceAll('_', ' ')}</p></div>
            <p className="text-xs text-[#181513]/50">{new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
            <p className="text-sm">₹{(order.pricing.grandTotalCents / 100).toLocaleString('en-IN')}</p>
          </Link>)}
        </div>}
    </main>
  );
}
