import type { Metadata } from 'next';
import { Cormorant_Garamond, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Hairline } from '../components/ui/Hairline';

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
        
        {/* Ticker / Announcement */}
        <div className="w-full bg-[#181513] text-[#F7F5F0] py-2 px-4 text-center text-[11px] font-sans tracking-[0.2em] uppercase">
          Complimentary Carbon-Neutral Regional Dispatch Above ₹500
        </div>

        {/* Minimalist Horizon Header */}
        <header className="sticky top-0 z-40 bg-[#F7F5F0]/95 backdrop-blur-none border-b border-[#E3DFD7]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
            <nav className="hidden md:flex items-center space-x-8 text-[12px] uppercase tracking-[0.15em] font-medium text-[#181513]/80">
              <a href="#harvest" className="hover:text-[#181513] transition-colors">The Harvest</a>
              <a href="#archive" className="hover:text-[#181513] transition-colors">Botanical Index</a>
              <a href="#provenance" className="hover:text-[#181513] transition-colors">Provenance</a>
            </nav>

            <a href="/" className="font-serif text-2xl md:text-3xl tracking-tight font-medium text-[#181513] text-center">
              {STORE_NAME}
            </a>

            <div className="flex items-center space-x-6 text-[12px] uppercase tracking-[0.15em] font-medium text-[#181513]/80">
              <a href="/account" className="hidden sm:inline hover:text-[#181513] transition-colors">Account</a>
              <button className="hover:text-[#181513] transition-colors">
                Pantry [0]
              </button>
            </div>
          </div>
        </header>

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
                  Honoring the culinary traditions of South Indian agricultural heritage. Stone-milled spices, highland teas, and sprouted grains.
                </p>
              </div>

              <div className="md:col-span-3 md:col-start-7">
                <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-[#F7F5F0]/50 block mb-4">Navigation</span>
                <ul className="space-y-2.5 text-[13px] font-sans tracking-[0.05em] text-[#F7F5F0]/80">
                  <li><a href="#harvest" className="hover:text-white transition-colors">The Harvest</a></li>
                  <li><a href="#archive" className="hover:text-white transition-colors">Botanical Index</a></li>
                  <li><a href="#provenance" className="hover:text-white transition-colors">Processing Rituals</a></li>
                </ul>
              </div>

              <div className="md:col-span-3">
                <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-[#F7F5F0]/50 block mb-4">Trust & Policies</span>
                <ul className="space-y-2.5 text-[13px] font-sans tracking-[0.05em] text-[#F7F5F0]/80">
                  <li><a href="/shipping" className="hover:text-white transition-colors">Shipping & Handling</a></li>
                  <li><a href="/returns" className="hover:text-white transition-colors">Returns & Refunds</a></li>
                  <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
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
