export default function Page() {
  return (
    <main className="editorial-page mx-auto min-h-[55vh] max-w-[1100px] px-6 pb-20 pt-14 md:px-10 md:pb-28 md:pt-24">
      <header className="max-w-3xl border-b border-[#E3DFD7] pb-10 md:pb-14">
        <p className="eyebrow"><span className="eyebrow-dot" /> Help & policies</p>
        <h1 className="mt-5 font-serif text-5xl font-normal leading-[0.95] tracking-[-0.055em] md:text-7xl">Shipping Policy</h1>
        <p className="mt-6 max-w-2xl text-sm leading-7 text-[#181513]/65">Delivery details should be clear before you place an order. The information below is a placeholder until Seethapaati’s shipping arrangements are confirmed.</p>
      </header>
      <div className="mt-10 max-w-3xl space-y-8 text-sm leading-7 text-[#181513]/75 md:mt-14">
        <section><h2 className="font-serif text-2xl text-[#181513]">Delivery coverage and timelines</h2><p className="mt-2">Available delivery locations, dispatch schedules and estimated delivery times will be shown here once confirmed. Delivery estimates may vary by destination and operational conditions.</p></section>
        <section><h2 className="font-serif text-2xl text-[#181513]">Shipping charges</h2><p className="mt-2">Any applicable shipping charges and eligibility for free delivery should be displayed clearly in the cart and at checkout before payment. The final policy must match the live checkout calculation.</p></section>
        <section><h2 className="font-serif text-2xl text-[#181513]">Delivery issues</h2><p className="mt-2">If an order is delayed, arrives damaged or cannot be delivered, contact Seethapaati through the confirmed customer-support channel. Add the actual support details and process before publishing.</p></section>
      </div>
    </main>
  );
}
