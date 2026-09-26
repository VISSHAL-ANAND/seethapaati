import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[70vh]">
      <div className="mx-auto max-w-7xl px-6 pt-8 md:px-10">
        <nav className="flex flex-wrap gap-6 border-b border-[#E3DFD7] pb-5 text-[10px] uppercase tracking-[0.2em]">
          <Link href="/admin">Operations</Link>
          <Link href="/account">Account</Link>
          <Link href="/account/orders">Orders</Link>
          <Link href="/shop">Shop</Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
