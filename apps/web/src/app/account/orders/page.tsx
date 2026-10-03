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
    <main className="editorial-page mx-auto max-w-[1280px] px-6 pb-20 pt-12 md:px-10 md:pb-28 md:pt-20">
      <header className="flex flex-wrap items-end justify-between gap-6 border-b border-[#E3DFD7] pb-8">
        <div><p className="eyebrow"><span className="eyebrow-dot" /> Account</p><h1 className="mt-4 font-serif text-6xl font-normal tracking-[-0.05em] md:text-7xl">Your orders</h1></div>
        <span className="text-[10px] uppercase tracking-[0.16em] text-[#181513]/45">{orders.length} shown</span>
      </header>
      {error && <p role="alert" className="mt-8 border-l-2 border-red-700 px-4 py-2 text-sm text-red-700">{error}</p>}
      {loading ? <div className="mt-10 space-y-3" aria-label="Loading orders">{[1,2,3].map((i)=><div key={i} className="h-24 animate-pulse bg-[#ECE8E0]"/>)}</div> :
        orders.length === 0 ? <div className="py-24 text-center"><p className="font-serif text-4xl">No orders yet.</p><Link href="/shop" className="mt-6 inline-block text-[10px] uppercase tracking-[0.18em] text-[#A66B18] underline underline-offset-4">Explore the collection →</Link></div> :
        <div className="mt-10 divide-y divide-[#E3DFD7] border-y border-[#E3DFD7]">
          {orders.map((order) => <Link key={order.id} href={'/orders/' + order.id + '/confirmation'} className="group grid gap-4 py-7 transition-colors hover:bg-white/35 md:grid-cols-[1fr_auto_auto] md:items-center md:gap-10">
            <div><p className="font-serif text-2xl">{order.orderNumber}</p><p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-[#181513]/45">{order.status.replaceAll('_', ' ')}</p></div>
            <p className="text-xs text-[#181513]/50">{new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
            <p className="text-sm tabular-nums">₹{(order.pricing.grandTotalCents / 100).toLocaleString('en-IN')} <span className="ml-3 text-[#A66B18] opacity-0 transition-opacity group-hover:opacity-100">↗</span></p>
          </Link>)}
        </div>}
    </main>
  );
}