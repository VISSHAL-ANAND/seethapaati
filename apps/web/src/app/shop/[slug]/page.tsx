'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { ProductDto } from '@seethapaati/contracts';
import { fetchApi } from '../../../lib/api-client';
import { Button } from '../../../components/ui/Button';

export default function ProductPage() {
  const params = useParams<{ slug: string }>();
  const [product, setProduct] = useState<ProductDto | null>(null);
  const [variantId, setVariantId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [state, setState] = useState('loading');

  useEffect(() => {
    fetchApi<ProductDto>('/catalog/products/' + params.slug)
      .then((data) => {
        setProduct(data);
        const first = data.variants.find((item) => item.isAvailable) ?? data.variants[0];
        setVariantId(first?.id ?? '');
        setState('ready');
      })
      .catch(() => setState('error'));
  }, [params.slug]);

  if (state === 'loading') return <main className="editorial-page mx-auto max-w-6xl px-6 py-32 text-center text-[10px] uppercase tracking-[0.2em]">Loading</main>;
  if (state === 'error' || !product) return <main className="editorial-page mx-auto max-w-6xl px-6 py-32 text-center"><h1 className="font-serif text-4xl">Product unavailable</h1><Link href="/shop" className="mt-6 inline-block underline">Return to shop</Link></main>;

  const selected = product.variants.find((item) => item.id === variantId);
  const image = product.images[0]?.url;

  async function addToBag() {
    if (!selected?.isAvailable) return;
    setState('adding');
    try {
      await fetchApi('/cart/items', { method: 'POST', body: JSON.stringify({ variantId, quantity }) });
      setState('added');
    } catch {
      setState('ready');
    }
  }

  return (
    <main className="editorial-page mx-auto max-w-[1440px] px-6 py-10 md:px-10 md:py-20">
      <Link href="/shop" className="text-[10px] uppercase tracking-[0.2em] text-[#181513]/50 hover:text-[#181513]">← Collection</Link>
      <div className="mt-10 grid gap-12 md:grid-cols-[1.1fr_0.9fr] md:gap-20">
        <div className="aspect-[4/5] overflow-hidden bg-[#ECE8E0]">
          {image ? <img src={image} alt={product.images[0]?.altText || product.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-end p-10"><span className="font-serif text-6xl text-[#181513]/20">{product.name}</span></div>}
        </div>
        <div className="self-center">
          {product.category && <p className="text-[10px] uppercase tracking-[0.24em] text-[#B8860B]">{product.category.name}</p>}
          <h1 className="mt-4 font-serif text-5xl leading-none md:text-7xl">{product.name}</h1>
          <p className="mt-8 max-w-xl text-sm leading-7 text-[#181513]/70">{product.description}</p>
          {selected && <p className="mt-8 text-lg">₹{(selected.priceCents / 100).toLocaleString('en-IN')}</p>}

          <div className="mt-10 space-y-7 border-y border-[#E3DFD7] py-7">
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-[#181513]/50">Format</label>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.variants.map((variant) => (
                  <button key={variant.id} disabled={!variant.isAvailable} onClick={() => setVariantId(variant.id)} className={'border px-4 py-3 text-xs transition-colors ' + (variant.id === variantId ? 'border-[#181513] bg-[#181513] text-[#F7F5F0]' : 'border-[#E3DFD7]') + ' disabled:cursor-not-allowed disabled:opacity-35'}>
                    {variant.name || variant.packType}{variant.weightGrams ? ' · ' + variant.weightGrams + 'g' : ''}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label htmlFor="quantity" className="text-[10px] uppercase tracking-[0.2em] text-[#181513]/50">Quantity</label>
              <input id="quantity" type="number" min={1} max={10} value={quantity} onChange={(e) => setQuantity(Math.max(1, Math.min(10, Number(e.target.value) || 1)))} className="w-16 border-b border-[#181513]/30 bg-transparent py-2 text-center outline-none" />
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Button size="lg" onClick={addToBag} disabled={!selected?.isAvailable} isLoading={state === 'adding'}>
              {state === 'added' ? 'Added to Bag' : 'Add to Bag'}
            </Button>
            {state === 'added' && <Link href="/cart" className="text-xs underline underline-offset-4">View bag</Link>}
          </div>
        </div>
      </div>
    </main>
  );
}
