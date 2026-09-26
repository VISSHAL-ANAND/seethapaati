import Link from 'next/link';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[70vh]">
      <div className="mx-auto max-w-6xl px-6 pt-8 md:px-10">
        <nav className="flex flex-wrap gap-6 border-b border-[#E3DFD7] pb-5 text-[10px] uppercase tracking-[0.2em]">
          <Link href="/account" className="hover:text-[#B8860B]">Account</Link>
          <Link href="/account/orders" className="hover:text-[#B8860B]">Orders</Link>
          <Link href="/shop" className="hover:text-[#B8860B]">Shop</Link>
          <Link href="/cart" className="hover:text-[#B8860B]">Bag</Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
