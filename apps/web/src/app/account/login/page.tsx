'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchApi } from '../../../lib/api-client';

function getSafeNext(value: string | null, fallback: string) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback;
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
      await fetchApi('/cart/merge', { method: 'POST' }).catch(() => {});
      router.replace(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="editorial-page mx-auto max-w-md px-6 py-20 md:py-28">
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#B8860B]">
        Customer Account
      </p>
      <h1 className="mt-4 font-serif text-5xl font-normal tracking-[-0.04em] text-[#181513] md:text-6xl">
        Sign in
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-[#181513]/65">
        Sign in to view your orders, saved addresses, and active delivery tracking.
      </p>

      {error && (
        <div role="alert" className="mt-6 border-l-2 border-red-700 bg-red-50 p-3 text-xs text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="mt-8 space-y-6">
        <label className="block text-xs font-medium uppercase tracking-[0.16em] text-[#181513]/70">
          Email
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full border-b border-[#181513]/25 bg-transparent py-2.5 text-sm text-[#181513] outline-none transition focus:border-[#B8860B]"
          />
        </label>
        <label className="block text-xs font-medium uppercase tracking-[0.16em] text-[#181513]/70">
          Password
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full border-b border-[#181513]/25 bg-transparent py-2.5 text-sm text-[#181513] outline-none transition focus:border-[#B8860B]"
          />
        </label>
        <button
          disabled={loading}
          className="w-full bg-[#181513] px-6 py-4 text-xs uppercase tracking-[0.2em] text-[#F7F5F0] transition hover:bg-[#2E2824] disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="mt-8 text-xs text-[#181513]/65">
        New to Seethapaati?{' '}
        <Link className="text-[#A66B18] underline underline-offset-4 hover:text-[#181513]" href={'/account/register?next=' + encodeURIComponent(next)}>
          Create an account
        </Link>
      </p>
    </main>
  );
}
