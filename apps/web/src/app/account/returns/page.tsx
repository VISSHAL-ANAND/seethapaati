'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchApi } from '../../../lib/api-client';

type ReturnItem = { id: string; orderItemId: string; quantity: number; condition?: 'SEALED_INTACT' | 'DAMAGED_OPENED' | null };
type Refund = { id: string; amountCents: number; currency: string; status: string; reason: string; gatewayRefundId?: string | null; processedAt?: string | null };
type ReturnRecord = {
  id: string; returnNumber: string; orderId: string; status: string; reason: string;
  notes?: string | null; createdAt: string; resolvedAt?: string | null; items: ReturnItem[]; refunds: Refund[];
};

const lifecycle = ['REQUESTED', 'APPROVED', 'PICKED_UP', 'RECEIVED', 'INSPECTED', 'REFUND_ELIGIBLE', 'COMPLETED'];

export default function ReturnsPage() {
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi<ReturnRecord[]>('/returns')
      .then(setReturns)
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load returns'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="editorial-page mx-auto max-w-6xl px-6 py-14 md:px-10 md:py-20">
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-[#E3DFD7] pb-8">
        <div><p className="text-[10px] uppercase tracking-[0.24em] text-[#B8860B]">Account</p><h1 className="mt-3 font-serif text-5xl">Returns & refunds</h1></div>
        <Link href="/account/orders" className="text-xs underline underline-offset-4">Orders</Link>
      </div>

      {error && <p className="mt-10 text-sm text-red-700">{error}</p>}
      {loading ? <p className="py-24 text-center text-[10px] uppercase tracking-[0.2em] text-[#181513]/45">Loading returns</p> :
        returns.length === 0 ? <div className="py-24 text-center"><p className="font-serif text-4xl">No returns yet.</p><Link href="/shop" className="mt-6 inline-block text-xs underline underline-offset-4">Continue shopping</Link></div> :
        <div className="mt-10 space-y-14">
          {returns.map((ret) => {
            const current = lifecycle.indexOf(ret.status);
            return (
              <article key={ret.id} className="border-t border-[#181513] pt-6">
                <div className="grid gap-8 md:grid-cols-[1fr_280px]">
                  <div>
                    <div className="flex flex-wrap items-baseline justify-between gap-4">
                      <div><p className="font-serif text-3xl">{ret.returnNumber}</p><p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-[#181513]/45">{ret.reason.replaceAll('_', ' ')} · {ret.status.replaceAll('_', ' ')}</p></div>
                      <Link href={'/orders/' + ret.orderId + '/confirmation'} className="text-xs underline underline-offset-4">View order</Link>
                    </div>
                    <div className="mt-8 grid grid-cols-2 gap-y-5 border-y border-[#E3DFD7] py-6 text-xs sm:grid-cols-4">
                      {lifecycle.map((stage, index) => {
                        const active = index <= current;
                        return <div key={stage} className={active ? 'text-[#181513]' : 'text-[#181513]/25'}><span className="block h-px w-8 bg-current" /><p className="mt-2 uppercase tracking-[0.1em]">{stage.replaceAll('_', ' ')}</p></div>;
                      })}
                    </div>
                    <div className="mt-6 space-y-3 text-sm">
                      {ret.items.map((item) => <div key={item.id} className="flex justify-between border-b border-[#E3DFD7] py-3"><span>Returned item · ×{item.quantity}</span><span className="text-xs text-[#181513]/50">{item.condition ? item.condition.replaceAll('_', ' ') : 'Condition pending'}</span></div>)}
                    </div>
                  </div>
                  <aside className="space-y-8">
                    <section><p className="text-[10px] uppercase tracking-[0.2em] text-[#181513]/45">Requested</p><p className="mt-3 text-sm">{new Date(ret.createdAt).toLocaleDateString('en-IN')}</p></section>
                    {ret.resolvedAt && <section><p className="text-[10px] uppercase tracking-[0.2em] text-[#181513]/45">Resolved</p><p className="mt-3 text-sm">{new Date(ret.resolvedAt).toLocaleDateString('en-IN')}</p></section>}
                    <section><p className="text-[10px] uppercase tracking-[0.2em] text-[#181513]/45">Refunds</p>{ret.refunds.length === 0 ? <p className="mt-3 text-sm text-[#181513]/50">No refund recorded yet.</p> : <div className="mt-3 space-y-3">{ret.refunds.map((refund) => <div key={refund.id}><p className="font-serif text-xl">₹{(refund.amountCents / 100).toLocaleString('en-IN')}</p><p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#181513]/45">{refund.status} · {refund.reason.replaceAll('_', ' ')}</p>{refund.gatewayRefundId && <p className="mt-1 text-xs text-[#181513]/50">Reference {refund.gatewayRefundId}</p>}{refund.processedAt && <p className="mt-1 text-xs text-[#181513]/50">{new Date(refund.processedAt).toLocaleDateString('en-IN')}</p>}</div>)}</div>}</section>
                  </aside>
                </div>
              </article>
            );
          })}
        </div>}
    </main>
  );
}
