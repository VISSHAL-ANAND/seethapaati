export default function Page() {
  return (
    <main className="editorial-page mx-auto min-h-[55vh] max-w-[1100px] px-6 pb-20 pt-14 md:px-10 md:pb-28 md:pt-24">
      <header className="max-w-3xl border-b border-[#E3DFD7] pb-10 md:pb-14">
        <p className="eyebrow"><span className="eyebrow-dot" /> We’re here to help</p>
        <h1 className="mt-5 font-serif text-5xl font-normal leading-[0.95] tracking-[-0.055em] md:text-7xl">Let’s talk.</h1>
        <p className="mt-6 max-w-2xl text-sm leading-7 text-[#181513]/65">Have a question about Seethapaati or an order? We’d love to hear from you.</p>
      </header>
      <div className="mt-10 max-w-3xl space-y-8 text-sm leading-7 text-[#181513]/75 md:mt-14">
        <section><h2 className="font-serif text-2xl text-[#181513]">Get in touch.</h2><p className="mt-2">For order, product or general enquiries, please use the contact details provided with your order confirmation or on the official Seethapaati store communication.</p></section>
        <p className="text-xs text-[#181513]/50">A dedicated contact email and phone number can be added here once confirmed.</p>
      </div>
    </main>
  );
}
