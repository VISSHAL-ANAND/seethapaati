'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchApi } from '../../../lib/api-client';

function getSafeNext(value: string | null, fallback: string) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback;
  return value;
}

export default function RegisterPage() {
  const router = useRouter();
  const search = useSearchParams();
  const next = getSafeNext(search.get('next'), '/account/orders');
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await fetchApi('/auth/register', { method: 'POST', body: JSON.stringify(form) });
      await fetchApi('/cart/merge', { method: 'POST' }).catch(() => {});
      router.replace(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create account');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="editorial-page mx-auto max-w-md px-6 py-20 md:py-28">
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#B8860B]">
        New Customer
      </p>
      <h1 className="mt-4 font-serif text-5xl font-normal tracking-[-0.04em] text-[#181513] md:text-6xl">
        Create account
      </h1>

      {error && (
        <div role="alert" className="mt-6 border-l-2 border-red-700 bg-red-50 p-3 text-xs text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="mt-8 space-y-6">
        {([
          ['fullName', 'Full name', 'text'],
          ['email', 'Email', 'email'],
          ['phone', 'Phone (Optional)', 'tel'],
          ['password', 'Password', 'password'],
        ] as const).map(([key, label, type]) => (
          <label key={key} className="block text-xs font-medium uppercase tracking-[0.16em] text-[#181513]/70">
            {label}
            <input
              required={key !== 'phone'}
              type={type}
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className="mt-2 w-full border-b border-[#181513]/25 bg-transparent py-2.5 text-sm text-[#181513] outline-none transition focus:border-[#B8860B]"
            />
          </label>
        ))}
        <p className="text-xs leading-relaxed text-[#181513]/55">
          Password must contain at least 8 characters, including uppercase, lowercase, and a number.
        </p>
        <button
          disabled={loading}
          className="w-full bg-[#181513] px-6 py-4 text-xs uppercase tracking-[0.2em] text-[#F7F5F0] transition hover:bg-[#2E2824] disabled:opacity-50"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="mt-8 text-xs text-[#181513]/65">
        Already registered?{' '}
        <Link className="text-[#A66B18] underline underline-offset-4 hover:text-[#181513]" href={'/account/login?next=' + encodeURIComponent(next)}>
          Sign in
        </Link>
      </p>
    </main>
  );
}
