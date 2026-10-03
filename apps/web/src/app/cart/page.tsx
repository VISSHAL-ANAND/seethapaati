'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { CartResponse } from '@seethapaati/contracts';
import { fetchApi } from '../../lib/api-client';
import { Button } from '../../components/ui/Button';

export default function CartPage() {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState<string[]>([]);

  async function load() {
    setLoading(true);
    setError('');
    try { setCart(await fetchApi<CartResponse>('/cart')); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to load your bag.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load().catch(() => setCart(null)); }, []);

  async function update(variantId: string, quantity: number) {
    if (updating.includes(variantId)) return;
    setUpdating((current) => [...current, variantId]);
    setError('');
    try {
      const next = await fetchApi<CartResponse>('/cart/items/' + variantId, { method: 'PATCH', body: JSON.stringify({ quantity }) });
      setCart(next);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to update this item. Please try again.');
    } finally {
      setUpdating((current) => current.filter((id) => id !== variantId));
    }
  }

  if (loading) return <main className="editorial-page mx-auto max-w-6xl px-6 py-24 md:py-32" aria-label="Loading bag"><div className="animate-pulse space-y-8"><div className="h-12 w-48 bg-[#ECE8E0]"/><div className="h-px bg-[#E3DFD7]"/><div className="h-28 bg-[#ECE8E0]"/><div className="h-28 bg-[#ECE8E0]"/></div></main>;

  const items = cart?.items ?? [];
  return (
    <main className="editorial-page mx-auto max-w-[1280px] px-6 pb-20 pt-12 md:px-10 md:pb-28 md:pt-20">
      <div className="flex items-end justify-between gap-6 border-b border-[#E3DFD7] pb-8">
        <div><p className="eyebrow"><span className="eyebrow-dot"/> Your selection</p><h1 className="mt-4 font-serif text-6xl font-normal tracking-[-0.05em] md:text-8xl">The bag.</h1></div>
        <span className="text-xs text-[#181513]/50">{items.reduce((sum, item) => sum + item.quantity, 0)} items</span>
      </div>

      {error && <div role="alert" className="mt-6 border-l-2 border-red-700 bg-[#ECE8E0]/50 px-4 py-3 text-sm text-red-800">{error} <button type="button" onClick={() => load()} className="ml-2 underline underline-offset-4">Retry</button></div>}

      {items.length === 0 ? (
        <div className="py-24 text-center md:py-32"><p className="eyebrow justify-center"><span className="eyebrow-dot"/> A fresh start</p><p className="mt-5 font-serif text-4xl tracking-tight md:text-5xl">Your bag is waiting.</p><p className="mt-3 text-sm text-[#181513]/55">Discover something for your everyday rituals.</p><Link href="/shop" className="mt-8 inline-flex text-[10px] uppercase tracking-[0.18em] text-[#A66B18] underline underline-offset-4">Explore the collection →</Link></div>
      ) : (
        <div className="mt-8 grid gap-12 md:mt-12 md:grid-cols-[1fr_340px] lg:gap-20">
          <div className="divide-y divide-[#E3DFD7]">
            {items.map((item) => (
              <div key={item.variantId} className="flex flex-col justify-between gap-4 border-b border-[#E3DFD7] py-6 sm:flex-row sm:items-center sm:gap-6">
                <div><h2 className="font-serif text-2xl">{item.productName}</h2><p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[#181513]/45">{item.packType} · {item.weightGrams}g · {item.sku}</p></div>
                <div className="flex items-center justify-between gap-5 sm:justify-end"><label className="sr-only" htmlFor={'quantity-' + item.variantId}>Quantity for {item.productName}</label><input id={'quantity-' + item.variantId} type="number" min={0} max={10} value={item.quantity} disabled={updating.includes(item.variantId)} onChange={(e) => update(item.variantId, Number(e.target.value) || 0)} className="w-14 border-b border-[#181513]/25 bg-transparent py-2 text-center text-sm outline-none disabled:opacity-50" /><span className="min-w-24 text-right text-sm tabular-nums">₹{(item.lineTotalCents / 100).toLocaleString('en-IN')}</span></div>
              </div>
            ))}
          </div>
          <aside className="h-fit border-t border-[#181513] pt-6 md:sticky md:top-10">
            <div className="flex justify-between text-sm"><span>Subtotal</span><span>₹{(cart!.pricing.subtotalCents / 100).toLocaleString('en-IN')}</span></div>
            {cart!.pricing.discountCents > 0 && <div className="mt-3 flex justify-between text-sm"><span>Discount</span><span>-₹{(cart!.pricing.discountCents / 100).toLocaleString('en-IN')}</span></div>}
            <div className="mt-3 flex justify-between text-sm"><span>Tax</span><span>₹{(cart!.pricing.taxCents / 100).toLocaleString('en-IN')}</span></div>
            <div className="mt-6 flex justify-between border-t border-[#E3DFD7] pt-5 font-serif text-2xl"><span>Total</span><span>₹{(cart!.pricing.grandTotalCents / 100).toLocaleString('en-IN')}</span></div>
            <Button className="mt-7 w-full" size="lg" onClick={() => { window.location.href = '/checkout'; }}>Continue to checkout</Button>
            <p className="mt-4 text-center text-[9px] uppercase tracking-[0.14em] text-[#181513]/40">Shipping and final totals confirmed at checkout</p>
          </aside>
        </div>
      )}
    </main>
  );
}
