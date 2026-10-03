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
type TrackingEvent = { id: string; status: string; location?: string | null; description?: string | null; occurredAt: string };
type Shipment = { id: string; status: string; carrier: string; trackingNumber?: string | null; trackingUrl?: string | null; trackingEvents: TrackingEvent[] };

export default function OrderConfirmationPage() {
  const params = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.orderId) return;
    Promise.all([
      fetchApi<Order>('/orders/' + params.orderId),
      fetchApi<Invoice>('/invoices/order/' + params.orderId).catch(() => null),
      fetchApi<Shipment>('/orders/' + params.orderId + '/track').catch(() => null),
    ]).then(([nextOrder, nextInvoice, nextShipment]) => {
      setOrder(nextOrder);
      setInvoice(nextInvoice);
      setShipment(nextShipment);
    }).catch((err) => {
      if (err instanceof ApiClientError && err.code === 'UNAUTHORIZED') setError('Please sign in to view this order.');
      else setError(err instanceof Error ? err.message : 'Unable to load order');
    }).finally(() => setLoading(false));
  }, [params.orderId]);

  if (loading) return <main className="mx-auto max-w-5xl px-6 py-32 text-center text-[10px] uppercase tracking-[0.2em]">Loading order</main>;
  if (error || !order) return <main className="mx-auto max-w-5xl px-6 py-32 text-center"><h1 className="font-serif text-4xl">Order unavailable</h1><p className="mt-4 text-sm text-red-700">{error || 'This order could not be found.'}</p><Link href="/account/orders" className="mt-7 inline-block text-xs underline underline-offset-4">Back to orders</Link></main>;

  return (
    <main className="editorial-page mx-auto max-w-[1280px] px-6 pb-20 pt-12 md:px-10 md:pb-28 md:pt-20">
      <Link href="/account/orders" className="text-[10px] uppercase tracking-[0.2em] text-[#A66B18] underline underline-offset-4">← Orders</Link>
      <div className="mt-8 grid gap-10 md:mt-12 md:grid-cols-[1fr_320px] md:gap-14">
        <section>
          <p className="eyebrow"><span className="eyebrow-dot" /> Order details</p>
          <h1 className="mt-4 font-serif text-6xl font-normal tracking-[-0.05em] md:text-7xl">{order.orderNumber}</h1>
          <div className="mt-5 flex flex-wrap gap-4 text-[10px] uppercase tracking-[0.14em] text-[#181513]/55"><span>{order.status.replaceAll('_', ' ')}</span><span>{new Date(order.createdAt).toLocaleDateString('en-IN')}</span></div>
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
          {shipment && <Tracking shipment={shipment} />}
          {invoice && <section className="border-t border-[#181513] pt-6"><p className="text-[10px] uppercase tracking-[0.2em] text-[#181513]/50">Invoice</p><p className="mt-4 font-serif text-xl">{invoice.invoiceNumber}</p><p className="mt-1 text-xs text-[#181513]/50">{invoice.status} · {new Date(invoice.issuedAt).toLocaleDateString('en-IN')}</p><p className="mt-4 text-xs text-[#181513]/50">Invoice total · ₹{(invoice.grandTotalCents / 100).toLocaleString('en-IN')}</p></section>}
          <ReturnRequest order={order} />
        </aside>
      </div>
    </main>
  );
}

function Tracking({ shipment }: { shipment: Shipment }) {
  return (
    <section className="border-t border-[#181513] pt-6">
      <p className="text-[10px] uppercase tracking-[0.2em] text-[#181513]/50">Shipment tracking</p>
      <div className="mt-5">
        <p className="text-sm">{shipment.carrier}{shipment.trackingNumber ? ' · ' + shipment.trackingNumber : ''}</p>
        <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-[#181513]/45">{shipment.status.replaceAll('_', ' ')}</p>
        <div className="mt-6 space-y-5 border-l border-[#E3DFD7] pl-5">
          {shipment.trackingEvents.map((event) => (
            <div key={event.id} className="relative">
              <span className="absolute -left-[22px] top-1 h-1.5 w-1.5 rounded-full bg-[#181513]" />
              <p className="text-xs uppercase tracking-[0.12em]">{event.status.replaceAll('_', ' ')}</p>
              <p className="mt-1 text-xs text-[#181513]/50">{new Date(event.occurredAt).toLocaleString('en-IN')}{event.location ? ' · ' + event.location : ''}</p>
              {event.description && <p className="mt-1 text-xs text-[#181513]/60">{event.description}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
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

  const canRequest = order.status === 'DELIVERED';

  return (
    <section className="border-t border-[#181513] pt-6">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-[10px] uppercase tracking-[0.2em] text-[#181513]/50">Returns</p><p className="mt-2 text-xs text-[#181513]/50">Returns can be requested after delivery.</p></div>
        {canRequest && <button type="button" onClick={() => setOpen(!open)} className="text-xs underline underline-offset-4">{open ? 'Close' : 'Request'}</button>}
      </div>
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
