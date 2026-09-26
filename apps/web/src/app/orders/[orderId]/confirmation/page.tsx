'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { fetchApi, ApiClientError } from '../../../../lib/api-client';

type OrderItem = { id: string; productName: string; quantity: number; unitPriceCents: number; lineTotalCents: number };
type Order = {
  id: string; orderNumber: string; status: string; createdAt: string; items: OrderItem[];
  pricing: { subtotalCents: number; discountCents: number; taxCents: number; shippingCents: number; grandTotalCents: number; currency: string };
  shippingAddress: Record<string, unknown>;
};
type Invoice = { invoiceNumber: string; status: string; issuedAt: string; grandTotalCents: number; currency: string };

export default function OrderConfirmationPage() {
  const params = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.orderId) return;
    Promise.all([
      fetchApi<Order>('/orders/' + params.orderId),
      fetchApi<Invoice>('/invoices/order/' + params.orderId).catch(() => null),
    ]).then(([nextOrder, nextInvoice]) => {
      setOrder(nextOrder);
      setInvoice(nextInvoice);
    }).catch((err) => {
      if (err instanceof ApiClientError && err.code === 'UNAUTHORIZED') setError('Please sign in to view this order.');
      else setError(err instanceof Error ? err.message : 'Unable to load order');
    }).finally(() => setLoading(false));
  }, [params.orderId]);

  if (loading) return <main className="mx-auto max-w-5xl px-6 py-32 text-center text-[10px] uppercase tracking-[0.2em]">Loading order</main>;
  if (error || !order) return <main className="mx-auto max-w-5xl px-6 py-32 text-center"><h1 className="font-serif text-4xl">Order unavailable</h1><p className="mt-4 text-sm text-red-700">{error || 'This order could not be found.'}</p><Link href="/account/orders" className="mt-7 inline-block text-xs underline underline-offset-4">Back to orders</Link></main>;

  return (
    <main className="mx-auto max-w-6xl px-6 py-14 md:px-10 md:py-20">
      <Link href="/account/orders" className="text-[10px] uppercase tracking-[0.2em] text-[#181513]/50">← Orders</Link>
      <div className="mt-8 grid gap-14 md:grid-cols-[1fr_320px]">
        <section>
          <p className="text-[10px] uppercase tracking-[0.24em] text-[#B8860B]">Order confirmed</p>
          <h1 className="mt-3 font-serif text-5xl">{order.orderNumber}</h1>
          <div className="mt-5 flex flex-wrap gap-4 text-xs uppercase tracking-[0.14em] text-[#181513]/55"><span>{order.status.replaceAll('_', ' ')}</span><span>{new Date(order.createdAt).toLocaleDateString('en-IN')}</span></div>
          <div className="mt-12 divide-y divide-[#E3DFD7] border-y border-[#E3DFD7]">
            {order.items.map((item) => <div key={item.id} className="flex justify-between gap-8 py-6"><div><p className="font-serif text-xl">{item.productName}</p><p className="mt-1 text-xs text-[#181513]/50">Qty {item.quantity}</p></div><span className="text-sm">₹{(item.lineTotalCents / 100).toLocaleString('en-IN')}</span></div>)}
          </div>
          <div className="mt-8 max-w-md space-y-3 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>₹{(order.pricing.subtotalCents / 100).toLocaleString('en-IN')}</span></div>
            {order.pricing.discountCents > 0 && <div className="flex justify-between"><span>Discount</span><span>-₹{(order.pricing.discountCents / 100).toLocaleString('en-IN')}</span></div>}
            <div className="flex justify-between"><span>Tax</span><span>₹{(order.pricing.taxCents / 100).toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span>₹{(order.pricing.shippingCents / 100).toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between border-t border-[#E3DFD7] pt-4 font-serif text-2xl"><span>Total</span><span>₹{(order.pricing.grandTotalCents / 100).toLocaleString('en-IN')}</span></div>
          </div>
        </section>
        <aside className="space-y-10">
          <section className="border-t border-[#181513] pt-6"><p className="text-[10px] uppercase tracking-[0.2em] text-[#181513]/50">Delivery</p><p className="mt-5 text-sm leading-6">{String(order.shippingAddress.addressLine1 || '')}<br />{String(order.shippingAddress.city || '')}, {String(order.shippingAddress.state || '')}<br />{String(order.shippingAddress.postalCode || '')}</p></section>
          {invoice && <section className="border-t border-[#181513] pt-6"><p className="text-[10px] uppercase tracking-[0.2em] text-[#181513]/50">Invoice</p><p className="mt-4 font-serif text-xl">{invoice.invoiceNumber}</p><p className="mt-1 text-xs text-[#181513]/50">{invoice.status} · {new Date(invoice.issuedAt).toLocaleDateString('en-IN')}</p></section>}
          {order.status === 'DELIVERED' && <ReturnRequest order={order} />}
        </aside>
      </div>
    </main>
  );
}

function ReturnRequest({ order }: { order: Order }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('DAMAGED');
  const [notes, setNotes] = useState('');
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function submit() {
    const items = order.items.filter((item) => (selected[item.id] || 0) > 0).map((item) => ({ orderItemId: item.id, quantity: selected[item.id] }));
    if (!items.length) { setMessage('Select at least one item.'); return; }
    setSaving(true);
    try {
      await fetchApi('/orders/' + order.id + '/returns', { method: 'POST', body: JSON.stringify({ reason, notes: notes.trim() || undefined, items }) });
      setMessage('Return request submitted.');
      setOpen(false);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to submit return request');
    } finally { setSaving(false); }
  }

  return (
    <section className="border-t border-[#181513] pt-6">
      <p className="text-[10px] uppercase tracking-[0.2em] text-[#181513]/50">Returns</p>
      <button type="button" onClick={() => setOpen(!open)} className="mt-4 text-xs underline underline-offset-4">{open ? 'Close return form' : 'Request a return'}</button>
      {message && <p className="mt-4 text-sm">{message}</p>}
      {open && <div className="mt-6 space-y-5">
        <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full border-b border-[#181513]/25 bg-transparent py-2 text-sm outline-none">
          <option value="DAMAGED">Damaged</option><option value="WRONG_ITEM">Wrong item</option><option value="QUALITY_ISSUE">Quality issue</option><option value="OTHER">Other</option>
        </select>
        {order.items.map((item) => <label key={item.id} className="flex items-center justify-between gap-4 text-sm"><span>{item.productName}</span><input type="number" min={0} max={item.quantity} value={selected[item.id] || 0} onChange={(e) => setSelected((s) => ({ ...s, [item.id]: Math.min(item.quantity, Math.max(0, Number(e.target.value) || 0)) }))} className="w-14 border-b border-[#181513]/25 bg-transparent py-1 text-center outline-none" /></label>)}
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} placeholder="Optional notes" className="min-h-24 w-full border border-[#E3DFD7] bg-transparent p-3 text-sm outline-none" />
        <button type="button" disabled={saving} onClick={submit} className="w-full bg-[#181513] px-5 py-3 text-[10px] uppercase tracking-[0.18em] text-[#F7F5F0] disabled:opacity-50">{saving ? 'Submitting…' : 'Submit return request'}</button>
      </div>}
    </section>
  );
}
