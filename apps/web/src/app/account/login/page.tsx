'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchApi } from '../../../lib/api-client';

function getSafeNext(value: string | null, fallback: string) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\\\')) return fallback;
  return value;
}

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const next = getSafeNext(search.get('next'), '/account/orders');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await fetchApi('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      await fetchApi('/cart/merge', { method: 'POST' });
      router.replace(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="editorial-page mx-auto max-w-md px-6 py-20 md:py-28">
      <p className="eyebrow"><span className="eyebrow-dot" /> Your account</p>
      <h1 className="mt-5 font-serif text-5xl font-normal tracking-[-0.05em] md:text-7xl">Sign in</h1>
      <p className="mt-5 text-sm leading-7 text-[#181513]/60">Sign in to continue to your orders and checkout.</p>
      <form onSubmit={submit} className="mt-10 space-y-6">
        <label className="block text-xs uppercase tracking-[0.16em]">Email<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 w-full border-b border-[#181513]/25 bg-transparent py-3 outline-none" /></label>
        <label className="block text-xs uppercase tracking-[0.16em]">Password<input required type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full border-b border-[#181513]/25 bg-transparent py-3 outline-none" /></label>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button disabled={loading} className="w-full bg-[#181513] px-6 py-4 text-xs uppercase tracking-[0.18em] text-[#F7F5F0] disabled:opacity-50">{loading ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <p className="mt-8 text-sm text-[#181513]/60">New here? <Link className="underline underline-offset-4" href={'/account/register?next='+encodeURIComponent(next)}>Create an account</Link></p>
    </main>
  );
}
