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
      <p className="eyebrow"><span className="eyebrow-dot" /> Your account</p>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
        <h1 className="font-serif text-5xl md:text-6xl">{profile?.fullName || 'Account'}</h1>
        <Link href="/account/orders" className="text-xs underline underline-offset-4">View orders</Link>
      </div>
      {error && <p className="mt-8 text-sm text-red-700">{error}</p>}
      <div className="mt-14 grid gap-14 md:grid-cols-2">
        <section className="border-t border-[#181513] pt-6">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#181513]/50">Profile</p>
          {profile && <dl className="mt-6 space-y-5 text-sm">
            <div><dt className="text-[#181513]/45">Email</dt><dd className="mt-1">{profile.email}</dd></div>
            <div><dt className="text-[#181513]/45">Phone</dt><dd className="mt-1">{profile.phone || 'Not provided'}</dd></div>
          </dl>}
        </section>
        <section className="border-t border-[#181513] pt-6">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#181513]/50">Saved addresses</p>
          {addresses.length === 0 ? <p className="mt-6 text-sm text-[#181513]/55">No saved addresses yet.</p> : (
            <div className="mt-6 divide-y divide-[#E3DFD7]">
              {addresses.map((a) => <div key={a.id} className="py-5 text-sm">
                <p>{a.fullName}{a.isDefault ? ' · Default' : ''}</p>
                <p className="mt-1 text-[#181513]/60">{a.addressLine1}{a.addressLine2 ? ', ' + a.addressLine2 : ''}</p>
                <p className="text-[#181513]/60">{a.city}, {a.state} {a.postalCode}</p>
              </div>)}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
