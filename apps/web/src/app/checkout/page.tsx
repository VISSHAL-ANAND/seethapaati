'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { CartResponse, UserProfile } from '@seethapaati/contracts';
import { fetchApi, ApiClientError } from '../../lib/api-client';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

type Address = { id?: string; fullName:string; phone:string; addressLine1:string; addressLine2?:string; city:string; state:string; postalCode:string; country:string; isDefault:boolean };

const emptyAddress: Address = { fullName:'', phone:'', addressLine1:'', addressLine2:'', city:'', state:'', postalCode:'', country:'IN', isDefault:true };

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartResponse|null>(null);
  const [profile, setProfile] = useState<UserProfile|null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [address, setAddress] = useState<Address>(emptyAddress);
  const [stateCode, setStateCode] = useState('');
  const [coupon, setCoupon] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchApi<CartResponse>('/cart'),
      fetchApi<UserProfile>('/users/me'),
      fetchApi<Address[]>('/users/me/addresses'),
    ]).then(([nextCart, nextProfile, nextAddresses]) => {
      setCart(nextCart); setProfile(nextProfile); setAddresses(nextAddresses);
      const preferred = nextAddresses.find(a=>a.isDefault) ?? nextAddresses[0];
      if (preferred) setAddress(preferred);
      else setAddress(a=>({ ...a, fullName:nextProfile.fullName, phone:nextProfile.phone ?? '' }));
    }).catch(err => {
      if (err instanceof ApiClientError && ['UNAUTHORIZED','AUTH_REQUIRED','TOKEN_INVALID'].includes(err.code)) router.replace('/account/login?next=/checkout');
      else setError(err instanceof Error ? err.message : 'Unable to load checkout');
    }).finally(()=>setLoading(false));
  }, [router]);

  function setField<K extends keyof Address>(key:K,value:Address[K]) { setAddress(a=>({...a,[key]:value})); }

  async function createAddress() {
    const saved = await fetchApi<Address>('/users/me/addresses', { method:'POST', body:JSON.stringify({...address, isDefault:addresses.length===0}) });
    setAddresses(a=>[...a,saved]); setAddress(saved);
  }

  async function submit(event:FormEvent) {
    event.preventDefault();
    if (!cart || !profile || cart.items.length===0) return;
    setError(''); setPaying(true);
    try {
      const selectedAddress = {...address, stateCode, country:'IN'};
      if (!selectedAddress.fullName || !selectedAddress.phone || !selectedAddress.addressLine1 || !selectedAddress.city || !selectedAddress.state || !selectedAddress.postalCode || !stateCode) throw new Error('Complete the shipping address and two-digit GST state code.');
      const intent = await fetchApi<{orderId:string;orderNumber:string;amountCents:number;currency:string;gateway:string;gatewayOrderId:string;gatewayKeyId:string}>('/checkout/intent', {
        method:'POST',
        body:JSON.stringify({cartId:cart.cartId,shippingAddress:selectedAddress,couponCode:coupon.trim()||undefined,idempotencyKey:crypto.randomUUID()}),
      });
      if (intent.gateway !== 'RAZORPAY') throw new Error('Unsupported payment gateway');
      if (!window.Razorpay) throw new Error('Payment checkout is still loading. Please try again.');
      const payment = new window.Razorpay({
        key:intent.gatewayKeyId, amount:intent.amountCents, currency:intent.currency, name:'SEETHAPAATI',
        order_id:intent.gatewayOrderId, prefill:{name:selectedAddress.fullName,email:profile.email,contact:selectedAddress.phone},
        handler:async (response:Record<string,string>)=>{
          try {
            await fetchApi('/checkout/verify',{method:'POST',body:JSON.stringify({orderId:intent.orderId,razorpay_payment_id:response.razorpay_payment_id,razorpay_order_id:response.razorpay_order_id,razorpay_signature:response.razorpay_signature})});
            router.replace('/orders/'+intent.orderId+'/confirmation');
          } catch(err) { setError(err instanceof Error ? err.message : 'Payment verification failed'); setPaying(false); }
        },
        modal:{ondismiss:()=>setPaying(false)},
      });
      payment.open();
    } catch(err) {
      setError(err instanceof Error ? err.message : 'Unable to start payment');
      setPaying(false);
    }
  }

  if (loading) return <main className="mx-auto max-w-6xl px-6 py-32 text-center text-[10px] uppercase tracking-[0.2em]">Preparing checkout</main>;
  if (error && !cart) return <main className="mx-auto max-w-3xl px-6 py-32 text-center"><h1 className="font-serif text-4xl">Checkout unavailable</h1><p className="mt-4 text-sm text-red-700">{error}</p></main>;
  if (!cart || cart.items.length===0) return <main className="mx-auto max-w-3xl px-6 py-32 text-center"><h1 className="font-serif text-4xl">Your bag is empty.</h1><Link href="/shop" className="mt-6 inline-block underline">Return to shop</Link></main>;

  return (
    <main className="mx-auto max-w-6xl px-6 py-14 md:py-24">
      <div className="max-w-2xl"><p className="text-[10px] uppercase tracking-[0.24em] text-[#B8860B]">Secure checkout</p><h1 className="mt-4 font-serif text-5xl">Delivery details</h1><p className="mt-5 text-sm leading-7 text-[#181513]/60">Final tax and order totals are calculated by the commerce API when the checkout intent is created.</p></div>
      <form onSubmit={submit} className="mt-12 grid gap-14 md:grid-cols-[1fr_360px]">
        <section className="space-y-8">
          {addresses.length>0 && <div><p className="text-[10px] uppercase tracking-[0.2em] text-[#181513]/50">Saved addresses</p><div className="mt-4 grid gap-3">{addresses.map(a=><button type="button" key={a.id} onClick={()=>{setAddress(a);setStateCode('')}} className={'w-full border p-4 text-left text-sm '+(address.id===a.id?'border-[#181513]':'border-[#E3DFD7]')}><span className="font-medium">{a.fullName}</span><br/>{a.addressLine1}, {a.city}, {a.state} {a.postalCode}</button>)}</div></div>}
          <div className="grid gap-6 sm:grid-cols-2">
            {([['fullName','Full name'],['phone','Phone'],['addressLine1','Address line 1'],['addressLine2','Address line 2'],['city','City'],['state','State'],['postalCode','Postal code']] as const).map(([key,label])=><label key={key} className="block text-xs uppercase tracking-[0.14em]">{label}<input required={key!=='addressLine2'} value={String(address[key]??'')} onChange={e=>setField(key,e.target.value)} className="mt-2 w-full border-b border-[#181513]/25 bg-transparent py-3 outline-none" /></label>)}
            <label className="block text-xs uppercase tracking-[0.14em]">GST state code<input required value={stateCode} maxLength={2} inputMode="numeric" pattern="[0-9]{2}" placeholder="e.g. 33" onChange={e=>setStateCode(e.target.value.replace(/\D/g,'').slice(0,2))} className="mt-2 w-full border-b border-[#181513]/25 bg-transparent py-3 outline-none" /></label>
          </div>
          {addresses.length===0 && <button type="button" onClick={()=>createAddress().catch(e=>setError(e.message))} className="text-xs underline underline-offset-4">Save this address to my account</button>}
          <div className="border-t border-[#E3DFD7] pt-7"><label className="block text-xs uppercase tracking-[0.14em]">Coupon code (optional)<input value={coupon} onChange={e=>setCoupon(e.target.value)} className="mt-2 w-full max-w-xs border-b border-[#181513]/25 bg-transparent py-3 outline-none" /></label></div>
          {error && <p className="text-sm text-red-700">{error}</p>}
        </section>
        <aside className="h-fit border-t border-[#181513] pt-6">
          <div className="space-y-3 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>₹{(cart.pricing.subtotalCents/100).toLocaleString('en-IN')}</span></div><div className="flex justify-between"><span>Tax</span><span>₹{(cart.pricing.taxCents/100).toLocaleString('en-IN')}</span></div><div className="flex justify-between"><span>Shipping</span><span>₹{(cart.pricing.shippingCents/100).toLocaleString('en-IN')}</span></div>{cart.pricing.discountCents>0&&<div className="flex justify-between"><span>Discount</span><span>-₹{(cart.pricing.discountCents/100).toLocaleString('en-IN')}</span></div>}</div>
          <div className="mt-6 flex justify-between border-t border-[#E3DFD7] pt-5 font-serif text-2xl"><span>Current total</span><span>₹{(cart.pricing.grandTotalCents/100).toLocaleString('en-IN')}</span></div>
          <p className="mt-3 text-[11px] leading-5 text-[#181513]/50">The server recalculates price, tax, stock and the final amount before payment.</p>
          <button disabled={paying} className="mt-7 w-full bg-[#181513] px-6 py-4 text-xs uppercase tracking-[0.18em] text-[#F7F5F0] disabled:opacity-50">{paying?'Opening payment…':'Continue to payment'}</button>
        </aside>
      </form>
    </main>
  );
}
