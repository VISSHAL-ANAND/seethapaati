import type { Metadata } from 'next';
import Link from 'next/link';
import { Cormorant_Garamond, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Hairline } from '../components/ui/Hairline';
import { SiteHeader } from '../components/storefront/SiteHeader';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || 'THE ATELIER';

export const metadata: Metadata = {
  title: {
    template: `%s | ${STORE_NAME}`,
    default: STORE_NAME,
  },
  description: 'Curated single-origin spices, highland botanicals, and traditional culinary goods.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${plusJakarta.variable}`}>
      <body className="min-h-screen flex flex-col bg-[#F7F5F0] text-[#181513] selection:bg-[#181513] selection:text-[#F7F5F0]">
        
        <SiteHeader />

        <main className="flex-grow">
          {children}
        </main>

        {/* Structured Atelier Footer */}
        <footer className="bg-[#241C18] text-[#F7F5F0] pt-20 pb-12 mt-32">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-16">
              <div className="md:col-span-5">
                <span className="font-serif text-3xl font-medium tracking-tight block mb-4">
                  {STORE_NAME}
                </span>
                <p className="text-[#F7F5F0]/70 text-[14px] leading-relaxed max-w-sm font-sans">
                  The Seethapaati collection is presented through a server-authoritative commerce system with live catalog, pricing, cart, checkout, order, and return workflows.
                </p>
              </div>

              <div className="md:col-span-3 md:col-start-7">
                <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-[#F7F5F0]/50 block mb-4">Navigation</span>
                <ul className="space-y-2.5 text-[13px] font-sans tracking-[0.05em] text-[#F7F5F0]/80">
                  <li><Link href="/shop" className="hover:text-white transition-colors">Shop</Link></li>
                  <li><Link href="/cart" className="hover:text-white transition-colors">Bag</Link></li>
                  <li><Link href="/account/orders" className="hover:text-white transition-colors">Orders</Link></li>
                </ul>
              </div>

              <div className="md:col-span-3">
                <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-[#F7F5F0]/50 block mb-4">Trust & Policies</span>
                <ul className="space-y-2.5 text-[13px] font-sans tracking-[0.05em] text-[#F7F5F0]/80">
                  <li><Link href="/shipping" className="hover:text-white transition-colors">Shipping & Handling</Link></li>
                  <li><Link href="/returns" className="hover:text-white transition-colors">Returns & Refunds</Link></li>
                  <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                </ul>
              </div>
            </div>

            <Hairline className="bg-white/10" />

            <div className="pt-8 flex flex-col sm:flex-row justify-between items-center text-[12px] text-[#F7F5F0]/40 font-sans tracking-[0.05em]">
              <p>&copy; {new Date().getFullYear()} {STORE_NAME}. All rights reserved.</p>
              <p className="mt-2 sm:mt-0">Server-Authoritative Commerce Monolith</p>
            </div>
          </div>
        </footer>

      </body>
    </html>
  );
}
