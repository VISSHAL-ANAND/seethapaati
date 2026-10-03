'use client';

import Link from 'next/link';
import { useState } from 'react';

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

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
          <Link href="/" onClick={close} className="shrink-0 font-serif text-[25px] tracking-[-0.045em] transition-opacity hover:opacity-65" aria-label="Seethapaati home">
            SEETHAPAATI<span className="ml-1 text-[#B8860B]">.</span>
          </Link>

          <nav aria-label="Main navigation" className="hidden items-center gap-8 text-[9px] font-medium uppercase tracking-[0.22em] md:flex">
            {[
              ['/shop', 'Shop'],
              ['/about', 'About us'],
              ['/contact', 'Contact'],
              ['/account/orders', 'Orders'],
              ['/cart', 'Bag'],
            ].map(([href, label]) => (
              <Link key={href} href={href} className="nav-cube" aria-label={label}>
                <span className="nav-cube__inner">
                  <span className="nav-cube__face nav-cube__face--front">{label}{label === 'Bag' && <span aria-hidden="true"> ↗</span>}</span>
                  <span className="nav-cube__face nav-cube__face--back" aria-hidden="true">{label}{label === 'Bag' && <span aria-hidden="true"> ↗</span>}</span>
                </span>
              </Link>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="grid h-10 w-10 place-items-center border border-[#E3DFD7] md:hidden"
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            <span className="flex w-4 flex-col gap-1.5" aria-hidden="true">
              <span className="h-px w-full bg-[#181513]" />
              <span className="h-px w-full bg-[#181513]" />
            </span>
          </button>
        </div>

        {open && (
          <div id="mobile-navigation" className="border-t border-[#E3DFD7] bg-[#F7F5F0] px-6 pb-7 pt-3 md:hidden">
            <nav aria-label="Mobile navigation" className="divide-y divide-[#E3DFD7]">
              {[
                ['/shop', 'Shop'],
                ['/about', 'About us'],
                ['/contact', 'Contact'],
                ['/account/orders', 'Orders'],
                ['/cart', 'Bag'],
              ].map(([href, label]) => (
                <Link key={href} href={href} onClick={close} className="flex items-center justify-between py-4 font-serif text-2xl">
                  <span>{label}</span><span className="text-sm text-[#B8860B]">↗</span>
                </Link>
              ))}
            </nav>
            <div className="mt-5 flex gap-5 text-[9px] uppercase tracking-[0.18em] text-[#181513]/50">
              <Link href="/account" onClick={close}>Account</Link>
              <Link href="/shipping" onClick={close}>Shipping</Link>
              <Link href="/returns" onClick={close}>Returns</Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
