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
  const [bagError, setBagError] = useState('');

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

  if (state === 'loading') return <main className="editorial-page mx-auto max-w-6xl px-6 py-24 md:py-32" aria-label="Loading product"><div className="grid animate-pulse gap-12 md:grid-cols-2 md:gap-20"><div className="aspect-[4/5] bg-[#ECE8E0]"/><div className="space-y-5 self-center"><div className="h-3 w-24 bg-[#ECE8E0]"/><div className="h-14 w-4/5 bg-[#ECE8E0]"/><div className="h-3 w-full bg-[#ECE8E0]"/><div className="h-3 w-2/3 bg-[#ECE8E0]"/></div></div></main>;
  if (state === 'error' || !product) return <main className="editorial-page mx-auto max-w-6xl px-6 py-28 text-center md:py-36"><p className="eyebrow justify-center"><span className="eyebrow-dot"/> Product details</p><h1 className="mt-5 font-serif text-4xl md:text-6xl">This piece is unavailable.</h1><p className="mt-4 text-sm text-[#181513]/55">It may have moved or may no longer be available.</p><Link href="/shop" className="mt-8 inline-flex text-[10px] uppercase tracking-[0.18em] text-[#A66B18] underline underline-offset-4">Return to the collection</Link></main>;

  const selected = product.variants.find((item) => item.id === variantId);
  const image = product.images[0]?.url;

  async function addToBag() {
    if (!selected?.isAvailable) return;
    setBagError('');
    setState('adding');
    try {
      await fetchApi('/cart/items', { method: 'POST', body: JSON.stringify({ variantId, quantity }) });
      setState('added');
    } catch (reason) {
      setBagError(reason instanceof Error ? reason.message : 'Unable to add this item. Please try again.');
      setState('ready');
    }
  }

  return (
    <main className="editorial-page mx-auto max-w-[1440px] px-6 pb-20 pt-9 md:px-10 md:pb-28 md:pt-14">
      <Link href="/shop" className="inline-flex items-center gap-3 text-[9px] uppercase tracking-[0.2em] text-[#181513]/50 transition-colors hover:text-[#A66B18]">← The collection</Link>
      <div className="mt-8 grid items-start gap-10 md:mt-12 md:grid-cols-[1.08fr_0.92fr] md:gap-16 lg:gap-24">
        <div className="aspect-[4/5] overflow-hidden bg-[#ECE8E0]">
          {image ? <img src={image} alt={product.images[0]?.altText || product.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-end p-10"><span className="font-serif text-6xl text-[#181513]/20">{product.name}</span></div>}
        </div>
        <div className="pt-2 md:sticky md:top-12 md:pt-8">
          {product.category && <p className="text-[10px] uppercase tracking-[0.24em] text-[#B8860B]">{product.category.name}</p>}
          <h1 className="mt-5 font-serif text-5xl font-normal leading-[0.94] tracking-[-0.05em] md:text-7xl">{product.name}</h1>
          <p className="mt-7 max-w-xl text-sm leading-7 text-[#181513]/65">{product.description}</p>
          {selected && <p className="mt-8 text-lg">₹{(selected.priceCents / 100).toLocaleString('en-IN')}</p>}

          <div className="mt-10 space-y-7 border-y border-[#E3DFD7] py-7">
            <div>
              <label className="text-[9px] uppercase tracking-[0.2em] text-[#181513]/55">Choose a format</label>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.variants.map((variant) => (
                  <button type="button" key={variant.id} disabled={!variant.isAvailable} aria-pressed={variant.id === variantId} onClick={() => { setVariantId(variant.id); setState('ready'); setBagError(''); }} className={'min-h-12 border px-4 py-3 text-xs transition-colors ' + (variant.id === variantId ? 'border-[#181513] bg-[#181513] text-[#F7F5F0]' : 'border-[#E3DFD7] hover:border-[#B8860B]') + ' disabled:cursor-not-allowed disabled:opacity-35'}>
                    {variant.name || variant.packType}{variant.weightGrams ? ' · ' + variant.weightGrams + 'g' : ''}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between gap-4">
              <label htmlFor="quantity" className="text-[10px] uppercase tracking-[0.2em] text-[#181513]/50">Quantity</label>
              <div className="flex items-center border-b border-[#181513]/30"><button type="button" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="px-3 py-2 text-sm disabled:opacity-30">−</button><input id="quantity" type="number" min={1} max={10} value={quantity} onChange={(e) => setQuantity(Math.max(1, Math.min(10, Number(e.target.value) || 1)))} className="w-10 border-0 bg-transparent py-2 text-center outline-none focus:shadow-none"/><button type="button" aria-label="Increase quantity" disabled={quantity >= 10} onClick={() => setQuantity((value) => Math.min(10, value + 1))} className="px-3 py-2 text-sm disabled:opacity-30">+</button></div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Button size="lg" onClick={addToBag} disabled={!selected?.isAvailable} isLoading={state === 'adding'}>
              {state === 'added' ? 'Added to Bag' : 'Add to Bag'}
            </Button>
            {bagError && <p role="alert" className="w-full text-xs leading-5 text-red-700">{bagError}</p>}
            {state === 'added' && <div className="flex w-full items-center justify-between gap-4 text-xs"><span className="text-[#181513]/60" role="status">Added to your bag.</span><Link href="/cart" className="text-[#A66B18] underline underline-offset-4">View bag →</Link></div>}
          </div>
        </div>
      </div>
    </main>
  );
}
