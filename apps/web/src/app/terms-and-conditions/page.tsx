'use client';

import { PolicyModal } from '../../components/storefront/PolicyModal';

export default function Page() {
  return (
    <main className="editorial-page mx-auto min-h-[55vh] max-w-[1100px] px-6 pb-20 pt-14 md:px-10 md:pb-28 md:pt-24">
      <header className="max-w-3xl border-b border-[#E3DFD7] pb-10 md:pb-14">
        <p className="eyebrow"><span className="eyebrow-dot" /> Legal</p>
        <h1 className="mt-5 font-serif text-5xl font-normal leading-[0.95] tracking-[-0.055em] md:text-7xl">Terms & Conditions</h1>
        <p className="mt-6 max-w-2xl text-sm leading-7 text-[#181513]/65">Our store terms open automatically when you visit this page. Close the window to return here.</p>
        <div className="mt-6"><PolicyModal title="Terms & Conditions" description="These terms describe the general rules for using the Seethapaati online store. This page is a draft and must be reviewed and completed before the store is launched.">
          <section><h2 className="font-serif text-2xl text-[#181513]">Using this store</h2><p className="mt-2">By accessing or using this store, you agree to use it lawfully and provide accurate information when placing an order. Do not misuse the site, attempt unauthorised access or interfere with its operation.</p></section>
          <section><h2 className="font-serif text-2xl text-[#181513]">Products, prices and orders</h2><p className="mt-2">Product descriptions, availability and prices are displayed on the store and may change. An order is subject to confirmation by the store. Any applicable taxes, delivery charges and discounts should be shown during checkout before you place an order.</p></section>
          <section><h2 className="font-serif text-2xl text-[#181513]">Payments, delivery and returns</h2><p className="mt-2">Payment, shipping, cancellation, returns and refund conditions are governed by the relevant store policies and the information shown during checkout. Please review those details before ordering.</p></section>
          <section><h2 className="font-serif text-2xl text-[#181513]">Changes and contact</h2><p className="mt-2">These terms may be updated as the store develops. Add the applicable version and effective date, legal business name, jurisdiction, dispute process and confirmed contact details before publishing this policy as final.</p></section>
        </PolicyModal></div>
      </header>
    </main>
  );
}
