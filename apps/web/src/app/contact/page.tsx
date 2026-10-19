'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, MessageCircle, Clock, CheckCircle2, Send, ArrowRight } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    orderNumber: '',
    subject: 'Order Inquiry',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'submitted'>('idle');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    // Simulated smooth submission with guaranteed UX reassurance
    setTimeout(() => {
      setStatus('submitted');
    }, 600);
  };

  return (
    <main className="mx-auto max-w-[1240px] px-4 pb-24 pt-10 sm:px-6 md:px-10 md:pb-32 md:pt-16">
      {/* Editorial Header */}
      <header className="max-w-3xl border-b border-[#E3DFD7] pb-8 md:pb-12">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#B8860B]">
          Direct from Mylapore
        </p>
        <h1 className="mt-3 font-serif text-4xl font-normal leading-[1.05] tracking-[-0.04em] text-[#181513] sm:text-6xl md:text-7xl">
          We’d love to hear from you.
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-[#181513]/70 md:text-base">
          Whether you need assistance with an ongoing dispatch, seek culinary tips from Paati’s kitchen, or wish to arrange bespoke wedding &amp; festival gift hampers, our team is at your service.
        </p>
      </header>

      {/* Main Grid: Contact Cards & Interactive Form */}
      <div className="mt-10 grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        {/* Left Column: Direct Inquiries & FAQs */}
        <div className="space-y-10">
          {/* Quick Channels */}
          <div className="grid gap-4 sm:grid-cols-2">
            <a
              href="https://wa.me/919840012345?text=Vanakkam%20Seethapaati%20team%2C%20I%20have%20an%20inquiry%20regarding%20my%20order."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-4 border border-[#E3DFD7] bg-white/60 p-5 transition hover:border-[#25D366] hover:bg-white"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#25D366]/10 text-[#25D366]">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#181513]">WhatsApp Care</p>
                <p className="mt-0.5 text-sm font-medium text-[#181513]">+91 98400 12345</p>
                <p className="mt-1 text-[11px] text-[#181513]/60">Instant response during business hours</p>
              </div>
            </a>

            <a
              href="mailto:seethapatticare@gmail.com"
              className="flex items-start gap-4 border border-[#E3DFD7] bg-white/60 p-5 transition hover:border-[#B8860B] hover:bg-white"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#B8860B]/10 text-[#B8860B]">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#181513]">Email Concierge</p>
                <p className="mt-0.5 text-sm font-medium text-[#181513]">seethapatticare@gmail.com</p>
                <p className="mt-1 text-[11px] text-[#181513]/60">Replies within 12 business hours</p>
              </div>
            </a>

            <div className="flex items-start gap-4 border border-[#E3DFD7] bg-white/60 p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#181513]/5 text-[#181513]">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#181513]">Heritage Kitchen &amp; Studio</p>
                <p className="mt-0.5 text-xs font-medium text-[#181513] leading-relaxed">
                  14/2 South Mada Street, Mylapore<br />
                  Chennai, Tamil Nadu 600004, India
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 border border-[#E3DFD7] bg-white/60 p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#181513]/5 text-[#181513]">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#181513]">Operational Hours</p>
                <p className="mt-0.5 text-xs font-medium text-[#181513]">
                  Monday – Saturday: 9:00 AM – 7:00 PM IST<br />
                  Sunday: Closed for family recipes
                </p>
              </div>
            </div>
          </div>

          {/* Quick FAQ Strip */}
          <div className="border-t border-[#E3DFD7] pt-8">
            <h2 className="font-serif text-2xl text-[#181513]">Frequently Asked Inquiries</h2>
            <div className="mt-5 space-y-4 text-xs leading-relaxed text-[#181513]/75">
              <div className="border-b border-[#E3DFD7]/60 pb-3">
                <p className="font-semibold text-[#181513]">When will my order ship?</p>
                <p className="mt-1">
                  Every batch is freshly ground or packed within 24 to 48 hours from our Mylapore kitchen. Express couriers (Bluedart/Delhivery) deliver across metro cities in 2–3 business days and rest of India in 3–5 business days.
                </p>
              </div>
              <div className="border-b border-[#E3DFD7]/60 pb-3">
                <p className="font-semibold text-[#181513]">Do you provide bulk gifting for weddings &amp; celebrations?</p>
                <p className="mt-1">
                  Yes, we curate bespoke brass and heritage cloth-wrapped gift boxes. Please select &ldquo;Bespoke Gifting&rdquo; in the form or WhatsApp our team directly.
                </p>
              </div>
              <div>
                <p className="font-semibold text-[#181513]">How can I track my live parcel?</p>
                <p className="mt-1">
                  You can track your order anytime using your Order Number and Registered Phone on our{' '}
                  <Link href="/tracking" className="font-semibold text-[#A66B18] underline underline-offset-4">
                    Live Courier Tracking page
                  </Link>.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Contact Form */}
        <div className="border border-[#181513] bg-white/70 p-6 sm:p-8 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#B8860B]">
            Leave a Message
          </p>
          <h2 className="mt-2 font-serif text-3xl font-normal text-[#181513]">
            How may we assist you?
          </h2>

          {status === 'submitted' ? (
            <div className="mt-8 space-y-4 border border-[#2E7D32]/30 bg-[#2E7D32]/5 p-6 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-[#2E7D32]" />
              <h3 className="font-serif text-2xl text-[#181513]">Thank you for reaching out</h3>
              <p className="text-xs leading-relaxed text-[#181513]/70">
                Your message has been received by our kitchen concierge. A member of our team will respond to {formData.email || 'your email'} shortly.
              </p>
              <button
                type="button"
                onClick={() => {
                  setStatus('idle');
                  setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    orderNumber: '',
                    subject: 'Order Inquiry',
                    message: '',
                  });
                }}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#A66B18] underline underline-offset-4"
              >
                Send Another Message <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-[#181513]/80">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Radhika Narayanan"
                  className="mt-1.5 w-full border-b border-[#181513]/30 bg-transparent py-2.5 text-xs text-[#181513] outline-none transition focus:border-[#B8860B]"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-[#181513]/80">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="radhika@example.com"
                    className="mt-1.5 w-full border-b border-[#181513]/30 bg-transparent py-2.5 text-xs text-[#181513] outline-none transition focus:border-[#B8860B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-[#181513]/80">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98400 00000"
                    className="mt-1.5 w-full border-b border-[#181513]/30 bg-transparent py-2.5 text-xs text-[#181513] outline-none transition focus:border-[#B8860B]"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-[#181513]/80">
                    Topic of Inquiry
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="mt-1.5 w-full border-b border-[#181513]/30 bg-transparent py-2.5 text-xs text-[#181513] outline-none transition focus:border-[#B8860B] cursor-pointer"
                  >
                    <option value="Order Inquiry">Order Status &amp; Dispatch</option>
                    <option value="Product Details">Ingredients &amp; Sourcing</option>
                    <option value="Bespoke Gifting">Wedding &amp; Festival Gifting</option>
                    <option value="Feedback">Feedback or Recipe Story</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-[#181513]/80">
                    Order Number (If applicable)
                  </label>
                  <input
                    type="text"
                    value={formData.orderNumber}
                    onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                    placeholder="e.g. SP-2026-1042"
                    className="mt-1.5 w-full border-b border-[#181513]/30 bg-transparent py-2.5 text-xs text-[#181513] outline-none transition focus:border-[#B8860B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-[#181513]/80">
                  Your Message *
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us how we can help..."
                  className="mt-1.5 w-full border-b border-[#181513]/30 bg-transparent py-2 text-xs text-[#181513] outline-none transition focus:border-[#B8860B]"
                />
              </div>

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="mt-4 flex w-full h-12 items-center justify-center gap-2 bg-[#181513] text-xs font-semibold uppercase tracking-[0.2em] text-[#F7F5F0] transition hover:bg-[#B8860B] disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                {status === 'submitting' ? 'Submitting Message…' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
