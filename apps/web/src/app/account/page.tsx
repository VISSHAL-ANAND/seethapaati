'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, MapPin, Package, ArrowUpRight, Plus } from 'lucide-react';
import { fetchApi, ApiClientError } from '../../lib/api-client';

type Profile = { fullName: string; email: string; phone?: string | null };
type Address = {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

const blank = {
  fullName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'IN',
  isDefault: false,
};

export default function AccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({ fullName: '', phone: '' });
  const [address, setAddress] = useState(blank);
  const [editing, setEditing] = useState<string | null>(null);
  const [addressOpen, setAddressOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  async function load() {
    const [p, a] = await Promise.all([
      fetchApi<Profile>('/users/me'),
      fetchApi<Address[]>('/users/me/addresses'),
    ]);
    setProfile(p);
    setForm({ fullName: p.fullName, phone: p.phone ?? '' });
    setAddresses(a);
  }

  useEffect(() => {
    load().catch((e) => {
      if (e instanceof ApiClientError && e.code === 'UNAUTHORIZED') {
        router.replace('/account/login?next=/account');
      } else {
        setError(e instanceof Error ? e.message : 'Unable to load account');
      }
    });
  }, [router]);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const p = await fetchApi<Profile>('/users/me', {
        method: 'PATCH',
        body: JSON.stringify(form),
      });
      setProfile(p);
      setForm({ fullName: p.fullName, phone: p.phone ?? '' });
      setNotice('Profile updated.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to update profile');
    } finally {
      setSaving(false);
    }
  }

  function newAddress() {
    setEditing(null);
    setAddress({
      ...blank,
      fullName: profile?.fullName ?? '',
      phone: profile?.phone ?? '',
      isDefault: addresses.length === 0,
    });
    setAddressOpen(true);
  }

  function editAddress(a: Address) {
    setEditing(a.id);
    setAddress({
      fullName: a.fullName,
      phone: a.phone,
      addressLine1: a.addressLine1,
      addressLine2: a.addressLine2 ?? '',
      city: a.city,
      state: a.state,
      postalCode: a.postalCode,
      country: a.country,
      isDefault: a.isDefault,
    });
    setAddressOpen(true);
  }

  async function saveAddress(e: FormEvent) {
    e.preventDefault();
    setSavingAddress(true);
    setError('');
    try {
      const saved = editing
        ? await fetchApi<Address>('/users/me/addresses/' + editing, {
            method: 'PATCH',
            body: JSON.stringify(address),
          })
        : await fetchApi<Address>('/users/me/addresses', {
            method: 'POST',
            body: JSON.stringify(address),
          });
      setAddresses((xs) => {
        const next = editing ? xs.map((x) => (x.id === saved.id ? saved : x)) : [...xs, saved];
        return saved.isDefault ? next.map((x) => ({ ...x, isDefault: x.id === saved.id })) : next;
      });
      setAddressOpen(false);
      setNotice(editing ? 'Address updated.' : 'Address saved.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save address');
    } finally {
      setSavingAddress(false);
    }
  }

  async function removeAddress(id: string) {
    if (!window.confirm('Remove this saved address?')) return;
    try {
      await fetchApi('/users/me/addresses/' + id, { method: 'DELETE' });
      setAddresses((xs) => xs.filter((x) => x.id !== id));
      setNotice('Address removed.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to remove address');
    }
  }

  async function logout() {
    await fetchApi('/auth/logout', { method: 'POST' }).catch(() => {});
    router.replace('/');
  }

  return (
    <main className="editorial-page mx-auto max-w-[1280px] px-6 pb-24 pt-10 md:px-10 md:pb-32 md:pt-14">
      {/* Header */}
      <header className="border-b border-[#E3DFD7] pb-8">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#B8860B]">
          Account Overview
        </p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
          <h1 className="font-serif text-5xl tracking-[-0.04em] text-[#181513] md:text-6xl">
            {profile?.fullName || 'Welcome'}
          </h1>
          <button
            onClick={logout}
            className="text-xs uppercase tracking-[0.16em] text-[#A66B18] underline underline-offset-4 hover:text-[#181513]"
          >
            Sign out
          </button>
        </div>
      </header>

      {error && (
        <p role="alert" className="mt-6 border-l-2 border-red-700 bg-red-50 p-3 text-xs text-red-700">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mt-6 border-l-2 border-[#B8860B] bg-[#B8860B]/10 p-3 text-xs text-[#181513]">
          {notice}
        </p>
      )}

      {/* Main Sections */}
      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        {/* Profile Card */}
        <section className="border-t border-[#181513] bg-white/30 p-6 md:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#181513]/60">
            Personal Details
          </p>
          <form onSubmit={saveProfile} className="mt-6 space-y-6">
            <label className="block text-xs font-medium uppercase tracking-[0.15em] text-[#181513]/70">
              Full Name
              <input
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="mt-2 w-full border-b border-[#181513]/25 bg-transparent py-2.5 text-xs text-[#181513] outline-none transition focus:border-[#B8860B]"
              />
            </label>
            <label className="block text-xs font-medium uppercase tracking-[0.15em] text-[#181513]/70">
              Email Address
              <input
                disabled
                value={profile?.email ?? ''}
                className="mt-2 w-full border-b border-[#E3DFD7] bg-transparent py-2.5 text-xs text-[#181513]/40 cursor-not-allowed"
              />
            </label>
            <label className="block text-xs font-medium uppercase tracking-[0.15em] text-[#181513]/70">
              Phone Number
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-2 w-full border-b border-[#181513]/25 bg-transparent py-2.5 text-xs text-[#181513] outline-none transition focus:border-[#B8860B]"
              />
            </label>
            <button
              disabled={saving}
              className="bg-[#181513] px-6 py-3 text-xs uppercase tracking-[0.18em] text-[#F7F5F0] transition hover:bg-[#2E2824] disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </section>

        {/* Addresses Card */}
        <section className="border-t border-[#181513] bg-white/30 p-6 md:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#181513]/60">
                Saved Addresses
              </p>
              <p className="mt-1 text-xs text-[#181513]/55">
                Manage the destinations used at checkout.
              </p>
            </div>
            <button
              onClick={newAddress}
              className="flex items-center gap-1 text-xs font-medium uppercase tracking-[0.16em] text-[#A66B18] hover:text-[#181513]"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          </div>

          <div className="mt-6 divide-y divide-[#E3DFD7]">
            {addresses.length === 0 ? (
              <p className="py-8 text-xs text-[#181513]/50">No saved addresses yet.</p>
            ) : (
              addresses.map((a) => (
                <article key={a.id} className="py-4">
                  <div className="flex justify-between gap-4">
                    <div className="text-xs">
                      <p className="font-medium text-[#181513]">
                        {a.fullName}
                        {a.isDefault && (
                          <span className="ml-2 border border-[#B8860B]/40 bg-[#B8860B]/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-[#A66B18]">
                            Default
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-[#181513]/65">
                        {a.addressLine1}
                        {a.addressLine2 ? ', ' + a.addressLine2 : ''}
                      </p>
                      <p className="text-[#181513]/65">
                        {a.city}, {a.state} {a.postalCode}
                      </p>
                      <p className="mt-1 text-[#181513]/50">{a.phone}</p>
                    </div>
                    <div className="flex gap-3 text-xs">
                      <button onClick={() => editAddress(a)} className="text-[#181513] underline underline-offset-4">
                        Edit
                      </button>
                      <button onClick={() => removeAddress(a.id)} className="text-[#181513]/50 underline underline-offset-4 hover:text-red-700">
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>

          {addressOpen && (
            <form onSubmit={saveAddress} className="mt-6 border-t border-[#E3DFD7] pt-6">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#181513]">
                {editing ? 'Edit Address' : 'New Address'}
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {(['fullName', 'phone', 'addressLine1', 'addressLine2', 'city', 'state', 'postalCode'] as const).map(
                  (k) => (
                    <label key={k} className="block text-xs uppercase tracking-[0.14em] text-[#181513]/65">
                      {k.replace(/([A-Z])/g, ' $1')}
                      <input
                        required={k !== 'addressLine2'}
                        value={String(address[k] ?? '')}
                        onChange={(e) => setAddress({ ...address, [k]: e.target.value })}
                        className="mt-1.5 w-full border-b border-[#181513]/25 bg-transparent py-2 text-xs outline-none transition focus:border-[#B8860B]"
                      />
                    </label>
                  )
                )}
              </div>
              <label className="mt-4 flex items-center gap-2.5 text-xs text-[#181513]/70">
                <input
                  type="checkbox"
                  checked={address.isDefault}
                  onChange={(e) => setAddress({ ...address, isDefault: e.target.checked })}
                />
                Make default shipping destination
              </label>
              <div className="mt-6 flex gap-4">
                <button
                  disabled={savingAddress}
                  className="bg-[#181513] px-5 py-2.5 text-xs uppercase tracking-[0.16em] text-[#F7F5F0] hover:bg-[#2E2824]"
                >
                  {savingAddress ? 'Saving…' : 'Save Address'}
                </button>
                <button
                  type="button"
                  onClick={() => setAddressOpen(false)}
                  className="text-xs uppercase tracking-[0.16em] text-[#181513]/60 underline hover:text-[#181513]"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>
      </div>

      {/* Quick Access Links */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link
          href="/account/orders"
          className="flex items-center justify-between border border-[#E3DFD7] bg-white/20 p-5 text-xs font-medium uppercase tracking-[0.18em] text-[#181513] transition hover:border-[#181513]"
        >
          <span>Order History</span>
          <ArrowUpRight className="h-4 w-4 text-[#A66B18]" />
        </Link>
        <Link
          href="/account/returns"
          className="flex items-center justify-between border border-[#E3DFD7] bg-white/20 p-5 text-xs font-medium uppercase tracking-[0.18em] text-[#181513] transition hover:border-[#181513]"
        >
          <span>Returns & Refunds</span>
          <ArrowUpRight className="h-4 w-4 text-[#A66B18]" />
        </Link>
        <Link
          href="/account/notifications"
          className="flex items-center justify-between border border-[#E3DFD7] bg-white/20 p-5 text-xs font-medium uppercase tracking-[0.18em] text-[#181513] transition hover:border-[#181513]"
        >
          <span>Delivery Updates</span>
          <ArrowUpRight className="h-4 w-4 text-[#A66B18]" />
        </Link>
      </div>
    </main>
  );
}
