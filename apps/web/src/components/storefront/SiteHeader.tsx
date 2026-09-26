'use client';

import Link from 'next/link';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#E3DFD7] bg-[#F7F5F0]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-6 md:px-10">
        <Link href="/" className="font-serif text-2xl tracking-tight">SEETHAPAATI</Link>
        <nav className="hidden items-center gap-8 text-[11px] uppercase tracking-[0.22em] md:flex">
          <Link href="/shop" className="transition-opacity hover:opacity-60">Shop</Link>
          <Link href="/account/orders" className="transition-opacity hover:opacity-60">Orders</Link>
        </nav>
        <Link href="/cart" className="text-[11px] uppercase tracking-[0.22em]">Bag</Link>
      </div>
    </header>
  );
}
