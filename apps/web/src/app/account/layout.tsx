'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const links = [
    { href: '/account', label: 'Overview' },
    { href: '/account/orders', label: 'Orders' },
    { href: '/account/returns', label: 'Returns' },
    { href: '/account/notifications', label: 'Notifications' },
  ];

  return (
    <div className="min-h-[70vh]">
      <div className="mx-auto max-w-[1280px] px-6 pt-6 md:px-10 md:pt-9">
        <nav aria-label="Account navigation" className="flex gap-6 overflow-x-auto border-b border-[#E3DFD7] pb-4 text-[9px] uppercase tracking-[0.18em] md:gap-9">
          {links.map((link) => {
            const active = link.href === '/account'
              ? pathname === link.href
              : pathname === link.href || pathname.startsWith(link.href + '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={'relative shrink-0 py-2 transition-colors hover:text-[#A66B18] ' + (active ? 'text-[#A66B18]' : 'text-[#181513]/55')}
              >
                {link.label}
                {active && <span className="absolute inset-x-0 -bottom-[17px] h-px bg-[#B8860B]" />}
              </Link>
            );
          })}
          <Link href="/shop" className="shrink-0 py-2 text-[#181513]/55 transition-colors hover:text-[#A66B18]">Shop</Link>
          <Link href="/cart" className="shrink-0 py-2 text-[#181513]/55 transition-colors hover:text-[#A66B18]">Bag</Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
