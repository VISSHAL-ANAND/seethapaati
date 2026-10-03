export default function Page() {
  return (
    <main className="editorial-page mx-auto min-h-[55vh] max-w-[1100px] px-6 pb-20 pt-14 md:px-10 md:pb-28 md:pt-24">
      <header className="max-w-3xl border-b border-[#E3DFD7] pb-10 md:pb-14">
        <p className="eyebrow"><span className="eyebrow-dot" /> The story</p>
        <h1 className="mt-5 font-serif text-5xl font-normal leading-[0.95] tracking-[-0.055em] md:text-7xl">A little about Seethapaati.</h1>
        <p className="mt-6 max-w-2xl text-sm leading-7 text-[#181513]/65">A growing collection of familiar flavours and everyday favourites, made to find a place in your kitchen.</p>
      </header>
      <div className="mt-10 max-w-3xl space-y-8 text-sm leading-7 text-[#181513]/75 md:mt-14">
        <section><h2 className="font-serif text-2xl text-[#181513]">Growing, one jar at a time.</h2><p className="mt-2">Seethapaati is at the beginning of its journey. We’re bringing together food and drink favourites for the everyday — from a versatile powder to a nourishing malt mix and a cup of Ceylon tea.</p></section>
        <section><h2 className="font-serif text-2xl text-[#181513]">Made for everyday moments.</h2><p className="mt-2">Our collection will continue to grow. We want this to be a welcoming place to discover familiar tastes, find something new and make them part of your daily routine.</p></section>
        <p className="border-l border-[#B8860B] pl-5 font-serif text-2xl italic text-[#181513]">Here’s to the little things we share.</p>
      </div>
    </main>
  );
}
