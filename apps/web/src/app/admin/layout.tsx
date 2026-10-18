'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShieldAlert, ShieldCheck, LogOut, ArrowLeft, RefreshCw } from 'lucide-react';
import { RoleName, type AuthUser } from '@seethapaati/contracts';
import { fetchApi, ApiClientError } from '../../lib/api-client';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === '/admin/login';

  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(!isLoginPage);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (isLoginPage) return;
    let active = true;

    async function checkAuth() {
      try {
        const authUser = await fetchApi<AuthUser>('/auth/me');
        if (!active) return;

        const roles = authUser.roles || [];
        const hasAdminAccess =
          roles.includes(RoleName.ADMIN) ||
          roles.includes(RoleName.STAFF) ||
          roles.includes(RoleName.MANAGER);

        if (!hasAdminAccess) {
          setUser(authUser);
          setDenied(true);
        } else {
          setUser(authUser);
          setDenied(false);
        }
      } catch (err) {
        if (!active) return;
        if (err instanceof ApiClientError && err.code === 'UNAUTHORIZED') {
          router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
        } else {
          // If network error or temporary issue, redirect to login
          router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    checkAuth();

    return () => {
      active = false;
    };
  }, [pathname, router, isLoginPage]);

  async function handleLogout() {
    try {
      await fetchApi('/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    router.replace('/admin/login');
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-8">
        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-[#181513]/60">
          <RefreshCw className="h-4 w-4 animate-spin text-[#B8860B]" />
          Verifying security authorization…
        </div>
      </div>
    );
  }

  // 403 Access Denied state (logged in as non-admin, e.g. CUSTOMER)
  if (denied && user) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 py-20 text-center">
        <div className="border border-red-300 bg-red-50/70 p-8 md:p-12 shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
            <ShieldAlert className="h-6 w-6" />
          </div>

          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-red-700">
            403 · Access Denied
          </p>
          <h1 className="mt-3 font-serif text-3xl font-normal text-[#181513] md:text-4xl">
            Administrative Privilege Required
          </h1>
          <p className="mt-4 text-xs leading-relaxed text-[#181513]/70">
            Signed in as <strong className="font-medium text-[#181513]">{user.email}</strong>. This account does not possess the required staff or administrator permissions to view or manage portal operations.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={handleLogout}
              className="bg-[#181513] px-6 py-3 text-[11px] uppercase tracking-[0.18em] text-[#F7F5F0] transition hover:bg-[#2E2824]"
            >
              Sign In with Admin Account
            </button>
            <Link
              href="/"
              className="border border-[#181513]/30 px-6 py-3 text-[11px] uppercase tracking-[0.18em] text-[#181513] transition hover:border-[#181513]"
            >
              Return to Storefront
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Links for authorized admin
  const links = [
    { href: '/admin', label: 'Operations & Fulfillment', exact: true },
    { href: '/admin/products', label: 'Products & Catalogue', exact: false },
    { href: '/account', label: 'My Account', exact: true },
    { href: '/shop', label: 'Storefront', exact: true },
  ];

  return (
    <div className="min-h-[75vh]">
      {/* Top Admin Bar */}
      <div className="border-b border-[#E3DFD7] bg-[#F7F5F0]/90">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-3 md:px-10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 border border-[#B8860B]/40 bg-[#B8860B]/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-[#B8860B]">
              <ShieldCheck className="h-3 w-3" />
              <span>{user?.roles?.join(', ') || 'ADMIN'}</span>
            </div>
            <span className="text-xs text-[#181513]/60">{user?.email}</span>
          </div>

          <div className="flex items-center gap-5">
            <Link
              href="/shop"
              className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-[#181513]/60 transition hover:text-[#181513]"
            >
              <ArrowLeft className="h-3 w-3" />
              View Storefront
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-[#181513]/70 transition hover:text-red-700"
              title="Sign out of admin console"
            >
              <LogOut className="h-3 w-3" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Admin Navigation */}
      <div className="mx-auto max-w-7xl px-6 pt-6 md:px-10">
        <nav className="flex flex-wrap gap-8 border-b border-[#E3DFD7] pb-4 text-[11px] uppercase tracking-[0.2em]">
          {links.map((link) => {
            const isActive = link.exact
              ? pathname === link.href
              : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  'relative py-1.5 transition-colors ' +
                  (isActive ? 'text-[#B8860B] font-semibold' : 'text-[#181513]/60 hover:text-[#181513]')
                }
              >
                {link.label}
                {isActive && (
                  <span className="absolute inset-x-0 -bottom-[17px] h-[2px] bg-[#B8860B]" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {children}
    </div>
  );
}
