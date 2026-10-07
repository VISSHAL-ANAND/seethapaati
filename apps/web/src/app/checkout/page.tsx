'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldCheck, Lock, Check } from 'lucide-react';
import type { CartResponse, UserProfile } from '@seethapaati/contracts';
import { fetchApi, ApiClientError } from '../../lib/api-client';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

type Address = {
  id?: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

const emptyAddress: Address = {
  fullName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'IN',
  isDefault: true,
};

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [address, setAddress] = useState<Address>(emptyAddress);
  const [stateCode, setStateCode] = useState('');
  const [coupon, setCoupon] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchApi<CartResponse>('/cart'),
      fetchApi<UserProfile>('/users/me'),
      fetchApi<Address[]>('/users/me/addresses'),
    ])
      .then(([nextCart, nextProfile, nextAddresses]) => {
        setCart(nextCart);
        setProfile(nextProfile);
        setAddresses(nextAddresses);
        const preferred = nextAddresses.find((a) => a.isDefault) ?? nextAddresses[0];
        if (preferred) setAddress(preferred);
        else setAddress((a) => ({ ...a, fullName: nextProfile.fullName, phone: nextProfile.phone ?? '' }));
      })
      .catch((err) => {
        if (err instanceof ApiClientError && ['UNAUTHORIZED', 'USER_NOT_FOUND'].includes(err.code)) {
          router.replace('/account/login?next=/checkout');
        } else {
          setError(err instanceof Error ? err.message : 'Unable to load checkout');
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  function setField<K extends keyof Address>(key: K, value: Address[K]) {
    setAddress((a) => ({ ...a, [key]: value }));
  }

  async function saveAddress() {
    setSavingAddress(true);
    try {
      const saved = await fetchApi<Address>('/users/me/addresses', {
        method: 'POST',
        body: JSON.stringify({ ...address, isDefault: addresses.length === 0 }),
      });
      setAddresses((a) => [...a, saved]);
      setAddress(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save address');
    } finally {
      setSavingAddress(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!cart || !profile || cart.items.length === 0) return;
    setError('');
    setPaying(true);

    try {
      const shippingAddress = { ...address, stateCode, country: 'IN' };
      if (
        !shippingAddress.fullName ||
        !shippingAddress.phone ||
        !shippingAddress.addressLine1 ||
        !shippingAddress.city ||
        !shippingAddress.state ||
        !shippingAddress.postalCode ||
        !/^[0-9]{2}$/.test(stateCode)
      ) {
        throw new Error('Please complete the shipping address and enter a valid two-digit GST state code.');
      }

      const intent = await fetchApi<{
        orderId: string;
        orderNumber: string;
        amountCents: number;
        currency: string;
        gateway: string;
        gatewayOrderId: string;
        gatewayKeyId: string;
      }>('/checkout/intent', {
        method: 'POST',
        body: JSON.stringify({
          cartId: cart.cartId,
          shippingAddress,
          couponCode: coupon.trim() || undefined,
          idempotencyKey: crypto.randomUUID(),
        }),
      });

      if (intent.gateway !== 'RAZORPAY') throw new Error('Unsupported payment gateway');
      if (!window.Razorpay) throw new Error('Payment checkout is still loading. Please try again.');

      const payment = new window.Razorpay({
        key: intent.gatewayKeyId,
        amount: intent.amountCents,
        currency: intent.currency,
        name: 'SEETHAPAATI',
        order_id: intent.gatewayOrderId,
        prefill: {
          name: shippingAddress.fullName,
          email: profile.email,
          contact: shippingAddress.phone,
        },
        handler: async (response: Record<string, string>) => {
          try {
            await fetchApi('/checkout/verify', {
              method: 'POST',
              body: JSON.stringify({
                orderId: intent.orderId,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            router.replace('/orders/' + intent.orderId + '/confirmation');
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Payment verification failed');
            setPaying(false);
          }
        },
        modal: {
          ondismiss: () => setPaying(false),
        },
      });

      payment.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to initialize payment');
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
        <main className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="animate-pulse space-y-8">
            <div className="h-8 w-64 bg-[#ECE8E0]" />
            <div className="grid gap-10 md:grid-cols-[1fr_360px]">
              <div className="h-96 bg-[#ECE8E0]" />
              <div className="h-80 bg-[#ECE8E0]" />
            </div>
          </div>
        </main>
      </>
    );
  }

  if (error && !cart) {
    return (
      <>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
        <main className="mx-auto max-w-2xl px-6 py-28 text-center md:py-36">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#B8860B]">
            Checkout Gateway
          </p>
          <h1 className="mt-4 font-serif text-4xl text-[#181513]">
            Checkout Unavailable
          </h1>
          <p className="mt-3 text-sm text-red-700">{error}</p>
          <Link
            href="/cart"
            className="mt-8 inline-flex items-center gap-2 border border-[#181513] px-6 py-3 text-xs uppercase tracking-[0.16em] text-[#181513] hover:bg-[#181513] hover:text-[#F7F5F0] transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Return to Bag
          </Link>
        </main>
      </>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
        <main className="mx-auto max-w-2xl px-6 py-28 text-center md:py-36">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#B8860B]">
            Secure Checkout
          </p>
          <h1 className="mt-4 font-serif text-4xl text-[#181513] md:text-5xl">
            Your bag is empty.
          </h1>
          <p className="mt-3 text-sm text-[#181513]/60">
            Please add selections to your shopping bag before proceeding to checkout.
          </p>
          <Link
            href="/shop"
            className="mt-8 inline-flex items-center gap-2 bg-[#181513] px-6 py-3 text-xs uppercase tracking-[0.18em] text-[#F7F5F0] transition hover:bg-[#2E2824]"
          >
            Explore the Collection
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <main className="mx-auto max-w-[1280px] px-6 pb-24 pt-10 md:px-10 md:pb-32 md:pt-16">
        {/* Header */}
        <header className="border-b border-[#E3DFD7] pb-8">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#B8860B]">
                Secure Checkout
              </p>
              <h1 className="mt-3 font-serif text-5xl font-normal tracking-[-0.04em] text-[#181513] md:text-7xl">
                Delivery Details
              </h1>
            </div>
            <Link
              href="/cart"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[#181513]/60 transition hover:text-[#181513]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Bag
            </Link>
          </div>
          <p className="mt-3 max-w-2xl text-xs leading-relaxed text-[#181513]/60">
            Final item pricing, GST calculation, inventory reservation, and delivery amounts are strictly authoritative and re-validated server-side.
          </p>
        </header>

        {/* Checkout Form */}
        <form onSubmit={submit} className="mt-10 grid gap-12 md:mt-14 md:grid-cols-[1fr_360px] lg:gap-16">
          <section className="space-y-10">
            {/* Saved Addresses */}
            {addresses.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#181513]/60">
                  Select Saved Address
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {addresses.map((a) => (
                    <button
                      type="button"
                      key={a.id}
                      onClick={() => setAddress(a)}
                      className={`w-full border p-4 text-left text-xs transition-colors ${
                        address.id === a.id
                          ? 'border-[#181513] bg-white/50 shadow-xs'
                          : 'border-[#E3DFD7] hover:border-[#B8860B]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-[#181513]">{a.fullName}</span>
                        {a.isDefault && (
                          <span className="text-[10px] uppercase tracking-wider text-[#A66B18]">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[#181513]/70">
                        {a.addressLine1}, {a.city}, {a.state} {a.postalCode}
                      </p>
                      <p className="mt-1 text-[11px] text-[#181513]/50">{a.phone}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Delivery Address Form */}
            <div className="border-t border-[#181513] pt-7">
              <p className="text-xs uppercase tracking-[0.2em] text-[#181513]/60">
                Shipping Destination
              </p>

              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                {([
                  ['fullName', 'Full Name'],
                  ['phone', 'Phone Number'],
                  ['addressLine1', 'Address Line 1'],
                  ['addressLine2', 'Apartment, Suite (Optional)'],
                  ['city', 'City'],
                  ['state', 'State'],
                  ['postalCode', 'Postal Code / PIN'],
                ] as const).map(([key, label]) => (
                  <label key={key} className="block text-xs font-medium uppercase tracking-[0.16em] text-[#181513]/70">
                    {label}
                    <input
                      required={key !== 'addressLine2'}
                      value={String(address[key] ?? '')}
                      onChange={(e) => setField(key, e.target.value)}
                      className="mt-2 w-full border-b border-[#181513]/25 bg-transparent py-2.5 text-xs text-[#181513] outline-none transition focus:border-[#B8860B]"
                    />
                  </label>
                ))}

                <label className="block text-xs font-medium uppercase tracking-[0.16em] text-[#181513]/70">
                  GST State Code (2-Digit)
                  <input
                    required
                    value={stateCode}
                    maxLength={2}
                    inputMode="numeric"
                    pattern="[0-9]{2}"
                    placeholder="e.g. 33 for Tamil Nadu"
                    onChange={(e) => setStateCode(e.target.value.replace(/\D/g, '').slice(0, 2))}
                    className="mt-2 w-full border-b border-[#181513]/25 bg-transparent py-2.5 text-xs text-[#181513] outline-none transition focus:border-[#B8860B]"
                  />
                </label>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  disabled={savingAddress}
                  onClick={() => saveAddress()}
                  className="text-xs text-[#A66B18] underline underline-offset-4 hover:text-[#181513] disabled:opacity-50"
                >
                  {savingAddress ? 'Saving address…' : 'Save this address for future orders'}
                </button>
              </div>
            </div>

            {/* Coupon Code */}
            <div className="border-t border-[#E3DFD7] pt-7">
              <label className="block text-xs font-medium uppercase tracking-[0.16em] text-[#181513]/70">
                Promotional Coupon Code <span className="text-[#181513]/40">(Optional)</span>
                <input
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                  placeholder="e.g. WELCOME10"
                  className="mt-2 w-full max-w-xs border-b border-[#181513]/25 bg-transparent py-2.5 text-xs uppercase tracking-wider text-[#181513] outline-none transition focus:border-[#B8860B]"
                />
              </label>
            </div>

            {error && (
              <p role="alert" className="border-l-2 border-red-700 bg-red-50 p-3 text-xs text-red-800">
                {error}
              </p>
            )}
          </section>

          {/* Order Summary Aside */}
          <aside className="h-fit border-t border-[#181513] pt-6 md:sticky md:top-10">
            <p className="text-xs uppercase tracking-[0.2em] text-[#181513]/60">
              Order Summary
            </p>

            <div className="mt-6 space-y-3.5 text-xs text-[#181513]">
              <div className="flex justify-between">
                <span className="text-[#181513]/70">Subtotal</span>
                <span className="tabular-nums font-medium">
                  ₹{(cart.pricing.subtotalCents / 100).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-[#181513]/70">Tax (GST)</span>
                <span className="tabular-nums font-medium">
                  ₹{(cart.pricing.taxCents / 100).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-[#181513]/70">Delivery</span>
                <span className="tabular-nums font-medium">
                  {cart.pricing.shippingCents === 0 ? (
                    <span className="text-[#2E7D32]">Free</span>
                  ) : (
                    `₹${(cart.pricing.shippingCents / 100).toLocaleString('en-IN')}`
                  )}
                </span>
              </div>

              {cart.pricing.discountCents > 0 && (
                <div className="flex justify-between text-[#B8860B]">
                  <span>Discount</span>
                  <span className="tabular-nums font-medium">
                    −₹{(cart.pricing.discountCents / 100).toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-between border-t border-[#E3DFD7] pt-5 font-serif text-2xl text-[#181513]">
              <span>Grand Total</span>
              <span className="tabular-nums">
                ₹{(cart.pricing.grandTotalCents / 100).toLocaleString('en-IN')}
              </span>
            </div>

            <button
              type="submit"
              disabled={paying}
              className="mt-7 flex w-full items-center justify-center gap-2 bg-[#181513] px-6 py-4 text-xs uppercase tracking-[0.2em] text-[#F7F5F0] transition hover:bg-[#2E2824] disabled:opacity-50"
            >
              <Lock className="h-3.5 w-3.5" />
              {paying ? 'Connecting Gateway…' : 'Proceed to Payment'}
            </button>

            <p className="mt-4 text-center text-[11px] text-[#181513]/40">
              Encrypted end-to-end payment processing via Razorpay
            </p>
          </aside>
        </form>
      </main>
    </>
  );
}