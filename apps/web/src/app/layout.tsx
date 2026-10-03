import type { Metadata } from 'next';
import Link from 'next/link';
import { Cormorant_Garamond, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Hairline } from '../components/ui/Hairline';
import { SiteHeader } from '../components/storefront/SiteHeader';

const cormorant = Cormorant_Garamond({ subsets:['latin'], weight:['400','500','600','700'], style:['normal','italic'], variable:'--font-serif', display:'swap' });
const plusJakarta = Plus_Jakarta_Sans({ subsets:['latin'], weight:['400','500','600','700'], variable:'--font-sans', display:'swap' });
const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || 'SEETHAPAATI';

export const metadata: Metadata = { title:{template:`%s | ${STORE_NAME}`,default:STORE_NAME}, description:'The Seethapaati collection and online store.' };

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en" className={`${cormorant.variable} ${plusJakarta.variable}`}><body className="min-h-screen flex flex-col bg-[#F7F5F0] text-[#181513] selection:bg-[#181513] selection:text-[#F7F5F0]"><SiteHeader/><main className="flex-grow">{children}</main><footer className="bg-[#241C18] text-[#F7F5F0] pt-16 pb-10 mt-24"><div className="mx-auto max-w-[1440px] px-6 md:px-10"><div className="grid gap-10 sm:grid-cols-2 md:grid-cols-12"><div className="sm:col-span-2 md:col-span-5"><Link href="/" className="font-serif text-3xl">SEETHAPAATI</Link><p className="mt-4 max-w-sm text-sm leading-7 text-[#F7F5F0]/65">A growing collection of everyday favourites, made to find a place in your kitchen.</p><Link href="/about" className="mt-5 inline-block text-[10px] uppercase tracking-[0.16em] text-[#D7A63B] hover:text-white">Our story ↗</Link></div><div className="md:col-span-3 md:col-start-7"><p className="text-[10px] uppercase tracking-[0.2em] text-[#F7F5F0]/45">Explore</p><div className="mt-4 flex flex-col gap-3 text-sm text-[#F7F5F0]/75"><Link href="/shop" className="hover:text-white">Shop</Link><Link href="/about" className="hover:text-white">About Us</Link><Link href="/contact" className="hover:text-white">Contact Us</Link><Link href="/cart" className="hover:text-white">Bag</Link><Link href="/account/orders" className="hover:text-white">Orders</Link></div></div><div className="md:col-span-3"><p className="text-[10px] uppercase tracking-[0.2em] text-[#F7F5F0]/45">Help & policies</p><div className="mt-4 flex flex-col gap-3 text-sm text-[#F7F5F0]/75"><Link href="/shipping" className="hover:text-white">Shipping Policy</Link><Link href="/returns" className="hover:text-white">Returns & Refunds</Link><Link href="/terms-and-conditions" className="hover:text-white">Terms & Conditions</Link><Link href="/privacy-policy" className="hover:text-white">Privacy Policy</Link></div></div></div><Hairline className="mt-12 bg-white/10"/><p className="pt-7 text-xs text-[#F7F5F0]/35">© {new Date().getFullYear()} SEETHAPAATI. All rights reserved.</p></div></footer></body></html>;
}