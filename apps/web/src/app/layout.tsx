import type { Metadata } from 'next';
import { Cormorant_Garamond, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Hairline } from '../components/ui/Hairline';
import { SiteHeader } from '../components/storefront/SiteHeader';

const cormorant = Cormorant_Garamond({ subsets:['latin'], weight:['400','500','600','700'], style:['normal','italic'], variable:'--font-serif', display:'swap' });
const plusJakarta = Plus_Jakarta_Sans({ subsets:['latin'], weight:['400','500','600','700'], variable:'--font-sans', display:'swap' });
const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || 'SEETHAPAATI';

export const metadata: Metadata = { title:{template:`%s | ${STORE_NAME}`,default:STORE_NAME}, description:'The Seethapaati collection and online store.' };

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en" className={`${cormorant.variable} ${plusJakarta.variable}`}><body className="min-h-screen flex flex-col bg-[#F7F5F0] text-[#181513] selection:bg-[#181513] selection:text-[#F7F5F0]"><SiteHeader/><main className="flex-grow">{children}</main><footer className="bg-[#241C18] text-[#F7F5F0] pt-16 pb-10 mt-24"><div className="mx-auto max-w-[1440px] px-6 md:px-10"><div className="grid gap-10 md:grid-cols-12"><div className="md:col-span-5"><span className="font-serif text-3xl">SEETHAPAATI</span><p className="mt-4 max-w-sm text-sm leading-7 text-[#F7F5F0]/65">The Seethapaati collection is presented through a server-authoritative commerce system with live catalog, pricing, cart, checkout, order, and return workflows.</p></div><div className="md:col-span-3 md:col-start-7"><p className="text-[10px] uppercase tracking-[0.2em] text-[#F7F5F0]/45">Explore</p><div className="mt-4 space-y-2 text-sm"><a href="/shop">Shop</a><br/><a href="/cart">Bag</a><br/><a href="/account/orders">Orders</a></div></div><div className="md:col-span-3"><p className="text-[10px] uppercase tracking-[0.2em] text-[#F7F5F0]/45">Policies</p><div className="mt-4 space-y-2 text-sm"><a href="/shipping">Shipping</a><br/><a href="/returns">Returns</a></div></div></div><Hairline className="mt-12 bg-white/10"/><p className="pt-7 text-xs text-[#F7F5F0]/35">© {new Date().getFullYear()} SEETHAPAATI</p></div></footer></body></html>;
}