'use client';

import Link from 'next/link';

export function SiteHeader() {
  return (
    <>
      <div className="site-announcement" aria-label="Seethapaati brand message">
        <div className="site-announcement__track" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, index) => (
            <span className="site-announcement__item" key={index}>
              <i>✳</i> Welcome to Seethapaati <i>✳</i> A growing collection of everyday favourites <i>✳</i>
            </span>
          ))}
        </div>
      </div>
      <header className="sticky top-0 z-40 border-b border-[#E3DFD7] bg-[#F7F5F0]/95 backdrop-blur-sm">
        <div className="mx-auto flex min-h-[68px] max-w-[1600px] items-center justify-between gap-5 px-6 py-4 md:min-h-[76px] md:px-10">
          <Link href="/" className="shrink-0 font-serif text-[25px] tracking-[-0.045em] transition-opacity hover:opacity-65" aria-label="Seethapaati home">
            SEETHAPAATI<span className="ml-1 text-[#B8860B]">.</span>
          </Link>
          <nav aria-label="Main navigation" className="flex flex-wrap items-center justify-end gap-x-5 gap-y-2 text-[9px] font-medium uppercase tracking-[0.18em] md:gap-x-9 md:tracking-[0.22em]">
            <Link href="/shop" className="transition-colors hover:text-[#B8860B]">Shop</Link>
            <Link href="/about" className="transition-colors hover:text-[#B8860B]">About us</Link>
            <Link href="/contact" className="hidden transition-colors hover:text-[#B8860B] sm:inline">Contact</Link>
            <Link href="/account/orders" className="hidden transition-colors hover:text-[#B8860B] sm:inline">Orders</Link>
            <Link href="/cart" className="transition-colors hover:text-[#B8860B]">Bag <span aria-hidden="true">↗</span></Link>
          </nav>
        </div>
      </header>
    </>
  );
}
