import Link from 'next/link';
import { ArrowRight, Sparkles, Heart, ShieldCheck, Sun } from 'lucide-react';

export const metadata = {
  title: 'Our Heritage Story | Seethapaati',
  description:
    'The matrilineal heirloom story of Seethapaati — handcrafted stone-ground podis, spices, and South Indian pantry staples rooted in Thanjavur and Mylapore traditions.',
};

export default function AboutPage() {
  return (
    <main className="editorial-page mx-auto max-w-[1240px] px-4 pb-24 pt-10 sm:px-6 md:px-10 md:pb-32 md:pt-16">
      {/* Editorial Hero */}
      <header className="max-w-3xl border-b border-[#E3DFD7] pb-8 md:pb-14">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#B8860B]">
          The Matrilineal Heirloom
        </p>
        <h1 className="mt-3 font-serif text-4xl font-normal leading-[1.05] tracking-[-0.04em] text-[#181513] sm:text-6xl md:text-7xl">
          Crafted the way Paati made it.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#181513]/70 md:text-lg">
          No industrial high-speed mills. No chemical preservatives. Just the slow, patient rhythm of granite mortars, sun-cured spices, and recipes passed quietly through four generations.
        </p>
      </header>

      {/* Narrative Sections */}
      <div className="mt-12 grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <div className="space-y-10 text-sm leading-relaxed text-[#181513]/80">
          <section>
            <h2 className="font-serif text-3xl font-normal text-[#181513]">
              The Kaveri Delta &amp; The Kitchen in Mylapore
            </h2>
            <p className="mt-3">
              Seethapaati was born in 1938 along the fertile banks of the Kaveri in Thanjavur. In her ancestral kitchen, food was never considered a commodity to be hurried. Spices were not ground in electric pulverizers that heat the seed and burn away precious volatile oils. Instead, every morning began with the sun drying of Guntur chillies on clean cotton saris spread across the open terrace.
            </p>
            <p className="mt-3">
              Later, when she made South Mada Street in Mylapore her home, her pantry became legendary among family and neighbours. A single dollop of her Idli Podi mixed with cold-pressed gingelly oil turned simple tiffin into something sacred and unforgettable.
            </p>
          </section>

          <section className="border-l-2 border-[#B8860B] pl-6 italic">
            <p className="font-serif text-xl leading-relaxed text-[#181513]">
              &ldquo;If the spice heats up during grinding, the soul of the dish is already lost. Patience is the secret ingredient no store-bought packet can purchase.&rdquo;
            </p>
            <p className="mt-2 text-xs font-sans not-italic uppercase tracking-widest text-[#B8860B]">
              — Seetha Paati, 1974
            </p>
          </section>

          <section>
            <h2 className="font-serif text-3xl font-normal text-[#181513]">
              The Three Sacred Rules We Never Break
            </h2>
            <div className="mt-5 space-y-4">
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#B8860B]/10 text-[#B8860B]">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#181513]">1. Stone Pounded at Gentle Ambient Temperature</h3>
                  <p className="mt-1 text-xs text-[#181513]/70">
                    Industrial blenders generate fierce friction heat, destroying subtle aromatic notes. We pound our whole spices in slow stone granite mills, preserving the natural fragrance and crisp texture.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#B8860B]/10 text-[#B8860B]">
                  <Sun className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#181513]">2. 100% Sun-Dried Heirloom Harvests</h3>
                  <p className="mt-1 text-xs text-[#181513]/70">
                    We source directly from farmer clusters across Salem (turmeric), Byadgi (deep red mild chillies), Guntur (aromatic heat), and Malabar (sun-dried black peppercorns). No greenhouse acceleration or artificial dryers.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#B8860B]/10 text-[#B8860B]">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#181513]">3. Pure Food Purity: Zero Chemicals &amp; Fillers</h3>
                  <p className="mt-1 text-xs text-[#181513]/70">
                    You will never find artificial colourants, anti-caking additives, synthetic preservatives, or MSG in any Seethapaati tin. What you receive is strictly what our grandmothers cooked with.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-3xl font-normal text-[#181513]">
              Dispatched Fresh Every Week
            </h2>
            <p className="mt-3">
              We do not warehouse stale goods for months. Small batches are prepared weekly at our artisanal studio in Mylapore, packed into protective sealed tins, and couriered across India so that the aroma when you unseal your jar is as vibrant as if it was ground that very morning.
            </p>
          </section>
        </div>

        {/* Right Column: Visual Showcase & CTA */}
        <aside className="space-y-6">
          <div className="border border-[#E3DFD7] bg-[#ECE8E0] p-8 text-center">
            <span className="font-serif text-6xl text-[#181513]/25">1938</span>
            <p className="mt-3 font-serif text-2xl text-[#181513]">A Living Tradition</p>
            <p className="mt-2 text-xs leading-relaxed text-[#181513]/70">
              Rooted in Thanjavur heritage, sustained through Mylapore wisdom, and delivered to modern tables across the world.
            </p>
            <div className="mt-8 border-t border-[#181513]/10 pt-6">
              <Link
                href="/shop"
                className="inline-flex h-12 w-full items-center justify-center gap-2 bg-[#181513] text-xs font-semibold uppercase tracking-[0.2em] text-[#F7F5F0] transition hover:bg-[#B8860B]"
              >
                Explore the Collection <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="border border-[#E3DFD7] bg-white/60 p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#B8860B]">
              Artisanal Guarantee
            </p>
            <p className="mt-2 text-xs leading-relaxed text-[#181513]/75">
              If any jar does not meet your expectations of heirloom purity, our care team will promptly replace it or refund your order with zero hassle.
            </p>
            <Link
              href="/contact"
              className="mt-4 inline-block text-xs font-semibold text-[#A66B18] underline underline-offset-4"
            >
              Speak to our Kitchen Concierge →
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
