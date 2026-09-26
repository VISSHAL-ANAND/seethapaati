'use client';

import { useEffect, useState } from 'react';
import { fetchApi } from '../../lib/api-client';

type Order = {
  id: string; orderNumber: string; status: string; createdAt: string;
  pricing: { grandTotalCents: number; currency: string };
  items: Array<{ id: string; productName: string; quantity: number }>;
};
type OrdersResponse = { items: Order[]; total: number; page: number; limit: number; totalPages: number };
type Shipment = { id: string; status: string; carrier: string; trackingNumber?: string | null; trackingUrl?: string | null };
type ReturnItem = { id: string; orderItemId: string; quantity: number; condition?: 'SEALED_INTACT' | 'DAMAGED_OPENED' | null };
type Return = { id: string; returnNumber: string; orderId: string; status: string; reason: string; createdAt: string; items: ReturnItem[] };

const orderTransitions: Record<string, string[]> = {
  PAID: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['PACKED', 'CANCELLED'],
  PACKED: ['SHIPPED', 'CANCELLED'],
};
const shipmentTransitions: Record<string, string[]> = {
  CREATED: ['AWB_ASSIGNED', 'CANCELLED'],
  AWB_ASSIGNED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
};

export default function AdminOperationsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [returns, setReturns] = useState<Return[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [carrier, setCarrier] = useState('');
  const [tracking, setTracking] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [inspection, setInspection] = useState<Record<string, 'SEALED_INTACT' | 'DAMAGED_OPENED'>>({});

  async function load() {
    setError('');
    try {
      const [o, r] = await Promise.all([
        fetchApi<OrdersResponse>('/orders/admin?page=1&limit=50'),
        fetchApi<Return[]>('/admin/returns'),
      ]);
      setOrders(o.items);
      setReturns(r);
      if (selected) {
        const fresh = o.items.find((x) => x.id === selected.id) || null;
        setSelected(fresh);
        if (fresh) {
          try { setShipment(await fetchApi<Shipment>('/orders/' + fresh.id + '/track')); }
          catch { setShipment(null); }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load operations');
    }
  }

  useEffect(() => { load(); }, []);

  async function updateOrderStatus(status: string) {
    if (!selected) return;
    setBusy(true); setMessage(''); setError('');
    try {
      await fetchApi('/orders/' + selected.id + '/status', {
        method: 'PATCH',
        body: JSON.stringify({ status, ...(status === 'INSPECTED' ? { inspection: ret.items.map((item) => ({ returnItemId: item.id, condition: inspection[item.id] })) } : {}) }),
      });
      setMessage('Order status updated.');
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to update order'); }
    finally { setBusy(false); }
  }

  async function createShipment() {
    if (!selected || !carrier.trim()) return;
    setBusy(true); setMessage(''); setError('');
    try {
      const created = await fetchApi<Shipment>('/admin/orders/' + selected.id + '/shipments', {
        method: 'POST',
        body: JSON.stringify({ carrier: carrier.trim(), trackingNumber: tracking.trim() || undefined }),
      });
      setShipment(created);
      setMessage('Shipment created.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to create shipment'); }
    finally { setBusy(false); }
  }

  async function updateShipment(status: string) {
    if (!shipment) return;
    setBusy(true); setMessage(''); setError('');
    try {
      const updated = await fetchApi<Shipment>('/admin/shipments/' + shipment.id + '/events', {
        method: 'POST',
        body: JSON.stringify({ status }),
      });
      setShipment(updated);
      setMessage('Shipment status updated.');
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to update shipment'); }
    finally { setBusy(false); }
  }

  async function updateReturn(ret: Return, status: string) {
    setBusy(true); setMessage(''); setError('');
    try {
      await fetchApi('/admin/returns/' + ret.id + '/status', {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setMessage(ret.returnNumber + ' updated.');
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to update return'); }
    finally { setBusy(false); }
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-12 md:px-10 md:py-16">
      <p className="text-[10px] uppercase tracking-[0.24em] text-[#B8860B]">Operations</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-6 border-b border-[#E3DFD7] pb-8">
        <div><h1 className="font-serif text-5xl">Fulfillment desk</h1><p className="mt-3 text-sm text-[#181513]/55">Orders, shipments and returns.</p></div>
        <button type="button" onClick={load} className="text-xs underline underline-offset-4">Refresh</button>
      </div>
      {error && <p className="mt-6 text-sm text-red-700">{error}</p>}
      {message && <p className="mt-6 text-sm">{message}</p>}

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <section>
          <div className="border-y border-[#E3DFD7] divide-y divide-[#E3DFD7]">
            {orders.map((order) => (
              <button type="button" key={order.id} onClick={() => { setSelected(order); fetchApi<Shipment>('/orders/' + order.id + '/track').then(setShipment).catch(() => setShipment(null)); }} className="grid w-full gap-2 py-5 text-left md:grid-cols-[1fr_auto_auto] md:items-center md:gap-6 hover:opacity-65">
                <span><span className="font-serif text-xl">{order.orderNumber}</span><span className="ml-3 text-[10px] uppercase tracking-[0.14em] text-[#181513]/45">{order.status.replaceAll('_', ' ')}</span></span>
                <span className="text-xs text-[#181513]/50">{new Date(order.createdAt).toLocaleDateString('en-IN')}</span>
                <span className="text-sm">₹{(order.pricing.grandTotalCents / 100).toLocaleString('en-IN')}</span>
              </button>
            ))}
          </div>
        </section>

        <aside className="space-y-10">
          {!selected ? <div className="border-t border-[#181513] pt-6 text-sm text-[#181513]/55">Select an order to manage fulfillment.</div> : (
            <>
              <section className="border-t border-[#181513] pt-6">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#181513]/50">Order · {selected.orderNumber}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {(orderTransitions[selected.status] || []).map((status) => <button disabled={busy} key={status} onClick={() => updateOrderStatus(status)} className="border border-[#181513] px-3 py-2 text-[10px] uppercase tracking-[0.15em] disabled:opacity-40">{status.replaceAll('_', ' ')}</button>)}
                </div>
                <div className="mt-6 space-y-2 text-sm">{selected.items.map((item) => <div key={item.id} className="flex justify-between border-b border-[#E3DFD7] py-2"><span>{item.productName}</span><span>× {item.quantity}</span></div>)}</div>
              </section>

              <section className="border-t border-[#181513] pt-6">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#181513]/50">Shipment</p>
                {!shipment ? <div className="mt-5 space-y-4">
                  <input value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="Carrier" className="w-full border-b border-[#181513]/25 bg-transparent py-2 text-sm outline-none" />
                  <input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Tracking number (required before shipping)" className="w-full border-b border-[#181513]/25 bg-transparent py-2 text-sm outline-none" />
                  <button disabled={busy || !carrier.trim()} onClick={createShipment} className="bg-[#181513] px-4 py-3 text-[10px] uppercase tracking-[0.16em] text-[#F7F5F0] disabled:opacity-40">Create shipment</button>
                </div> : <div className="mt-5">
                  <p className="text-sm">{shipment.carrier} · {shipment.trackingNumber || 'Tracking pending'}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-[#181513]/45">{shipment.status.replaceAll('_', ' ')}</p>
                  <div className="mt-5 flex flex-wrap gap-2">{(shipmentTransitions[shipment.status] || []).map((status) => <button disabled={busy} key={status} onClick={() => updateShipment(status)} className="border border-[#181513] px-3 py-2 text-[10px] uppercase tracking-[0.15em] disabled:opacity-40">{status.replaceAll('_', ' ')}</button>)}</div>
                </div>}
              </section>
            </>
          )}
        </aside>
      </div>

      <section className="mt-16 border-t border-[#181513] pt-6">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#181513]/50">Returns queue</p>
        <div className="mt-6 divide-y divide-[#E3DFD7] border-y border-[#E3DFD7]">
          {returns.length === 0 ? <p className="py-10 text-sm text-[#181513]/55">No return requests.</p> : returns.map((ret) => {
            const next = ret.status === 'REQUESTED' ? ['APPROVED', 'REJECTED'] : ret.status === 'APPROVED' ? ['PICKED_UP', 'CANCELLED'] : ret.status === 'PICKED_UP' ? ['RECEIVED'] : ret.status === 'RECEIVED' ? ['INSPECTED'] : ret.status === 'INSPECTED' ? ['REFUND_ELIGIBLE', 'REJECTED'] : ret.status === 'REFUND_ELIGIBLE' ? ['COMPLETED'] : [];
            return <div key={ret.id} className="grid gap-3 py-5 md:grid-cols-[1fr_auto_auto] md:items-center md:gap-8">
              <div>
                <p className="font-serif text-xl">{ret.returnNumber}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-[#181513]/45">{ret.reason} · {ret.status}</p>
                {ret.status === 'RECEIVED' && (
                  <div className="mt-4 space-y-2">
                    {ret.items.map((item, index) => (
                      <label key={item.id} className="flex items-center gap-3 text-xs">
                        <span className="text-[#181513]/55">Item {index + 1} · ×{item.quantity}</span>
                        <select value={inspection[item.id] || ''} onChange={(e) => setInspection((current) => ({ ...current, [item.id]: e.target.value as 'SEALED_INTACT' | 'DAMAGED_OPENED' }))} className="border-b border-[#181513]/25 bg-transparent py-1 text-xs outline-none">
                          <option value="">Inspect condition</option>
                          <option value="SEALED_INTACT">Sealed / intact</option>
                          <option value="DAMAGED_OPENED">Damaged / opened</option>
                        </select>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <span className="text-xs text-[#181513]/50">{new Date(ret.createdAt).toLocaleDateString('en-IN')}</span>
              <div className="flex flex-wrap gap-2">
                {next.map((status) => {
                  const inspectionIncomplete = status === 'INSPECTED' && ret.items.some((item) => !inspection[item.id]);
                  return <button disabled={busy || inspectionIncomplete} key={status} onClick={() => updateReturn(ret, status)} className="border border-[#181513] px-3 py-2 text-[10px] uppercase tracking-[0.15em] disabled:opacity-40">{status.replaceAll('_', ' ')}</button>;
                })}
              </div>
            </div>;
          })}
        </div>
      </section>
    </main>
  );
}
