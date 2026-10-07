import Link from 'next/link';
import type { ProductDto } from '@seethapaati/contracts';

export function ProductCard({ product }: { product: ProductDto }) {
  const image = product.images[0]?.url;
  const variant = product.variants.find((item) => item.isAvailable) ?? product.variants[0];
  const badge = product.merchandising?.badge;
  const hasDiscount = Boolean(variant?.compareAtPriceCents && variant.compareAtPriceCents > variant.priceCents);

  const packDetail = variant
    ? [variant.weightGrams ? `${variant.weightGrams}g` : '', variant.packType || variant.name]
        .filter(Boolean)
        .join(' · ')
    : '';

  return (
    <article className="group flex flex-col">
      <Link href={'/shop/' + product.slug} className="flex flex-col h-full focus:outline-hidden">
        <div className="relative aspect-[4/5] overflow-hidden bg-[#ECE8E0]">
          {image ? (
            <img
              src={image}
              alt={product.images[0]?.altText || product.name}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-end p-6">
              <span className="font-serif text-2xl leading-none text-[#181513]/25">{product.name}</span>
            </div>
          )}

          <span
            className="absolute bottom-4 right-4 grid h-9 w-9 translate-y-2 place-items-center bg-[#F7F5F0] text-sm text-[#181513] opacity-0 shadow-xs transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
            aria-hidden="true"
          >
            ↗
          </span>

          {badge && (
            <span className="absolute left-3 top-3 border border-[#B8860B]/40 bg-[#F7F5F0]/95 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-[#B8860B] backdrop-blur-xs">
              {badge.replace('_', ' ')}
            </span>
          )}

          {!variant?.isAvailable && (
            <span className="absolute left-3 bottom-3 border border-[#181513]/20 bg-[#F7F5F0]/95 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-[#181513]/70 backdrop-blur-xs">
              Sold out
            </span>
          )}
        </div>

        <div className="mt-3.5 flex flex-1 flex-col justify-between border-b border-transparent pb-3 transition-colors group-hover:border-[#E3DFD7]">
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="font-serif text-lg leading-snug text-[#181513] group-hover:text-[#A66B18] transition-colors md:text-xl">
                {product.name}
              </h2>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#181513]/55">
              {product.category && <span>{product.category.name}</span>}
              {product.category && packDetail && <span className="text-[#181513]/30">·</span>}
              {packDetail && <span>{packDetail}</span>}
            </div>
          </div>

          {variant && (
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-sm font-medium tabular-nums text-[#181513]">
                ₹{(variant.priceCents / 100).toLocaleString('en-IN')}
              </span>
              {hasDiscount && (
                <span className="text-xs text-[#181513]/40 line-through tabular-nums">
                  ₹{(variant.compareAtPriceCents! / 100).toLocaleString('en-IN')}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </article>
  );
}
