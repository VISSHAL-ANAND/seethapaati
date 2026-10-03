'use client';

import { useEffect, useState } from 'react';
import { fetchApi } from '../../lib/api-client';
import Link from 'next/link';

type Profile = { fullName: string; email: string; phone?: string | null };
type Address = { id: string; fullName: string; phone: string; addressLine1: string; addressLine2?: string | null; city: string; state: string; postalCode: string; country: string; isDefault: boolean };

export default function AccountPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([fetchApi<Profile>('/users/me'), fetchApi<Address[]>('/users/me/addresses')])
      .then(([p, a]) => { setProfile(p); setAddresses(a); })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load account'));
  }, []);

  return (
    <main className="editorial-page mx-auto max-w-[1280px] px-6 pb-20 pt-12 md:px-10 md:pb-28 md:pt-20">
      <header className="border-b border-[#E3DFD7] pb-8 md:pb-10">
        <p className="eyebrow"><span className="eyebrow-dot" /> Your account</p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
          <h1 className="font-serif text-5xl tracking-[-0.05em] md:text-7xl">{profile?.fullName || 'Account'}</h1>
          <Link href="/account/orders" className="text-[10px] uppercase tracking-[0.18em] text-[#A66B18] underline underline-offset-4">View orders →</Link>
        </div>
      </header>
      {error && <p role="alert" className="mt-8 border-l-2 border-red-700 px-4 py-2 text-sm text-red-700">{error}</p>}
      <div className="mt-10 grid gap-6 md:mt-14 md:grid-cols-2">
        <section className="border-t border-[#181513] bg-white/25 p-6 md:p-8">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#181513]/50">Profile</p>
          {profile ? <dl className="mt-7 space-y-6 text-sm">
            <div><dt className="text-[10px] uppercase tracking-[0.15em] text-[#181513]/40">Name</dt><dd className="mt-2 font-serif text-2xl">{profile.fullName}</dd></div>
            <div><dt className="text-[10px] uppercase tracking-[0.15em] text-[#181513]/40">Email</dt><dd className="mt-2">{profile.email}</dd></div>
            <div><dt className="text-[10px] uppercase tracking-[0.15em] text-[#181513]/40">Phone</dt><dd className="mt-2">{profile.phone || 'Not provided'}</dd></div>
          </dl> : <p className="mt-7 text-sm text-[#181513]/45">Loading profile…</p>}
        </section>
        <section className="border-t border-[#181513] bg-white/25 p-6 md:p-8">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#181513]/50">Saved addresses</p>
          {addresses.length === 0 ? <p className="mt-7 text-sm text-[#181513]/55">No saved addresses yet.</p> : (
            <div className="mt-5 divide-y divide-[#E3DFD7]">
              {addresses.map((a) => <div key={a.id} className="py-5 text-sm first:pt-1">
                <p className="font-medium">{a.fullName}{a.isDefault ? <span className="ml-2 text-[9px] uppercase tracking-[0.12em] text-[#A66B18]">Default</span> : null}</p>
                <p className="mt-2 text-[#181513]/60">{a.addressLine1}{a.addressLine2 ? ', ' + a.addressLine2 : ''}</p>
                <p className="text-[#181513]/60">{a.city}, {a.state} {a.postalCode}</p>
              </div>)}
            </div>
          )}
        </section>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Link href="/account/orders" className="border border-[#E3DFD7] p-5 text-[10px] uppercase tracking-[0.17em] transition-colors hover:border-[#B8860B]">Orders <span className="float-right">↗</span></Link>
        <Link href="/account/returns" className="border border-[#E3DFD7] p-5 text-[10px] uppercase tracking-[0.17em] transition-colors hover:border-[#B8860B]">Returns <span className="float-right">↗</span></Link>
        <Link href="/account/notifications" className="border border-[#E3DFD7] p-5 text-[10px] uppercase tracking-[0.17em] transition-colors hover:border-[#B8860B]">Notifications <span className="float-right">↗</span></Link>
      </div>
    </main>
  );
}
