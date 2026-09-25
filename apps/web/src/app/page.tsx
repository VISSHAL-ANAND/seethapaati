import React from 'react';
import { Hairline } from '../components/ui/Hairline';
import { Button } from '../components/ui/Button';

const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || 'THE ATELIER';

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Scene 1: Terroir Hero */}
      <section className="relative min-h-[75vh] flex items-end pb-20 pt-32 px-6 md:px-12 max-w-7xl mx-auto w-full">
        <div className="flex flex-col max-w-3xl">
          <span className="text-[11px] font-sans font-medium uppercase tracking-[0.25em] text-[#181513]/60 mb-6 block">
            Harvest Archive &bull; Monograph Edition
          </span>
          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-normal tracking-tight text-[#181513] leading-[0.95] mb-8">
            Single-Origin Harvests. <br />
            <span className="italic font-normal">Stone-Milled</span> Purity.
          </h1>
          <p className="text-[16px] md:text-[18px] text-[#181513]/80 font-sans leading-relaxed max-w-xl mb-10 font-normal">
            A curated culinary collection dedicated to preserving the volatile oils, natural aromatics, and nutritional potency of traditional Indian botanicals.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button size="lg" variant="solid">
              Explore The Harvest &darr;
            </Button>
            <Button size="lg" variant="outline">
              The Processing Manifesto
            </Button>
          </div>
        </div>
      </section>

      <Hairline />

      {/* Scene 2: The Philosophy Statement (Scale Shift) */}
      <section className="py-28 md:py-40 px-6 md:px-12 max-w-5xl mx-auto text-center">
        <span className="text-[11px] font-sans uppercase tracking-[0.3em] text-[#B8860B] font-semibold block mb-8">
          The Guiding Standard
        </span>
        <blockquote className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-[1.15] text-[#181513] tracking-tight font-normal">
          &ldquo;We deliberately reject industrial shortcuts. Spices sun-dried on clean stone, grains naturally sprouted, and small batches freshly milled below forty degrees.&rdquo;
        </blockquote>
      </section>

      <Hairline />

      {/* Architectural Index Placeholder for Phase 2 */}
      <section id="harvest" className="py-24 px-6 md:px-12 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-baseline mb-16 gap-4">
          <div>
            <span className="text-[11px] font-sans uppercase tracking-[0.25em] text-[#181513]/60 block mb-2">
              Curator’s Index
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-[#181513] font-normal">
              Active Harvest Categories
            </h2>
          </div>
          <span className="text-[12px] font-sans tracking-[0.1em] text-[#181513]/50">
            Phase 1 Foundation Operational &bull; Awaiting Commerce Core
          </span>
        </div>

        {/* Asymmetric 4-column architectural frame */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              category: '01. Masala Podis',
              desc: 'Sun-dried traditional spice blends and stone-ground culinary essentials.',
              image: '/images/masala.jpg',
            },
            {
              category: '02. Highland Teas',
              desc: 'Hand-picked loose leaf whole grades from high-elevation estates.',
              image: '/images/tea.png',
            },
            {
              category: '03. Sprouted Malts',
              desc: 'Slow-roasted sprouted ragi, heirloom pulses, and nutrient-dense malts.',
              image: '/images/mix.png',
            },
            {
              category: '04. Orchard Nuts',
              desc: 'Whole, unpasteurized single-origin dry fruits and roasted pistachios.',
              image: '/images/nuts.png',
            },
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col group cursor-pointer">
              <div className="aspect-[3/4] bg-neutral-200/50 overflow-hidden mb-4 relative">
                <img
                  src={item.image}
                  alt={item.category}
                  className="w-full h-full object-cover grayscale-[20%] group-hover:scale-105 transition-transform duration-700 ease-out"
                />
              </div>
              <h3 className="font-serif text-xl text-[#181513] font-medium mb-1 group-hover:text-[#B8860B] transition-colors">
                {item.category}
              </h3>
              <p className="text-[13px] text-[#181513]/60 leading-relaxed font-sans">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <Hairline />

      {/* Engineering Foundation Status Check */}
      <section className="py-16 px-6 md:px-12 max-w-7xl mx-auto w-full">
        <div className="p-8 border border-[#E3DFD7] bg-[#F7F5F0]">
          <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-[#181513]/50 block mb-2">
            System Architecture Status
          </span>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h4 className="font-serif text-2xl text-[#181513]">Phase 1 Foundation Deployed</h4>
              <p className="text-[13px] text-[#181513]/70 font-sans mt-1">
                Next.js 15 &bull; NestJS Modular Monolith &bull; PostgreSQL 16 &bull; BullMQ &bull; Zod Contracts &bull; RBAC
              </p>
            </div>
            <div className="inline-flex items-center space-x-2 bg-emerald-950/5 text-emerald-800 px-3.5 py-1.5 text-[11px] font-sans uppercase tracking-wider font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>All Foundation Services Ready</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
