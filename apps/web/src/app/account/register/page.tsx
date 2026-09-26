'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchApi } from '../../../lib/api-client';

function getSafeNext(value: string | null, fallback: string) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\\\')) return fallback;
  return value;
}

export default function RegisterPage() {
  const router = useRouter();
  const search = useSearchParams();
  const next = getSafeNext(search.get('next'), '/account/orders');
  const [form, setForm] = useState({ fullName:'', email:'', phone:'', password:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await fetchApi('/auth/register', { method:'POST', body:JSON.stringify(form) });
      await fetchApi('/cart/merge', { method:'POST' });
      router.replace(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create account');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-20 md:py-28">
      <p className="text-[10px] uppercase tracking-[0.24em] text-[#B8860B]">New customer</p>
      <h1 className="mt-4 font-serif text-5xl">Create account</h1>
      <form onSubmit={submit} className="mt-10 space-y-6">
        {([['fullName','Full name','text'],['email','Email','email'],['phone','Phone','tel'],['password','Password','password']] as const).map(([key,label,type]) =>
          <label key={key} className="block text-xs uppercase tracking-[0.16em]">{label}<input required={key!=='phone'} type={type} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})} className="mt-2 w-full border-b border-[#181513]/25 bg-transparent py-3 outline-none" /></label>
        )}
        <p className="text-xs leading-5 text-[#181513]/50">Password must contain at least 8 characters, including uppercase, lowercase, and a number.</p>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button disabled={loading} className="w-full bg-[#181513] px-6 py-4 text-xs uppercase tracking-[0.18em] text-[#F7F5F0] disabled:opacity-50">{loading ? 'Creating…' : 'Create account'}</button>
      </form>
      <p className="mt-8 text-sm text-[#181513]/60">Already registered? <Link className="underline underline-offset-4" href={'/account/login?next='+encodeURIComponent(next)}>Sign in</Link></p>
    </main>
  );
}
