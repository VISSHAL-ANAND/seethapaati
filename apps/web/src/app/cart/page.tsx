'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { CartResponse } from '@seethapaati/contracts';
import { fetchApi } from '../../lib/api-client';
import { Button } from '../../components/ui/Button';

export default function CartPage() {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try { setCart(await fetchApi<CartResponse>('/cart')); }
    finally { setLoading(false); }
  }

  useEffect(() => { load().catch(() => setCart(null)); }, []);

  async function update(variantId: string, quantity: number) {
    const next = await fetchApi<CartResponse>('/cart/items/' + variantId, { method: 'PATCH', body: JSON.stringify({ quantity }) });
    setCart(next);
  }

  if (loading) return <main className="mx-auto max-w-6xl px-6 py-32 text-center text-[10px] uppercase tracking-[0.2em]">Loading bag</main>;

  const items = cart?.items ?? [];
  return (
    <main className="mx-auto max-w-6xl px-6 py-16 md:py-24">
      <div className="flex items-end justify-between gap-6 border-b border-[#E3DFD7] pb-8">
        <div><p className="text-[10px] uppercase tracking-[0.24em] text-[#B8860B]">Your selection</p><h1 className="mt-3 font-serif text-5xl">Bag</h1></div>
        <span className="text-xs text-[#181513]/50">{items.reduce((sum, item) => sum + item.quantity, 0)} items</span>
      </div>

      {items.length === 0 ? (
        <div className="py-24 text-center"><p className="font-serif text-4xl">Your bag is empty.</p><Link href="/shop" className="mt-6 inline-block text-xs underline underline-offset-4">Explore the collection</Link></div>
      ) : (
        <div className="mt-12 grid gap-14 md:grid-cols-[1fr_360px]">
          <div className="divide-y divide-[#E3DFD7]">
            {items.map((item) => (
              <div key={item.variantId} className="flex items-center justify-between gap-6 py-7">
                <div><h2 className="font-serif text-2xl">{item.productName}</h2><p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[#181513]/45">{item.packType} · {item.weightGrams}g · {item.sku}</p></div>
                <div className="flex items-center gap-5"><input aria-label={'Quantity for ' + item.productName} type="number" min={0} max={10} value={item.quantity} onChange={(e) => update(item.variantId, Number(e.target.value) || 0)} className="w-14 border-b border-[#181513]/25 bg-transparent py-2 text-center text-sm outline-none" /><span className="min-w-24 text-right text-sm">₹{(item.lineTotalCents / 100).toLocaleString('en-IN')}</span></div>
              </div>
            ))}
          </div>
          <aside className="h-fit border-t border-[#181513] pt-6">
            <div className="flex justify-between text-sm"><span>Subtotal</span><span>₹{(cart!.pricing.subtotalCents / 100).toLocaleString('en-IN')}</span></div>
            {cart!.pricing.discountCents > 0 && <div className="mt-3 flex justify-between text-sm"><span>Discount</span><span>-₹{(cart!.pricing.discountCents / 100).toLocaleString('en-IN')}</span></div>}
            <div className="mt-3 flex justify-between text-sm"><span>Tax</span><span>₹{(cart!.pricing.taxCents / 100).toLocaleString('en-IN')}</span></div>
            <div className="mt-6 flex justify-between border-t border-[#E3DFD7] pt-5 font-serif text-2xl"><span>Total</span><span>₹{(cart!.pricing.grandTotalCents / 100).toLocaleString('en-IN')}</span></div>
            <Button className="mt-7 w-full" size="lg" onClick={() => { window.location.href = '/checkout'; }}>Continue to checkout</Button>
          </aside>
        </div>
      )}
    </main>
  );
}
