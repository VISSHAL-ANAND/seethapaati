export default function Page() {
  return (
    <main className="editorial-page mx-auto min-h-[55vh] max-w-[1100px] px-6 pb-20 pt-14 md:px-10 md:pb-28 md:pt-24">
      <header className="max-w-3xl border-b border-[#E3DFD7] pb-10 md:pb-14">
        <p className="eyebrow"><span className="eyebrow-dot" /> Help & policies</p>
        <h1 className="mt-5 font-serif text-5xl font-normal leading-[0.95] tracking-[-0.055em] md:text-7xl">Returns & Refunds</h1>
        <p className="mt-6 max-w-2xl text-sm leading-7 text-[#181513]/65">We want you to know what to expect if something is not right with your order. This policy needs the store’s confirmed return and refund rules before launch.</p>
      </header>
      <div className="mt-10 max-w-3xl space-y-8 text-sm leading-7 text-[#181513]/75 md:mt-14">
        <section><h2 className="font-serif text-2xl text-[#181513]">Requesting a return</h2><p className="mt-2">The eligible reasons, request window, product condition requirements and return procedure must be confirmed by Seethapaati and published here. Do not assume an item is eligible until the applicable policy is finalised.</p></section>
        <section><h2 className="font-serif text-2xl text-[#181513]">Damaged, incorrect or missing items</h2><p className="mt-2">If an order arrives damaged, incorrect or incomplete, contact customer support using the confirmed channel and provide the order details. The final policy should state what evidence may be requested and how cases are resolved.</p></section>
        <section><h2 className="font-serif text-2xl text-[#181513]">Refunds</h2><p className="mt-2">The available refund methods, processing timelines, shipping-charge treatment and cancellation rules must be specified here and kept consistent with the checkout and payment systems.</p></section>
      </div>
    </main>
  );
}
