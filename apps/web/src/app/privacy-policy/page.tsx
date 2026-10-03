'use client';

import { PolicyModal } from '../../../components/storefront/PolicyModal';

export default function Page() {
  return (
    <main className="editorial-page mx-auto min-h-[55vh] max-w-[1100px] px-6 pb-20 pt-14 md:px-10 md:pb-28 md:pt-24">
      <header className="max-w-3xl border-b border-[#E3DFD7] pb-10 md:pb-14">
        <p className="eyebrow"><span className="eyebrow-dot" /> Legal</p>
        <h1 className="mt-5 font-serif text-5xl font-normal leading-[0.95] tracking-[-0.055em] md:text-7xl">Privacy Policy</h1>
        <p className="mt-6 max-w-2xl text-sm leading-7 text-[#181513]/65">Our privacy policy opens automatically when you visit this page. Close the window to return here.</p>
        <div className="mt-6"><PolicyModal title="Privacy Policy" description="Your privacy matters. This page explains the intended approach to personal information and is a draft pending confirmation of the store’s actual data practices.">
          <section><h2 className="font-serif text-2xl text-[#181513]">Information you provide</h2><p className="mt-2">When you use the store, you may provide information such as your name, contact details, delivery address and order information. Only collect information needed to operate the store and support customers.</p></section>
          <section><h2 className="font-serif text-2xl text-[#181513]">How information is used</h2><p className="mt-2">Information may be used to process orders, arrange delivery, provide customer support, maintain account features and protect the store from misuse. The final policy must identify the actual service providers and purposes used by this store.</p></section>
          <section><h2 className="font-serif text-2xl text-[#181513]">Sharing, security and retention</h2><p className="mt-2">Personal information should only be shared where needed to provide store services, comply with applicable law or protect legitimate interests. Appropriate safeguards should be used, and information should not be kept longer than necessary.</p></section>
          <section><h2 className="font-serif text-2xl text-[#181513]">Your choices</h2><p className="mt-2">Applicable privacy rights and how to exercise them depend on the laws that apply. Before launch, specify the data controller, contact channel, cookies and analytics in use, retention periods, applicable rights and effective date.</p></section>
        </PolicyModal></div>
      </header>
    </main>
  );
}
