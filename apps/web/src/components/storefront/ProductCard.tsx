import Link from 'next/link';
import type { ProductDto } from '@seethapaati/contracts';

export function ProductCard({ product }: { product: ProductDto }) {
  const image = product.images[0]?.url;
  const variant = product.variants.find((item) => item.isAvailable) ?? product.variants[0];

  return (
    <article className="group">
      <Link href={'/shop/' + product.slug} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-[#ECE8E0]">
          {image ? (
            <img src={image} alt={product.images[0]?.altText || product.name} className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]" />
          ) : (
            <div className="flex h-full items-end p-6"><span className="font-serif text-3xl leading-none text-[#181513]/25">{product.name}</span></div>
          )}
          {!variant?.isAvailable && <span className="absolute left-4 top-4 bg-[#F7F5F0] px-3 py-2 text-[10px] uppercase tracking-[0.18em]">Unavailable</span>}
        </div>
        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-xl">{product.name}</h2>
            {product.category && <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[#181513]/50">{product.category.name}</p>}
          </div>
          {variant && <p className="text-sm">₹{(variant.priceCents / 100).toLocaleString('en-IN')}</p>}
        </div>
      </Link>
    </article>
  );
}
